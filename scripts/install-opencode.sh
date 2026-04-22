#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ARGS=()
if [[ -n "${OPENCODE_CONFIG_DIR:-}" ]]; then
  ARGS+=(--opencode-home "$OPENCODE_CONFIG_DIR")
fi

if [[ ${#ARGS[@]} -gt 0 ]]; then
  node scripts/install-platform.js opencode "${ARGS[@]}" "$@"
else
  node scripts/install-platform.js opencode "$@"
fi
