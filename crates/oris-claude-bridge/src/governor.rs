/// Session-level rate limiter for evolution hooks.
/// Prevents runaway replay/solidify/gene-creation loops.
///
/// Phase 1 note: included as module but not wired into replay/solidify yet.
/// The governor needs persistent session state (file-based) to work across
/// separate hook invocations. Full integration in Phase 2.

use chrono::{DateTime, Duration, Utc};

pub struct Governor {
    max_replays: u32,
    max_solidify: u32,
    max_gene_creates: u32,
    max_consecutive_failures: u32,
    cooldown_seconds: i64,
    replay_count: u32,
    solidify_count: u32,
    gene_create_count: u32,
    consecutive_failures: u32,
    last_action: Option<DateTime<Utc>>,
}

impl Governor {
    pub fn new() -> Self {
        Self {
            max_replays: 20,
            max_solidify: 10,
            max_gene_creates: 5,
            max_consecutive_failures: 3,
            cooldown_seconds: 60,
            replay_count: 0,
            solidify_count: 0,
            gene_create_count: 0,
            consecutive_failures: 0,
            last_action: None,
        }
    }

    pub fn can_replay(&self) -> bool {
        self.replay_count < self.max_replays && !self.in_cooldown()
    }

    pub fn can_solidify(&self) -> bool {
        self.solidify_count < self.max_solidify
    }

    pub fn can_create_gene(&self) -> bool {
        self.gene_create_count < self.max_gene_creates
    }

    pub fn record_replay(&mut self) {
        self.replay_count += 1;
        self.last_action = Some(Utc::now());
    }

    pub fn record_solidify(&mut self) {
        self.solidify_count += 1;
    }

    pub fn record_gene_create(&mut self) {
        self.gene_create_count += 1;
    }

    pub fn record_failure(&mut self) {
        self.consecutive_failures += 1;
    }

    pub fn record_success(&mut self) {
        self.consecutive_failures = 0;
    }

    fn in_cooldown(&self) -> bool {
        if self.consecutive_failures < self.max_consecutive_failures {
            return false;
        }
        if let Some(last) = self.last_action {
            let elapsed = Utc::now().signed_duration_since(last);
            elapsed < Duration::seconds(self.cooldown_seconds)
        } else {
            false
        }
    }
}

impl Default for Governor {
    fn default() -> Self {
        Self::new()
    }
}
