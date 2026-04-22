/// PostToolUse evolution pipeline built as an oris `StateGraph<SolidifyState>`.
///
/// # Pipeline
/// ```
/// START → extract_hints → process_result → persist → END
/// ```
use std::collections::HashMap;
use std::sync::Arc;

use chrono::Utc;
use serde_json::json;

use oris_runtime::graph::{function_node, GraphError, StateGraph, END, START};

use crate::claude_gene::*;
use crate::env_fingerprint::collect_env_fingerprint;
use crate::evolution_state::SolidifyState;
use crate::gene_store::FileBackedGeneStore;
use crate::signal::{extract_command_hints, extract_error_hints, looks_like_fix};

/// Build and compile the Solidify StateGraph.
pub fn build_solidify_graph(
    store: Arc<FileBackedGeneStore>,
) -> Result<oris_runtime::graph::CompiledGraph<SolidifyState>, GraphError> {
    // ── Node 1: extract_hints ────────────────────────────────────────────────
    let extract = function_node("extract_hints", |state: &SolidifyState| {
        let command = state.command.clone();
        let exit_code = state.exit_code;
        let output_text = state.output_text.clone();
        async move {
            let mut hints = extract_command_hints(&command);
            if exit_code != 0 {
                hints.extend(extract_error_hints(&output_text));
            }
            hints.sort();
            hints.dedup();

            let mut update = HashMap::new();
            update.insert(
                "hints".to_string(),
                serde_json::to_value(hints).map_err(GraphError::SerializationError)?,
            );
            Ok(update)
        }
    });

    // ── Node 2: process_result ───────────────────────────────────────────────
    let store_ref = Arc::clone(&store);
    let process = function_node("process_result", move |state: &SolidifyState| {
        let store = Arc::clone(&store_ref);
        let tool_name = state.tool_name.clone();
        let hints = state.hints.clone();
        let exit_code = state.exit_code;
        let command = state.command.clone();
        async move {
            let mut update = HashMap::new();

            // Only act on Bash tool invocations with actionable hints
            if tool_name != "Bash" || hints.is_empty() {
                update.insert("action_taken".to_string(), json!("noop"));
                return Ok(update);
            }

            if exit_code != 0 {
                // ── Failure path ─────────────────────────────────────────────
                let matches = store
                    .query_genes_by_signals(&hints)
                    .await
                    .map_err(|e| GraphError::ExecutionError(e.to_string()))?;

                if let Some(gene) = matches.first() {
                    let gene_id = gene.gene_id.clone();
                    store
                        .update_gene(&gene_id, |g| {
                            g.stats.total_uses += 1;
                            g.stats.failures += 1;
                            g.confidence =
                                (g.confidence - CONFIDENCE_DECREMENT).max(CONFIDENCE_FLOOR);
                            if g.confidence < QUARANTINE_CONFIDENCE && g.stats.failures >= 3 {
                                g.state = "quarantined".to_string();
                            }
                            if g.confidence <= REVOKE_CONFIDENCE {
                                g.state = "revoked".to_string();
                            }
                        })
                        .await
                        .map_err(|e| GraphError::ExecutionError(e.to_string()))?;

                    update.insert("action_taken".to_string(), json!("failure_recorded"));
                } else {
                    // No matching gene — observe signal for future gene creation
                    let truncated = command[..command.len().min(300)].to_string();
                    store
                        .append_event(&json!({
                            "type": "signal_observed",
                            "signals": hints,
                            "command": truncated,
                            "exit_code": exit_code,
                            "ts": Utc::now().to_rfc3339(),
                        }))
                        .map_err(|e| GraphError::ExecutionError(e.to_string()))?;

                    update.insert("action_taken".to_string(), json!("signal_observed"));
                }
            } else if looks_like_fix(&command) {
                // ── Success + fix path ────────────────────────────────────────
                let matches = store
                    .query_genes_by_signals(&hints)
                    .await
                    .map_err(|e| GraphError::ExecutionError(e.to_string()))?;

                if let Some(gene) = matches.first() {
                    let gene_id = gene.gene_id.clone();
                    store
                        .update_gene(&gene_id, |g| {
                            g.stats.total_uses += 1;
                            g.stats.successes += 1;
                            g.confidence =
                                (g.confidence + CONFIDENCE_INCREMENT).min(CONFIDENCE_CAP);
                            if g.confidence >= PROMOTE_THRESHOLD
                                && g.state == "candidate"
                            {
                                g.state = "promoted".to_string();
                            }
                        })
                        .await
                        .map_err(|e| GraphError::ExecutionError(e.to_string()))?;

                    store
                        .record_reuse(&gene_id, true)
                        .await
                        .map_err(|e| GraphError::ExecutionError(e.to_string()))?;

                    update.insert("action_taken".to_string(), json!("success_reinforced"));
                } else {
                    // No matching gene — materialise a new candidate gene
                    let truncated = command[..command.len().min(300)].to_string();
                    let signal = Signal {
                        signal_type: "command_pattern".to_string(),
                        source: "bash".to_string(),
                        pattern: truncated,
                        context_hints: hints.clone(),
                    };
                    let strategy = Strategy {
                        description: format!(
                            "Auto-captured fix: {}",
                            &command[..command.len().min(100)]
                        ),
                        steps: vec![command.clone()],
                        constraints: vec![],
                    };
                    let env_fp = collect_env_fingerprint();
                    let gene_id = store
                        .create_gene(vec![signal], strategy, hints.clone(), env_fp)
                        .await
                        .map_err(|e| GraphError::ExecutionError(e.to_string()))?;

                    update.insert("action_taken".to_string(), json!("gene_created"));
                    update.insert(
                        "matched_gene_id".to_string(),
                        serde_json::to_value(Some(gene_id))
                            .map_err(GraphError::SerializationError)?,
                    );
                }
            } else {
                update.insert("action_taken".to_string(), json!("noop"));
            }

            Ok(update)
        }
    });

    // ── Node 3: persist ──────────────────────────────────────────────────────
    let store_ref2 = Arc::clone(&store);
    let persist = function_node("persist", move |state: &SolidifyState| {
        let store = Arc::clone(&store_ref2);
        let action = state.action_taken.clone();
        async move {
            // Only flush if we actually mutated a gene
            if action == "failure_recorded" || action == "success_reinforced" {
                store
                    .flush()
                    .await
                    .map_err(|e| GraphError::ExecutionError(e.to_string()))?;
            }
            Ok(HashMap::new())
        }
    });

    // ── Assemble graph ───────────────────────────────────────────────────────
    let mut graph = StateGraph::<SolidifyState>::new();
    graph.add_node("extract_hints", extract)?;
    graph.add_node("process_result", process)?;
    graph.add_node("persist", persist)?;
    graph.add_edge(START, "extract_hints");
    graph.add_edge("extract_hints", "process_result");
    graph.add_edge("process_result", "persist");
    graph.add_edge("persist", END);

    graph.compile()
}
