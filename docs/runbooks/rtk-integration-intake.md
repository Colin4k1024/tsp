# External Capability Intake: rtk (Rust Token Killer)

## Intake Card

| Field | Value |
|-------|-------|
| source_name | rtk (Rust Token Killer) |
| source_url | https://github.com/rtk-ai/rtk |
| license | Apache-2.0 |
| trust_tier | B-proven-community |
| maintenance_signal | Active (frequent releases, Homebrew formula, 10+ AI tool integrations) |
| portability | claude + cursor (hook-based); codex/opencode (instruction-based) |
| import_mode | adapt-into-local-skill |
| target_layer | hooks + skills |
| status | approved |

## What It Does

High-performance Rust CLI proxy that intercepts shell command output and compresses it before it reaches the LLM context. Reduces token consumption by 60-90% across 100+ common dev commands.

## Why Integrate

- Direct cost reduction: 60-90% fewer tokens per Bash command
- Zero workflow change: transparent hook rewrite
- Broad coverage: git, gh, cargo, npm, docker, kubectl, aws, test runners, linters
- Already supports Claude Code via PreToolUse hook

## Integration Approach

- **Adapted hook** (`hooks/rtk-rewrite.sh`): modified from upstream to NOT auto-allow, preserving harness safety hook chain
- **Skill** (`skills/rtk-token-optimization/`): documents capabilities, commands, and savings estimates
- **Install module** (`rtk-optimization`): registered in manifests, included in `full` and `team` profiles
- **Post-install check** (`bin/lib/post-install-rtk.js`): detects rtk/jq availability, prints install instructions

## Risk Assessment

- Low risk: hook silently skips if rtk/jq not installed
- No binary bundling: rtk installed separately via Homebrew/curl
- No upstream code copied: only adapted hook script and documentation
- Apache-2.0 license: fully compatible with MIT

## Approval

- Approved for integration into `hooks` + `skills` layers
- Not bundled as binary (unlike oris-claude-bridge) — external dependency
