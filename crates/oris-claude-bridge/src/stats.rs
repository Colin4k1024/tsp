/// Display evolution statistics: gene counts, states, confidence, top genes.
///
/// Uses `FileBackedGeneStore` (oris-backed) to load genes; runs a tiny
/// single-threaded Tokio runtime so the async API can be called synchronously.

use anyhow::Result;

use crate::gene_store::FileBackedGeneStore;

pub fn run() -> Result<()> {
    let rt = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()?;
    rt.block_on(run_async())
}

async fn run_async() -> Result<()> {
    let store = FileBackedGeneStore::load(FileBackedGeneStore::default_root()).await?;
    let genes = store.all_genes().await?;

    let total = genes.len();
    let promoted = genes.iter().filter(|g| g.state == "promoted").count();
    let candidate = genes.iter().filter(|g| g.state == "candidate").count();
    let quarantined = genes.iter().filter(|g| g.state == "quarantined").count();
    let revoked = genes.iter().filter(|g| g.state == "revoked").count();

    let total_uses: u64 = genes.iter().map(|g| g.stats.total_uses).sum();
    let total_successes: u64 = genes.iter().map(|g| g.stats.successes).sum();
    let total_failures: u64 = genes.iter().map(|g| g.stats.failures).sum();

    let avg_confidence = if total > 0 {
        genes.iter().map(|g| g.confidence).sum::<f64>() / total as f64
    } else {
        0.0
    };

    println!("╔══════════════════════════════════════╗");
    println!("║      Evolution Statistics             ║");
    println!("╠══════════════════════════════════════╣");
    println!("║ Total Genes:       {:>14}    ║", total);
    println!("║   Promoted:        {:>14}    ║", promoted);
    println!("║   Candidate:       {:>14}    ║", candidate);
    println!("║   Quarantined:     {:>14}    ║", quarantined);
    println!("║   Revoked:         {:>14}    ║", revoked);
    println!("╠══════════════════════════════════════╣");
    println!("║ Total Uses:        {:>14}    ║", total_uses);
    println!("║   Successes:       {:>14}    ║", total_successes);
    println!("║   Failures:        {:>14}    ║", total_failures);
    println!("║ Avg Confidence:    {:>14.3}    ║", avg_confidence);
    println!("╚══════════════════════════════════════╝");

    if total > 0 {
        println!("\nTop genes by usage:");
        let mut sorted = genes;
        sorted.sort_by(|a, b| {
            b.stats
                .total_uses
                .cmp(&a.stats.total_uses)
                .then(b.confidence.partial_cmp(&a.confidence).unwrap_or(std::cmp::Ordering::Equal))
        });
        for gene in sorted.iter().take(5) {
            println!(
                "  {} [{}] conf={:.2} uses={} ({}s/{}f)",
                gene.gene_id,
                gene.state,
                gene.confidence,
                gene.stats.total_uses,
                gene.stats.successes,
                gene.stats.failures,
            );
            if let Some(sig) = gene.signals.first() {
                let desc = if sig.pattern.len() > 60 {
                    format!("{}…", &sig.pattern[..60])
                } else {
                    sig.pattern.clone()
                };
                println!("    signal: {}", desc);
            }
        }
    }

    Ok(())
}
