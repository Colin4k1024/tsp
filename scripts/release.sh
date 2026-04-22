#!/usr/bin/env bash
# scripts/release.sh — bump version, tag, push, and optionally publish to npm
#
# Usage:
#   ./scripts/release.sh patch              # 2.2.0 → 2.2.1  (git only, CI publishes)
#   ./scripts/release.sh minor              # 2.2.0 → 2.3.0
#   ./scripts/release.sh major              # 2.2.0 → 3.0.0
#   ./scripts/release.sh 2.1.6             # explicit version
#   ./scripts/release.sh 2.1.6 --publish   # bump + publish to npm locally + git push
#   ./scripts/release.sh 2.1.6 --publish --skip-push  # publish to npm, skip git push

set -euo pipefail

BUMP="${1:-patch}"
PUBLISH=false
SKIP_PUSH=false

for arg in "${@:2}"; do
  case "$arg" in
    --publish)     PUBLISH=true ;;
    --skip-push)   SKIP_PUSH=true ;;
  esac
done

# ── 1. Ensure clean working tree ────────────────────────────────────────────
if [[ -n "$(git status --porcelain | grep -v '^\?\?')" ]]; then
  echo "❌  Working tree has uncommitted tracked changes. Commit or stash first."
  git status --short
  exit 1
fi

# ── 2. Bump version ─────────────────────────────────────────────────────────
OLD_VERSION="$(node -e "process.stdout.write(require('./package.json').version)")"

if [[ "$BUMP" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  NEW_VERSION="$BUMP"
  if [[ "$NEW_VERSION" != "$OLD_VERSION" ]]; then
    npm version "$NEW_VERSION" --no-git-tag-version
  fi
else
  npm version "$BUMP" --no-git-tag-version
  NEW_VERSION="$(node -e "process.stdout.write(require('./package.json').version)")"
fi

echo "📦  $OLD_VERSION → $NEW_VERSION"

# ── 3. Validate prebuilt binaries ────────────────────────────────────────────
echo ""
echo "🔍  Validating prebuilt binaries ..."
node scripts/validate-prebuilt.js
echo "✅  All 5 platform binaries present."

# ── 4. Publish to npm (local mode) ──────────────────────────────────────────
if [[ "$PUBLISH" == "true" ]]; then
  echo ""
  echo "📦  Packing tarball for validation ..."
  TARBALL="$(npm pack --json --ignore-scripts 2>/dev/null | node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'))[0].filename)")"
  echo "    → ${TARBALL}"

  echo "🔍  Validating tarball contents ..."
  node scripts/validate-packed-tarball.js --tarball "${TARBALL}"
  echo "✅  Tarball contains all prebuilt binaries."

  TARBALL_SIZE="$(wc -c < "${TARBALL}" | tr -d ' ')"
  echo "    Size: $(( TARBALL_SIZE / 1024 / 1024 ))MB (${TARBALL_SIZE} bytes)"

  echo ""
  echo "🚀  Publishing @colin4k1024/tsp-create@${NEW_VERSION} to npm ..."
  npm publish "${TARBALL}" --access public
  echo "✅  Published to npm."

  rm -f "${TARBALL}"
fi

# ── 5. Commit + tag ─────────────────────────────────────────────────────────
git add package.json
if git diff --cached --quiet; then
  echo "ℹ️   package.json unchanged (already at v${NEW_VERSION}), skipping version commit."
else
  git commit -m "chore: prepare npm release v${NEW_VERSION}"
fi
if git rev-parse -q --verify "refs/tags/v${NEW_VERSION}" >/dev/null; then
  TAG_TARGET="$(git rev-list -n 1 "refs/tags/v${NEW_VERSION}")"
  HEAD_TARGET="$(git rev-parse HEAD)"
  if [[ "${TAG_TARGET}" == "${HEAD_TARGET}" ]]; then
    echo "ℹ️   Tag v${NEW_VERSION} already exists on HEAD, skipping tag creation."
  else
    echo "❌  Tag v${NEW_VERSION} already exists on a different commit (${TAG_TARGET})."
    exit 1
  fi
else
  git tag "v${NEW_VERSION}"
fi

# ── 6. Push ─────────────────────────────────────────────────────────────────
if [[ "$SKIP_PUSH" == "true" ]]; then
  echo "⏭   Skipping git push (--skip-push)."
  echo "    Run manually: git push origin HEAD && git push origin v${NEW_VERSION}"
else
  git push origin HEAD
  git push origin "v${NEW_VERSION}"
  echo "✅  Tag v${NEW_VERSION} pushed."
fi

echo ""
echo "🎉  Release v${NEW_VERSION} complete."
