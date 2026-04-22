#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ARGS=()
if [[ -n "${CLAUDE_HOME_DIR:-}" ]]; then
  ARGS+=(--claude-home "$CLAUDE_HOME_DIR")
fi

if [[ ${#ARGS[@]} -gt 0 ]]; then
  node scripts/install-platform.js claude "${ARGS[@]}" "$@"
else
  node scripts/install-platform.js claude "$@"
fi
