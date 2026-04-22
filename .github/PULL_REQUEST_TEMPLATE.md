## Summary

Describe what this PR changes and why.

## Motivation and context

- Problem being solved:
- Why this approach:
- Alternatives considered (if relevant):

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Performance improvement
- [ ] Documentation only
- [ ] Refactor / cleanup
- [ ] Governance / architecture update

## Validation

List commands run and results:

```bash
node scripts/build-platform-artifacts.js --check
node scripts/validate-library.js
node scripts/validate-file-references.js --strict
node scripts/validate-doc-freshness.js
node tests/run-all.js
```

## Generated / install impact

- [ ] No generated asset or install change
- [ ] Generated asset changed
- [ ] Install / plugin / marketplace behavior changed

If changed, include migration notes:

## Documentation impact

- [ ] No docs updates required
- [ ] Updated `README.md`
- [ ] Updated `AGENTS.md` / `CLAUDE.md`
- [ ] Updated `docs/runbooks/*`
- [ ] Updated examples / rules / skills docs

If docs are intentionally unchanged, explain why:

## Checklist

- [ ] Code follows project style
- [ ] Validation added or updated for changed behavior
- [ ] Docs/examples updated when behavior changed
- [ ] No secrets or private data added
- [ ] Linked issue(s) if applicable
- [ ] Changes align with Team Skills Platform and ECC harness governance conventions

## Related issue

Closes #
