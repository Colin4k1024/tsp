/// File-backed gene store built on top of `oris_runtime::graph::InMemoryStore`.
///
/// # Why oris InMemoryStore?
/// oris's `Store` trait provides a namespace/key abstraction that cleanly separates
/// gene records (`["genes"]` namespace) from event logs (`["events"]` namespace).
/// We wrap `InMemoryStore` with a file-persistence layer so genes survive across
/// invocations, while all in-process reads/writes use the fast in-memory path.
///
/// Layout on disk (backward-compatible with the Python evolution store):
/// ```text
/// ~/.claude/evolution/
///   genes.json       ← array of ClaudeGene (canonical serialised form)
///   events.jsonl     ← append-only JSONL event log
/// ```
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use std::sync::Arc;

use anyhow::{Context, Result};
use async_trait::async_trait;
use chrono::Utc;
use serde_json::Value;

// oris persistence API
use oris_runtime::graph::{
    InMemoryStore, PersistenceError, Store, StoreItem,
};

use crate::claude_gene::*;

// ── Store ────────────────────────────────────────────────────────────────────

/// Gene namespace inside the oris InMemoryStore
const NS_GENES: &[&str] = &["genes"];

/// A gene store that delegates reads/writes to `oris_runtime::graph::InMemoryStore`
/// and persists to `genes.json` via an atomic write on every mutation.
pub struct FileBackedGeneStore {
    inner: Arc<InMemoryStore>,
    genes_path: PathBuf,
    events_path: PathBuf,
}

impl FileBackedGeneStore {
    // ── Construction ─────────────────────────────────────────────────────────

    /// Load an existing store from `root`, or create an empty one.
    pub async fn load(root: PathBuf) -> Result<Self> {
        let genes_path = root.join("genes.json");
        let events_path = root.join("events.jsonl");
        let inner = Arc::new(InMemoryStore::new());

        if genes_path.exists() {
            let data = fs::read_to_string(&genes_path)
                .with_context(|| format!("reading {}", genes_path.display()))?;
            let genes: Vec<ClaudeGene> =
                serde_json::from_str(&data).with_context(|| "parsing genes.json")?;

            // Populate the oris InMemoryStore using the namespace/key model
            for gene in genes {
                let val = serde_json::to_value(&gene)?;
                inner
                    .put(NS_GENES, &gene.gene_id, val)
                    .await
                    .map_err(|e| anyhow::anyhow!("store put: {e}"))?;
            }
        }

        Ok(Self { inner, genes_path, events_path })
    }

    /// Default root directory.
    pub fn default_root() -> PathBuf {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
        PathBuf::from(home).join(".claude").join("evolution")
    }

    // ── Persistence ──────────────────────────────────────────────────────────

    /// Serialise all in-memory genes back to `genes.json` (atomic write).
    pub async fn flush(&self) -> Result<()> {
        let genes = self.all_genes().await?;
        fs::create_dir_all(
            self.genes_path
                .parent()
                .unwrap_or_else(|| std::path::Path::new(".")),
        )?;
        let data = serde_json::to_string_pretty(&genes)?;
        let tmp = self.genes_path.with_extension("json.tmp");
        fs::write(&tmp, &data)?;
        fs::rename(&tmp, &self.genes_path)?;
        Ok(())
    }

    /// Append one event to `events.jsonl`.
    pub fn append_event(&self, event: &Value) -> Result<()> {
        fs::create_dir_all(
            self.events_path
                .parent()
                .unwrap_or_else(|| std::path::Path::new(".")),
        )?;
        let mut f = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&self.events_path)?;
        writeln!(f, "{}", serde_json::to_string(event)?)?;
        Ok(())
    }

    // ── Query helpers ────────────────────────────────────────────────────────

    /// Return all genes from the oris InMemoryStore.
    pub async fn all_genes(&self) -> Result<Vec<ClaudeGene>> {
        let items = self
            .inner
            .search(NS_GENES, None, None)
            .await
            .map_err(|e| anyhow::anyhow!("store search: {e}"))?;
        let genes = items
            .iter()
            .filter_map(|item| serde_json::from_value::<ClaudeGene>(item.value.clone()).ok())
            .collect();
        Ok(genes)
    }

    /// Find promoted genes whose signals overlap with `hints`, sorted by
    /// descending confidence.  Mirrors Python `store.py#_query_by_signals()`.
    pub async fn query_genes_by_signals(&self, hints: &[String]) -> Result<Vec<ClaudeGene>> {
        let mut matches: Vec<ClaudeGene> = self
            .all_genes()
            .await?
            .into_iter()
            .filter(|g| {
                g.state == "promoted"
                    && g.confidence >= CONFIDENCE_FLOOR
                    && g.matches_signals(hints)
            })
            .collect();
        matches.sort_by(|a, b| {
            b.confidence
                .partial_cmp(&a.confidence)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        Ok(matches)
    }

    // ── Mutation helpers ─────────────────────────────────────────────────────

    /// Update a gene in-place via a closure, then write it back to the oris
    /// InMemoryStore.  Caller must call `flush()` afterwards to persist.
    pub async fn update_gene<F>(&self, gene_id: &str, f: F) -> Result<()>
    where
        F: FnOnce(&mut ClaudeGene),
    {
        let item = self
            .inner
            .get(NS_GENES, gene_id)
            .await
            .map_err(|e| anyhow::anyhow!("store get: {e}"))?;
        if let Some(item) = item {
            let mut gene: ClaudeGene = serde_json::from_value(item.value)?;
            f(&mut gene);
            gene.updated_at = Utc::now();
            let val = serde_json::to_value(&gene)?;
            self.inner
                .put(NS_GENES, gene_id, val)
                .await
                .map_err(|e| anyhow::anyhow!("store put: {e}"))?;
        }
        Ok(())
    }

    /// Apply confidence change for a gene reuse outcome (success or failure).
    /// Promotes/quarantines/revokes genes automatically.
    pub async fn record_reuse(&self, gene_id: &str, success: bool) -> Result<()> {
        self.update_gene(gene_id, |g| {
            g.stats.total_uses += 1;
            if success {
                g.stats.successes += 1;
                g.confidence = (g.confidence + CONFIDENCE_INCREMENT).min(CONFIDENCE_CAP);
                if g.state == "candidate"
                    && g.confidence >= PROMOTE_THRESHOLD
                    && g.stats.total_uses >= PROMOTE_MIN_USES
                {
                    g.state = "promoted".to_string();
                }
            } else {
                g.stats.failures += 1;
                g.confidence = (g.confidence - CONFIDENCE_DECREMENT).max(CONFIDENCE_FLOOR);
                if g.confidence < QUARANTINE_CONFIDENCE && g.stats.failures >= 3 {
                    g.state = "quarantined".to_string();
                }
                if g.confidence <= REVOKE_CONFIDENCE {
                    g.state = "revoked".to_string();
                }
            }
        })
        .await?;
        self.flush().await
    }

    /// Create a brand-new candidate gene and persist it via the oris Store.
    pub async fn create_gene(
        &self,
        signals: Vec<Signal>,
        strategy: Strategy,
        tags: Vec<String>,
        env_fp: Value,
    ) -> Result<String> {
        let gene_id = crate::store::generate_gene_id();
        let now = Utc::now();
        let gene = ClaudeGene {
            gene_id: gene_id.clone(),
            signals,
            strategy,
            validation_rules: serde_json::json!({}),
            confidence: 0.5,
            state: "candidate".to_string(),
            tags,
            env_fingerprint: env_fp,
            stats: GeneStats {
                total_uses: 0,
                successes: 0,
                failures: 0,
            },
            source: serde_json::json!({"source_type": "auto-solidify"}),
            created_at: now,
            updated_at: now,
        };

        let val = serde_json::to_value(&gene)?;
        // Store in oris InMemoryStore under ["genes"] namespace
        self.inner
            .put(NS_GENES, &gene_id, val)
            .await
            .map_err(|e| anyhow::anyhow!("store put: {e}"))?;
        self.flush().await?;

        self.append_event(&serde_json::json!({
            "type": "gene_created",
            "gene_id": gene_id,
            "signals": gene.signals,
            "timestamp": now.to_rfc3339(),
        }))?;

        Ok(gene_id)
    }
}

// ── oris Store trait impl ────────────────────────────────────────────────────
// Implement oris's Store so FileBackedGeneStore can be passed as a StoreBox to
// function_node_with_store nodes.

#[async_trait]
impl Store for FileBackedGeneStore {
    async fn put(
        &self,
        namespace: &[&str],
        key: &str,
        value: Value,
    ) -> Result<(), PersistenceError> {
        self.inner.put(namespace, key, value).await
    }

    async fn get(
        &self,
        namespace: &[&str],
        key: &str,
    ) -> Result<Option<StoreItem>, PersistenceError> {
        self.inner.get(namespace, key).await
    }

    async fn search(
        &self,
        namespace: &[&str],
        query: Option<&str>,
        limit: Option<usize>,
    ) -> Result<Vec<StoreItem>, PersistenceError> {
        self.inner.search(namespace, query, limit).await
    }

    async fn delete(
        &self,
        namespace: &[&str],
        key: &str,
    ) -> Result<(), PersistenceError> {
        self.inner.delete(namespace, key).await
    }
}
