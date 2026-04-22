'use strict';

/**
 * Node.js wrapper for hooks/rtk-rewrite.sh
 *
 * Provides cross-platform compatibility:
 * - On Unix: delegates to the shell script
 * - On Windows: passes through (rtk hook not supported)
 *
 * This wrapper is registered in hooks.json and called by the harness.
 */

const { execFileSync } = require('child_process');
const path = require('path');
const os = require('os');

// Windows: rtk hook not supported, pass through silently
if (os.platform() === 'win32') {
  process.exit(0);
}

// Check dependencies
try {
  execFileSync('which', ['rtk'], { stdio: 'pipe' });
} catch {
  // rtk not installed, skip silently
  process.exit(0);
}

try {
  execFileSync('which', ['jq'], { stdio: 'pipe' });
} catch {
  // jq not installed, skip silently
  process.exit(0);
}

// Collect stdin
const chunks = [];
process.stdin.on('data', (chunk) => chunks.push(chunk));
process.stdin.on('end', () => {
  const input = Buffer.concat(chunks).toString();

  const hookScript = path.resolve(
    __dirname,
    '..',
    '..',
    'hooks',
    'rtk-rewrite.sh'
  );

  try {
    const result = execFileSync('bash', [hookScript], {
      input,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 5000, // 5s timeout — rtk rewrite should be <10ms
    });

    const output = result.toString().trim();
    if (output) {
      process.stdout.write(output);
    }
  } catch {
    // Any error: pass through silently
    process.exit(0);
  }
});
