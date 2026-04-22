use std::fs;
use std::io::Write;
use std::path::PathBuf;

use anyhow::{Context, Result};
use chrono::Utc;
use sha2::{Digest, Sha256};

use crate::claude_gene::*;

/// File-based gene store, backward-compatible with Python `store.py`.
/// Reads/writes `genes.json` (array of ClaudeGene) and `events.jsonl`.
pub struct EvolutionStore {
    root: PathBuf,
}

impl EvolutionStore {
    pub fn new(root: PathBuf) -> Self {
        Self { root }
    }

    /// Default store root: `~/.claude/evolution/`
    pub fn default_root() -> PathBuf {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
        PathBuf::from(home).join(".claude").join("evolution")
    }

    pub fn genes_path(&self) -> PathBuf {
        self.root.join("genes.json")
    }

    pub fn events_path(&self) -> PathBuf {
        self.root.join("events.jsonl")
    }

    // ── Read ────────────────────────────────────────────────────────

    pub fn load_genes(&self) -> Result<Vec<ClaudeGene>> {
        let path = self.genes_path();
        if !path.exists() {
            return Ok(Vec::new());
        }
        let data =
            fs::read_to_string(&path).with_context(|| format!("reading {}", path.display()))?;
        let genes: Vec<ClaudeGene> =
            serde_json::from_str(&data).with_context(|| "parsing genes.json")?;
        Ok(genes)
    }

    // ── Write ───────────────────────────────────────────────────────

    pub fn save_genes(&self, genes: &[ClaudeGene]) -> Result<()> {
        fs::create_dir_all(&self.root)?;
        let data = serde_json::to_string_pretty(genes)?;
        let path = self.genes_path();
        // Atomic write: tmp → rename
        let tmp = path.with_extension("json.tmp");
        fs::write(&tmp, &data)?;
        fs::rename(&tmp, &path)?;
        Ok(())
    }

    pub fn append_event(&self, event: &serde_json::Value) -> Result<()> {
        fs::create_dir_all(&self.root)?;
        let path = self.events_path();
        let mut f = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&path)?;
        let line = serde_json::to_string(event)?;
        writeln!(f, "{}", line)?;
        Ok(())
    }

    // ── Query ───────────────────────────────────────────────────────

    /// Find promoted genes whose signals overlap with the given hints.
    pub fn query_genes_by_signals(&self, hints: &[String]) -> Result<Vec<ClaudeGene>> {
        let genes = self.load_genes()?;
        let mut matches: Vec<ClaudeGene> = genes
            .into_iter()
            .filter(|g| {
                g.state == "promoted"
                    && g.confidence >= CONFIDENCE_FLOOR
                    && g.matches_signals(hints)
            })
            .collect();
        // Best confidence first
        matches.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap_or(std::cmp::Ordering::Equal));
        Ok(matches)
    }

    // ── Mutate ──────────────────────────────────────────────────────

    /// Record a reuse outcome (success or failure) for an existing gene.
    pub fn record_reuse(&self, gene_id: &str, success: bool) -> Result<()> {
        let mut genes = self.load_genes()?;
        if let Some(gene) = genes.iter_mut().find(|g| g.gene_id == gene_id) {
            gene.stats.total_uses += 1;
            if success {
                gene.stats.successes += 1;
                gene.confidence = (gene.confidence + CONFIDENCE_INCREMENT).min(CONFIDENCE_CAP);
                // Auto-promote if threshold met
                if gene.state == "candidate"
                    && gene.confidence >= PROMOTE_THRESHOLD
                    && gene.stats.total_uses >= PROMOTE_MIN_USES
                {
                    gene.state = "promoted".to_string();
                }
            } else {
                gene.stats.failures += 1;
                gene.confidence = (gene.confidence - CONFIDENCE_DECREMENT).max(CONFIDENCE_FLOOR);
                if gene.confidence < QUARANTINE_CONFIDENCE && gene.stats.failures >= 3 {
                    gene.state = "quarantined".to_string();
                }
                if gene.confidence <= REVOKE_CONFIDENCE {
                    gene.state = "revoked".to_string();
                }
            }
            gene.updated_at = Utc::now();
            self.save_genes(&genes)?;
        }
        Ok(())
    }

    /// Create a brand-new gene from a solidify observation.
    pub fn create_gene(
        &self,
        signals: Vec<Signal>,
        strategy: Strategy,
        tags: Vec<String>,
        env_fp: serde_json::Value,
    ) -> Result<String> {
        let gene_id = generate_gene_id();
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

        let mut genes = self.load_genes()?;
        genes.push(gene);
        self.save_genes(&genes)?;

        self.append_event(&serde_json::json!({
            "type": "gene_created",
            "gene_id": gene_id,
            "timestamp": now.to_rfc3339(),
        }))?;

        Ok(gene_id)
    }
}

/// Generate a short gene ID: `g-<8 hex chars>`.
pub(crate) fn generate_gene_id() -> String {
    let now = Utc::now().timestamp_nanos_opt().unwrap_or(0);
    let pid = std::process::id();
    let input = format!("{}-{}", now, pid);
    let hash = Sha256::digest(input.as_bytes());
    let hex = hex::encode(&hash[..4]);
    format!("g-{hex}")
}
