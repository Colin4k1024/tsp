/// oris State types for the evolution pipeline.
///
/// Each state struct implements `oris_runtime::graph::State` so it can be used
/// directly as a node in an oris `StateGraph`.  The graph executor serialises
/// the current state to JSON, merges a node's `StateUpdate` (HashMap<String,Value>),
/// then deserialises back — field names in the HashMap therefore must match the
/// struct field names exactly.
///
/// ## Merge strategy
///
/// oris v0.61 applies a node's `StateUpdate` (HashMap) by:
///   1. Serialising the HashMap to JSON
///   2. Deserialising as the full state type (requiring `#[serde(default)]`)
///   3. Calling `State::merge(current, partial_update_state)`
///
/// Because the "partial update state" has all un-updated fields at their
/// Default values, the merge must be JSON-based: overlay only the fields that
/// differ from Default so that the existing state fields are preserved.
use serde::{Deserialize, Serialize};
use serde_json::Value;

use oris_runtime::graph::State;

/// JSON-level partial merge helper. Overlays fields from `other` that differ
/// from `Default` onto `base`, returning the merged state.
fn json_partial_merge<S>(base: &S, other: &S) -> S
where
    S: Default + Serialize + for<'de> Deserialize<'de> + Clone,
{
    let default_json = serde_json::to_value(S::default()).unwrap_or_default();
    let other_json = serde_json::to_value(other).unwrap_or_default();
    let mut base_json = serde_json::to_value(base).unwrap_or_default();

    if let (Some(base_map), Some(overlay_map), Some(default_map)) = (
        base_json.as_object_mut(),
        other_json.as_object(),
        default_json.as_object(),
    ) {
        for (key, val) in overlay_map {
            // Only apply fields that differ from Default — those were explicitly
            // set by the node update; fields equal to Default are just serde
            // fill-ins for missing keys and should NOT clobber the base state.
            if default_map.get(key) != Some(val) {
                base_map.insert(key.clone(), val.clone());
            }
        }
    }

    serde_json::from_value(base_json).unwrap_or_else(|_| other.clone())
}

// ── Replay (PreToolUse) ──────────────────────────────────────────────────────

/// Carries everything the replay pipeline needs, from raw hook input to the
/// final JSON that gets printed to stdout.
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct ReplayState {
    /// Name of the tool that triggered the hook (e.g. "Bash")
    #[serde(default)]
    pub tool_name: String,
    /// Shell command extracted from `tool_input.command`
    #[serde(default)]
    pub command: String,
    /// Semantic hints extracted from `command` (populated by `extract_hints` node)
    #[serde(default)]
    pub hints: Vec<String>,
    /// Gene ID of the best match, if any (populated by `query_genes` node)
    #[serde(default)]
    pub matched_gene_id: Option<String>,
    /// Confidence score of the matched gene
    #[serde(default)]
    pub matched_confidence: Option<f64>,
    /// Final hook output JSON value to emit on stdout
    #[serde(default)]
    pub output: Value,
}

impl State for ReplayState {
    /// Partial-update merge: preserve base state, overlay only explicitly-set fields.
    fn merge(&self, other: &Self) -> Self {
        json_partial_merge(self, other)
    }
}

// ── Solidify (PostToolUse) ───────────────────────────────────────────────────

/// Carries everything the solidify pipeline needs: tool output, result
/// classification, and the action ultimately recorded.
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct SolidifyState {
    /// Name of the tool ("Bash")
    #[serde(default)]
    pub tool_name: String,
    /// Shell command that was run
    #[serde(default)]
    pub command: String,
    /// Exit code of the command (0 = success, non-zero = failure)
    #[serde(default)]
    pub exit_code: i32,
    /// Combined stdout/stderr text (truncated)
    #[serde(default)]
    pub output_text: String,
    /// Semantic hints extracted from command + error output
    #[serde(default)]
    pub hints: Vec<String>,
    /// Action taken by the pipeline (noop / failure_recorded / success_reinforced /
    /// gene_created / signal_observed)
    #[serde(default)]
    pub action_taken: String,
    /// Gene ID affected by the action, if applicable
    #[serde(default)]
    pub gene_id: Option<String>,
}

impl State for SolidifyState {
    /// Partial-update merge: preserve base state, overlay only explicitly-set fields.
    fn merge(&self, other: &Self) -> Self {
        json_partial_merge(self, other)
    }
}
