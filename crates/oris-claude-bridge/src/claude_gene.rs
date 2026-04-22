use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Gene format matching the existing Python `genes.json` schema.
/// Backward-compatible: the Rust bridge reads/writes the same file format.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeGene {
    pub gene_id: String,
    pub signals: Vec<Signal>,
    pub strategy: Strategy,
    #[serde(default)]
    pub validation_rules: serde_json::Value,
    pub confidence: f64,
    pub state: String,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub env_fingerprint: serde_json::Value,
    pub stats: GeneStats,
    #[serde(default)]
    pub source: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Signal {
    pub signal_type: String,
    pub source: String,
    pub pattern: String,
    #[serde(default)]
    pub context_hints: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Strategy {
    pub description: String,
    #[serde(default)]
    pub steps: Vec<String>,
    #[serde(default)]
    pub constraints: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneStats {
    pub total_uses: u64,
    pub successes: u64,
    pub failures: u64,
}

// ── Confidence constants matching Python store.py ───────────────────
pub const CONFIDENCE_INCREMENT: f64 = 0.05;
pub const CONFIDENCE_DECREMENT: f64 = 0.10;
pub const CONFIDENCE_CAP: f64 = 0.95;
pub const CONFIDENCE_FLOOR: f64 = 0.10;
pub const PROMOTE_THRESHOLD: f64 = 0.60;
pub const PROMOTE_MIN_USES: u64 = 3;
pub const QUARANTINE_CONFIDENCE: f64 = 0.30;
pub const REVOKE_CONFIDENCE: f64 = 0.15;

impl ClaudeGene {
    /// Check whether any of our signals match the given hint strings.
    /// Mirrors Python `_match_signals()` logic.
    pub fn matches_signals(&self, hints: &[String]) -> bool {
        if hints.is_empty() {
            return false;
        }
        for signal in &self.signals {
            let pattern_lower = signal.pattern.to_lowercase();
            for hint in hints {
                if pattern_lower.contains(&hint.to_lowercase()) {
                    return true;
                }
            }
            for ctx in &signal.context_hints {
                for hint in hints {
                    if ctx.eq_ignore_ascii_case(hint) {
                        return true;
                    }
                }
            }
        }
        false
    }
}
