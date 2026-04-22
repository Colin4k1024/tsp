#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ARGS=()
if [[ -n "${CODEX_HOME_DIR:-}" ]]; then
  ARGS+=(--codex-home "$CODEX_HOME_DIR")
fi
if [[ -n "${AGENTS_HOME_DIR:-}" ]]; then
  ARGS+=(--agents-home "$AGENTS_HOME_DIR")
fi

if [[ ${#ARGS[@]} -gt 0 ]]; then
  node scripts/install-platform.js codex "${ARGS[@]}" "$@"
else
  node scripts/install-platform.js codex "$@"
fi
