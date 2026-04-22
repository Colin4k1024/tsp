/// Signal extraction from shell commands and error output.
/// Direct port of Python `replay.py` `_extract_command_hints()` and
/// `_extract_error_hints()`.

/// Extract semantic hints from a shell command string.
pub fn extract_command_hints(cmd: &str) -> Vec<String> {
    let mut hints = Vec::new();
    let cmd_lower = cmd.to_lowercase();

    // Package managers
    let pkg_managers: &[(&str, &str)] = &[
        ("npm ", "npm"),
        ("npm\t", "npm"),
        ("yarn ", "yarn"),
        ("pnpm ", "pnpm"),
        ("pip ", "pip"),
        ("pip3 ", "pip"),
        ("cargo ", "cargo"),
        ("go ", "go"),
        ("go\t", "go"),
        ("mvn ", "maven"),
        ("gradle ", "gradle"),
    ];
    for &(pat, hint) in pkg_managers {
        if cmd_lower.contains(pat) || cmd_lower.starts_with(pat.trim()) {
            hints.push(hint.to_string());
        }
    }

    // Test runners
    let test_runners = [
        "jest", "pytest", "vitest", "mocha", "junit", "cargo test",
    ];
    for runner in &test_runners {
        if cmd_lower.contains(runner) {
            hints.push("test".to_string());
            break;
        }
    }

    // Build tools
    let build_patterns = ["build", "compile", "tsc", "webpack", "vite", "make"];
    for bp in &build_patterns {
        if cmd_lower.contains(bp) {
            hints.push("build".to_string());
            break;
        }
    }

    // Git
    if cmd_lower.starts_with("git ") || cmd_lower.contains(" git ") {
        hints.push("git".to_string());
    }

    // Docker
    if cmd_lower.contains("docker") || cmd_lower.contains("podman") {
        hints.push("docker".to_string());
    }

    hints.sort();
    hints.dedup();
    hints
}

/// Extract language hints from error/output text.
pub fn extract_error_hints(error: &str) -> Vec<String> {
    let mut hints = Vec::new();

    let patterns: &[(&[&str], &str)] = &[
        (&[".py", "Traceback", "pip"], "python"),
        (&[".ts", "tsc", "TypeScript"], "typescript"),
        (&[".js", "node_modules", "npm ERR"], "javascript"),
        (&[".java", "at "], "java"),
        (&[".go", "go build"], "go"),
        (&[".rs", "cargo", "rustc"], "rust"),
    ];

    for &(markers, lang) in patterns {
        for marker in markers {
            if error.contains(marker) {
                hints.push(lang.to_string());
                break;
            }
        }
    }

    hints.sort();
    hints.dedup();
    hints
}

/// Check if a command string looks like a fix attempt.
/// Mirrors Python `solidify.py` `_looks_like_fix()`.
pub fn looks_like_fix(cmd: &str) -> bool {
    let cmd_lower = cmd.to_lowercase();
    let fix_patterns = [
        "fix", "resolv", "workaround", "solution", "corrected", "patch",
    ];
    fix_patterns.iter().any(|p| cmd_lower.contains(p))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_command_hints_npm() {
        let hints = extract_command_hints("npm install express");
        assert!(hints.contains(&"npm".to_string()));
    }

    #[test]
    fn test_extract_command_hints_test() {
        let hints = extract_command_hints("cargo test --release");
        assert!(hints.contains(&"test".to_string()));
        assert!(hints.contains(&"cargo".to_string()));
    }

    #[test]
    fn test_extract_command_hints_git() {
        let hints = extract_command_hints("git commit -m 'fix'");
        assert!(hints.contains(&"git".to_string()));
    }

    #[test]
    fn test_extract_command_hints_empty() {
        let hints = extract_command_hints("ls -la");
        assert!(hints.is_empty());
    }

    #[test]
    fn test_extract_error_hints_python() {
        let hints = extract_error_hints("Traceback (most recent call last):\n  File test.py");
        assert!(hints.contains(&"python".to_string()));
    }

    #[test]
    fn test_extract_error_hints_rust() {
        let hints = extract_error_hints("error[E0308]: mismatched types\n --> src/main.rs:10:5");
        assert!(hints.contains(&"rust".to_string()));
    }

    #[test]
    fn test_looks_like_fix() {
        assert!(looks_like_fix("git commit -m 'fix: resolve build issue'"));
        assert!(looks_like_fix("npm install --save patch-package"));
        assert!(!looks_like_fix("git status"));
        assert!(!looks_like_fix("ls -la"));
    }
}
