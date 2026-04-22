/// PreToolUse hook — delegates to the oris `StateGraph<ReplayState>` pipeline.
///
/// Reads JSON from stdin, drives replay_graph, prints the final hook action to
/// stdout.  All gene queries go through oris's `InMemoryStore` (backed by
/// `FileBackedGeneStore`).

use std::io::{self, Read};

use anyhow::Result;
use serde::Deserialize;
use std::sync::Arc;

use crate::evolution_state::ReplayState;
use crate::gene_store::FileBackedGeneStore;
use crate::replay_graph::build_replay_graph;

#[derive(Deserialize)]
struct HookInput {
    tool_name: String,
    #[serde(default)]
    tool_input: serde_json::Value,
}

/// Entry point called from `main.rs`.
pub fn run() -> Result<()> {
    // Build a single-threaded Tokio runtime — hooks are short-lived processes.
    let rt = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()?;
    rt.block_on(run_async())
}

async fn run_async() -> Result<()> {
    let mut buf = String::new();
    io::stdin().read_to_string(&mut buf)?;

    // Parse hook input; emit passthrough on bad JSON
    let hook: HookInput = match serde_json::from_str(&buf) {
        Ok(h) => h,
        Err(_) => {
            println!(r#"{{"action":"passthrough"}}"#);
            return Ok(());
        }
    };

    let command = hook
        .tool_input
        .get("command")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    if command.is_empty() {
        println!(r#"{{"action":"passthrough"}}"#);
        return Ok(());
    }

    // Load gene store (oris InMemoryStore + file persistence)
    let store = Arc::new(
        FileBackedGeneStore::load(FileBackedGeneStore::default_root()).await?,
    );

    // Build and invoke the oris StateGraph
    let graph = build_replay_graph(Arc::clone(&store))
        .map_err(|e| anyhow::anyhow!("replay graph build error: {e}"))?;

    let initial = ReplayState {
        tool_name: hook.tool_name,
        command,
        ..Default::default()
    };

    let final_state = graph
        .invoke(initial)
        .await
        .map_err(|e| anyhow::anyhow!("replay graph invoke error: {e}"))?;

    // Output the hook action decided by the graph
    println!("{}", serde_json::to_string(&final_state.output)?);
    Ok(())
}
