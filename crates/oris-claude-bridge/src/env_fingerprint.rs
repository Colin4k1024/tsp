/// Environment fingerprint detection.
/// Port of Python `store.py` `collect_env_fingerprint()`.

use serde_json::json;

/// Detect project ecosystem by scanning CWD for marker files.
/// Returns a JSON value with `cwd_basename`, `ecosystem`, and optionally `framework`.
pub fn collect_env_fingerprint() -> serde_json::Value {
    let cwd = std::env::current_dir().unwrap_or_default();
    let basename = cwd
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    let mut ecosystem: Option<&str> = None;
    let mut framework: Option<&str> = None;

    if cwd.join("package.json").exists() {
        ecosystem = Some("node");
        if let Ok(data) = std::fs::read_to_string(cwd.join("package.json")) {
            if data.contains("\"next\"") {
                framework = Some("next");
            } else if data.contains("\"react\"") {
                framework = Some("react");
            } else if data.contains("\"vue\"") {
                framework = Some("vue");
            }
        }
    } else if cwd.join("requirements.txt").exists() || cwd.join("pyproject.toml").exists() {
        ecosystem = Some("python");
    } else if cwd.join("Cargo.toml").exists() {
        ecosystem = Some("rust");
    } else if cwd.join("go.mod").exists() {
        ecosystem = Some("go");
    } else if cwd.join("pom.xml").exists() || cwd.join("build.gradle").exists() {
        ecosystem = Some("java");
    }

    let mut fp = json!({ "cwd_basename": basename });
    if let Some(eco) = ecosystem {
        fp["ecosystem"] = json!(eco);
    }
    if let Some(fw) = framework {
        fp["framework"] = json!(fw);
    }
    fp
}
