#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ARGS=()
if [[ -n "${CURSOR_HOME_DIR:-}" ]]; then
  ARGS+=(--cursor-home "$CURSOR_HOME_DIR")
fi

if [[ ${#ARGS[@]} -gt 0 ]]; then
  node scripts/install-platform.js cursor "${ARGS[@]}" "$@"
else
  node scripts/install-platform.js cursor "$@"
fi
