/// PreToolUse evolution pipeline built as an oris `StateGraph<ReplayState>`.
///
/// # Pipeline
/// ```
/// START → extract_hints → query_genes → END
/// ```
///
/// `extract_hints` reads the raw command and populates `ReplayState::hints`.
/// `query_genes`   queries the oris-backed `FileBackedGeneStore` for matching
///                 promoted genes and writes the final hook JSON into
///                 `ReplayState::output`.
///
/// The caller prints `output` to stdout as required by the Claude
/// PreToolUse hook protocol.
use std::collections::HashMap;
use std::sync::Arc;

use oris_runtime::graph::{function_node, GraphError, StateGraph, END, START};

use crate::evolution_state::ReplayState;
use crate::gene_store::FileBackedGeneStore;
use crate::signal::extract_command_hints;

/// Build and compile the Replay StateGraph.
pub fn build_replay_graph(
    store: Arc<FileBackedGeneStore>,
) -> Result<oris_runtime::graph::CompiledGraph<ReplayState>, GraphError> {
    // ── Node 1: extract_hints ────────────────────────────────────────────────
    let extract = function_node("extract_hints", |state: &ReplayState| {
        let command = state.command.clone();
        async move {
            let hints = extract_command_hints(&command);
            let mut update = HashMap::new();
            update.insert(
                "hints".to_string(),
                serde_json::to_value(hints).map_err(GraphError::SerializationError)?,
            );
            Ok(update)
        }
    });

    // ── Node 2: query_genes ──────────────────────────────────────────────────
    let store_ref = Arc::clone(&store);
    let query = function_node("query_genes", move |state: &ReplayState| {
        let store = Arc::clone(&store_ref);
        let tool_name = state.tool_name.clone();
        let hints = state.hints.clone();
        async move {
            let mut update = HashMap::new();

            // Nothing to look up — emit passthrough immediately
            if tool_name != "Bash" || hints.is_empty() {
                update.insert(
                    "output".to_string(),
                    serde_json::json!({"action": "passthrough"}),
                );
                return Ok(update);
            }

            let matches = store
                .query_genes_by_signals(&hints)
                .await
                .map_err(|e| GraphError::ExecutionError(e.to_string()))?;

            if let Some(gene) = matches.first() {
                update.insert(
                    "matched_gene_id".to_string(),
                    serde_json::to_value(Some(gene.gene_id.clone()))
                        .map_err(GraphError::SerializationError)?,
                );
                update.insert(
                    "matched_confidence".to_string(),
                    serde_json::to_value(Some(gene.confidence))
                        .map_err(GraphError::SerializationError)?,
                );
                update.insert(
                    "output".to_string(),
                    serde_json::json!({
                        "action": "replay",
                        "gene_id": gene.gene_id,
                        "strategy": gene.strategy,
                        "confidence": gene.confidence,
                    }),
                );
            } else {
                update.insert(
                    "output".to_string(),
                    serde_json::json!({"action": "passthrough"}),
                );
            }

            Ok(update)
        }
    });

    // ── Assemble graph ───────────────────────────────────────────────────────
    let mut graph = StateGraph::<ReplayState>::new();
    graph.add_node("extract_hints", extract)?;
    graph.add_node("query_genes", query)?;
    graph.add_edge(START, "extract_hints");
    graph.add_edge("extract_hints", "query_genes");
    graph.add_edge("query_genes", END);

    graph.compile()
}
