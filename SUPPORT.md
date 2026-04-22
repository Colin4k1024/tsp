# Support

## What this repository supports

This public repository supports:

- Public Team Skills Platform capabilities
- Public install flows, docs, examples, and release tooling
- Support for the optional custom overlay extension mechanism
- Public install profiles: `core`, `developer`, `security`, `research`, `team`, `full`

## Target support levels

Public install targets do not all have the same depth today. Current support is:

| Level | Targets | Current depth | What to expect |
|------|---------|---------------|----------------|
| Recommended | `claude`, `cursor` | `team` profile keeps 14/14 modules | Full public workflow chain, primary docs, and strongest regression coverage |
| Strong | `codex`, `opencode` | `team` profile keeps 10/14 and 11/14 modules | Core commands and most workflow modules are available, but some target-specific gaps remain |
| Partial | `antigravity`, `codebuddy` | `team` profile keeps 8/14 and 11/14 modules | Adapter works, but workflow parity or shared-skill coverage is incomplete |
| Baseline | `gemini`, `copilot`, `windsurf`, `augment` | `team` profile keeps 1-2/14 modules | Basic platform config and compatibility entry points only; not full `/team-*` parity |

Primary public onboarding docs currently focus on `claude`, `cursor`, `codex`, and `opencode`. Other targets are supported as documented compatibility paths, not as full-feature parity installs.

## What this repository does not support

- Full workflow parity across every public install target
- Organization-specific private overlays or custom integrations that are not part of this repository
- Organization-specific rollout advice that depends on private infrastructure
- Direct support for credentials, private environments, or internal deployment systems

## Where to ask for help

- Use GitHub Issues for public bugs, documentation gaps, and feature requests
- Include the target, profile, and `install-plan` output when reporting install-surface issues
- Use GitHub Discussions if enabled for broader usage questions and workflow ideas
- Use [SECURITY.md](SECURITY.md) for security-sensitive reports
