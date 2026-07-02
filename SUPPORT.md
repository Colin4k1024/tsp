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
| Recommended | `claude`, `codex`, `opencode` | Public code-agent workflow chain | Full public workflow chain, primary docs, install verification, and strongest regression coverage |
| Hidden compatibility | `cursor`, `antigravity`, `gemini`, `cangming`, `codebuddy`, `copilot`, `windsurf`, `augment` | Not part of the public promise | Adapters may remain for existing users, but they are not in the public wizard, docs path, or release support matrix |

Primary public onboarding docs currently focus on `claude` (Claude Code), `codex`, and `opencode`. `claude-code` and `claudecode` are accepted aliases for `claude`.

## What this repository does not support

- Full workflow parity across hidden compatibility targets
- Organization-specific private overlays or custom integrations that are not part of this repository
- Organization-specific rollout advice that depends on private infrastructure
- Direct support for credentials, private environments, or internal deployment systems

## Where to ask for help

- Use GitHub Issues for public bugs, documentation gaps, and feature requests
- Include the target, profile, and `install-plan` output when reporting install-surface issues
- Use GitHub Discussions if enabled for broader usage questions and workflow ideas
- Use [SECURITY.md](SECURITY.md) for security-sensitive reports
