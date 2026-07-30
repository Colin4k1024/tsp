#!/bin/bash
set -e
cd /Users/fanjia/Desktop/code/tsp

echo "=== Step 0: Clean build dir and install babel deps ==="
rm -rf .grok-build
npm install --save-dev @babel/parser @babel/traverse 2>&1 | tail -10
echo "=== Deps installed ==="

echo ""
echo "=== Step 1: DRY RUN ==="
node scripts/grok/install-to-grok.js --dry-run 2>&1
echo "=== Dry run done ==="

echo ""
echo "=== Step 2: ACTUAL INSTALL ==="
node scripts/grok/install-to-grok.js 2>&1
echo "=== Install done ==="

echo ""
echo "=== Step 3: Verify tsp skill count ==="
ls ~/.grok/skills/ | grep -c tsp || echo "0 tsp skills found"

echo ""
echo "=== Step 4: First 30 skills ==="
ls ~/.grok/skills/ | head -30

echo ""
echo "=== Step 5: Check SKILL.md files ==="
if [ -f ~/.grok/skills/team-builder/SKILL.md ]; then echo "team-builder SKILL.md: OK"; else echo "team-builder SKILL.md: MISSING"; fi
if [ -f ~/.grok/skills/tdd-workflow/SKILL.md ]; then echo "tdd-workflow SKILL.md: OK"; else echo "tdd-workflow SKILL.md: MISSING"; fi

echo ""
echo "=== ALL DONE ==="
