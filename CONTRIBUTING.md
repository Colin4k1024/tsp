# Contributing to Team Skills Platform

Thank you for helping improve Team Skills Platform.

## Before you open a pull request

Please make sure your change has a clear user-facing reason and that it fits the public repository surface. Public changes should not introduce private or internal materials, internal credentials, or organization-specific instructions.

## Typical workflow

1. Create or update the smallest change that solves the problem.
2. Regenerate platform artifacts when canonical sources change.
3. Run the relevant validation commands.
4. Update docs or examples when behavior or guidance changes.
5. Open a pull request with context, validation notes, and follow-up risks.

## Validation

Use the JS toolchain in this repository:

```bash
node scripts/build-platform-artifacts.js
node scripts/validate-library.js
node scripts/validate-doc-freshness.js
node tests/run-all.js
```

If your change affects packaging or install behavior, also validate the publish surface:

```bash
node scripts/validate-prebuilt.js
node scripts/validate-packed-tarball.js --help
```

## What belongs in the public repo

- Public role definitions, shared skills, commands, rules, hooks, examples, and install tooling
- Generic workflow guidance and reusable engineering practices
- Compatibility stubs that explain how optional private overlays are attached

## What does not belong in the public repo

- Private enterprise runbooks, internal business skills, or organization-specific case studies
- Real credentials, tokens, customer data, or internal infrastructure details
- Docs that assume private overlays are enabled by default

## Documentation expectations

- Keep the public entry points easy to understand for first-time users
- Prefer bilingual or English-readable summaries for top-level community docs
- If a topic is private-overlay-only, leave a public compatibility stub instead of leaking the private content

## Community expectations

By participating, you agree to follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). For security issues, use [SECURITY.md](SECURITY.md) instead of public issue threads.
