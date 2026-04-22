/// PostToolUse hook — delegates to the oris `StateGraph<SolidifyState>` pipeline.
///
/// Reads JSON from stdin, drives solidify_graph, emits the action result to
/// **stderr** (Claude hook protocol: PostToolUse results go to stderr). All gene
/// mutations go through oris's `InMemoryStore` (backed by `FileBackedGeneStore`).

use std::io::{self, Read, Write};
use std::sync::Arc;

use anyhow::Result;
use serde::Deserialize;

use crate::evolution_state::SolidifyState;
use crate::gene_store::FileBackedGeneStore;
use crate::solidify_graph::build_solidify_graph;

#[derive(Deserialize)]
struct HookInput {
    tool_name: String,
    #[serde(default)]
    tool_input: serde_json::Value,
    #[serde(default)]
    output: Option<String>,
    #[serde(default)]
    exit_code: Option<i32>,
}

/// Entry point called from `main.rs`.
pub fn run() -> Result<()> {
    let rt = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()?;
    rt.block_on(run_async())
}

async fn run_async() -> Result<()> {
    let mut buf = String::new();
    io::stdin().read_to_string(&mut buf)?;

    let hook: HookInput = match serde_json::from_str(&buf) {
        Ok(h) => h,
        Err(_) => {
            emit(r#"{"action":"noop"}"#);
            return Ok(());
        }
    };

    let command = hook
        .tool_input
        .get("command")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let exit_code = hook.exit_code.unwrap_or(-1);
    let output_text = hook.output.unwrap_or_default();

    // Load gene store (oris InMemoryStore + file persistence)
    let store = Arc::new(
        FileBackedGeneStore::load(FileBackedGeneStore::default_root()).await?,
    );

    // Build and invoke the oris StateGraph
    let graph = build_solidify_graph(Arc::clone(&store))
        .map_err(|e| anyhow::anyhow!("solidify graph build error: {e}"))?;

    let initial = SolidifyState {
        tool_name: hook.tool_name,
        command,
        exit_code,
        output_text,
        ..Default::default()
    };

    let final_state = graph
        .invoke(initial)
        .await
        .map_err(|e| anyhow::anyhow!("solidify graph invoke error: {e}"))?;

    // Emit the action decided by the graph to stderr
    let msg = serde_json::json!({ "action": final_state.action_taken });
    emit(&serde_json::to_string(&msg)?);
    Ok(())
}

/// Write to stderr (PostToolUse hook protocol).
fn emit(msg: &str) {
    let _ = writeln!(io::stderr(), "{}", msg);
}
