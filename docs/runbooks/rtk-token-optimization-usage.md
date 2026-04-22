# RTK Token Optimization — Usage Guide

## Overview

[rtk](https://github.com/rtk-ai/rtk) is a high-performance CLI proxy that reduces LLM token consumption by 60-90% on common dev commands. It's integrated into the harness via a PreToolUse:Bash hook that transparently rewrites shell commands.

## Prerequisites

```bash
# macOS (recommended)
brew install rtk

# Linux / macOS alternative
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh

# Cargo
cargo install --git https://github.com/rtk-ai/rtk
```

Also requires `jq` for the hook script:
```bash
brew install jq   # macOS
apt install jq     # Debian/Ubuntu
```

## How It Works

After harness installation (`install-apply.js --profile full`), the `pre:bash:rtk-rewrite` hook is registered in `hooks.json`. When Claude Code executes any Bash command:

1. The hook captures the command text
2. Calls `rtk rewrite "<command>"` to check for an optimized version
3. If found, rewrites the command (e.g., `git status` → `rtk git status`)
4. The rewritten command produces compressed output, saving 60-90% tokens
5. Other safety hooks (block-no-verify, commit-quality) still execute normally

## Token Savings Estimate (30-min Session)

| Operation | Standard Tokens | With rtk | Savings |
|-----------|----------------|----------|---------|
| ls / tree (10x) | 2,000 | 400 | -80% |
| cat / read (20x) | 40,000 | 12,000 | -70% |
| git status/diff/log (20x) | 15,500 | 3,600 | -77% |
| cargo/npm test (5x) | 25,000 | 2,500 | -90% |
| **Total** | **~118,000** | **~23,900** | **-80%** |

## Analytics

```bash
rtk gain                # Summary stats
rtk gain --graph        # ASCII graph (last 30 days)
rtk gain --daily        # Day-by-day breakdown
rtk discover            # Find missed savings opportunities
rtk session             # Show adoption across recent sessions
```

## Configuration

RTK config: `~/.config/rtk/config.toml` (macOS: `~/Library/Application Support/rtk/config.toml`)

```toml
[hooks]
exclude_commands = ["curl", "playwright"]  # skip rewrite for these

[tee]
enabled = true          # save raw output on failure
mode = "failures"       # "failures", "always", or "never"
max_files = 20          # rotation limit
```

## Hook Coexistence

The harness rtk hook is **adapted** from the upstream version:

- Does NOT return `permissionDecision: allow` (upstream does)
- This ensures safety hooks (block-no-verify, commit-quality, prompt-guard) still execute
- Placed near the end of the PreToolUse:Bash chain, after all safety checks
- If rtk or jq is not installed, the hook silently exits (zero impact)

## Tee: Full Output Recovery

When a command fails, rtk saves the full unfiltered output:
```
FAILED: 2/15 tests
[full output: ~/.local/share/rtk/tee/1707753600_cargo_test.log]
```

## Scope Limitations

The hook only applies to **Bash tool calls**. Claude Code built-in tools (`Read`, `Grep`, `Glob`) bypass the hook. To get RTK filtering for those workflows, use shell commands (`cat`, `rg`, `find`) or call `rtk read`, `rtk grep`, `rtk find` directly.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `rtk` not found | Run `brew install rtk` or check PATH |
| `jq` not found | Run `brew install jq` |
| Hook not firing | Check `rtk init --show` and verify hooks.json has `pre:bash:rtk-rewrite` |
| Wrong rtk package | `rtk gain` should work; if not, uninstall and use `cargo install --git https://github.com/rtk-ai/rtk` |
| Conflicts with safety hooks | The adapted hook does not auto-allow; if issues persist, disable with hook flags |

## References

- [rtk GitHub](https://github.com/rtk-ai/rtk)
- [rtk Troubleshooting](https://github.com/rtk-ai/rtk/blob/master/docs/TROUBLESHOOTING.md)
- [rtk Architecture](https://github.com/rtk-ai/rtk/blob/master/docs/contributing/ARCHITECTURE.md)
- Skill definition: `skills/rtk-token-optimization/SKILL.md`
- Hook: `hooks/rtk-rewrite.sh`
