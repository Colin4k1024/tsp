#!/usr/bin/env bash
# rtk-hook-version: 1 (harness-adapted)
# Adapted RTK auto-rewrite hook for harness-demo PreToolUse:Bash integration.
#
# Key difference from upstream rtk-rewrite.sh:
#   - Does NOT return permissionDecision:allow, so subsequent hooks
#     (block-no-verify, commit-quality, etc.) still execute.
#   - Only returns updatedInput to rewrite the command.
#
# Based on: https://github.com/rtk-ai/rtk/.claude/hooks/rtk-rewrite.sh
#
# Exit code protocol for `rtk rewrite`:
#   0 + stdout  → Rewrite found, no deny/ask rule matched
#   1           → No RTK equivalent, pass through unchanged
#   2           → Deny rule matched, pass through
#   3 + stdout  → Ask rule matched, rewrite but prompt user

# --- Guards: skip silently if dependencies missing ---
if ! command -v rtk &>/dev/null || ! command -v jq &>/dev/null; then
  exit 0
fi

set -euo pipefail

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$CMD" ]; then
  exit 0
fi

# Skip heredocs
case "$CMD" in
  *'<<'*) exit 0 ;;
esac

# Rewrite via rtk — single source of truth for all command mappings.
EXIT_CODE=0
REWRITTEN=$(rtk rewrite "$CMD" 2>/dev/null) || EXIT_CODE=$?

case $EXIT_CODE in
  0)
    # Rewrite found
    if [ "$CMD" = "$REWRITTEN" ]; then
      # Already using rtk, no change needed
      exit 0
    fi
    ;;
  1|2)
    # No RTK equivalent or deny rule — pass through unchanged
    exit 0
    ;;
  3)
    # Ask rule matched — rewrite but do not auto-allow
    ;;
  *)
    exit 0
    ;;
esac

# Build the updated tool_input with only command changed.
ORIGINAL_INPUT=$(echo "$INPUT" | jq -c '.tool_input')
UPDATED_INPUT=$(echo "$ORIGINAL_INPUT" | jq --arg cmd "$REWRITTEN" '.command = $cmd')

# Return updatedInput WITHOUT permissionDecision so that:
# 1. The command gets rewritten to rtk equivalent
# 2. Subsequent hooks (safety, quality) still execute
# 3. Normal permission flow continues
jq -n \
  --argjson updated "$UPDATED_INPUT" \
  '{
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "updatedInput": $updated
    }
  }'
