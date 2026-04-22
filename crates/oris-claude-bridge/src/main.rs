use clap::{Parser, Subcommand};

mod claude_gene;
mod env_fingerprint;
mod evolution_state;
mod gene_store;
mod governor;
mod replay;
mod replay_graph;
mod signal;
mod solidify;
mod solidify_graph;
mod stats;
mod store;

#[derive(Parser)]
#[command(
    name = "oris-claude-bridge",
    version,
    about = "Claude Code evolution hook bridge — drop-in Rust replacement for Python evolution scripts"
)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// PreToolUse hook: replay matching gene strategies (stdout)
    Replay,
    /// PostToolUse hook: solidify observations into genes (stderr)
    Solidify,
    /// Show evolution gene statistics
    Stats,
    /// Migrate legacy instinct files (not yet implemented)
    Migrate {
        /// Path to instincts directory
        #[arg(long)]
        from: Option<String>,
    },
}

fn main() {
    let cli = Cli::parse();

    // ── Environment gate ────────────────────────────────────────────
    // Mirrors the Python opt-in check: disabled unless ECC_ENABLE_EVOLUTION=1
    let evolution_enabled =
        std::env::var("ECC_ENABLE_EVOLUTION").unwrap_or_default() == "1"
        && std::env::var("EVOLUTION_DISABLED").is_err();

    if !evolution_enabled {
        match &cli.command {
            Commands::Replay => {
                println!(r#"{{"action":"passthrough"}}"#);
            }
            Commands::Stats => {
                // Stats always allowed — read-only
                if let Err(e) = stats::run() {
                    eprintln!("oris-claude-bridge stats error: {e}");
                }
                return;
            }
            _ => {}
        }
        return;
    }

    // ── Dispatch ────────────────────────────────────────────────────
    let result = match cli.command {
        Commands::Replay => replay::run(),
        Commands::Solidify => solidify::run(),
        Commands::Stats => stats::run(),
        Commands::Migrate { from: _ } => {
            eprintln!("oris-claude-bridge: migrate not yet implemented (Phase 2)");
            Ok(())
        }
    };

    if let Err(e) = result {
        // Errors go to stderr; replay callers still get passthrough from stdout
        // because we haven't printed anything to stdout on the error path.
        eprintln!("oris-claude-bridge error: {e}");
    }
}
