'use strict';

/**
 * Post-install step for RTK (Rust Token Killer) integration.
 *
 * 1. Check if `rtk` binary is available in PATH.
 * 2. If not, print installation instructions (does NOT auto-install).
 * 3. Check if `jq` is available (required by the hook script).
 * 4. Report status to the user.
 */

const { execFileSync } = require('child_process');
const os = require('os');
const ui = require('./ui');

function isCommandAvailable(cmd) {
  try {
    execFileSync('which', [cmd], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function getRtkVersion() {
  try {
    const out = execFileSync('rtk', ['--version'], { stdio: 'pipe' });
    return out.toString().trim();
  } catch {
    return null;
  }
}

function run() {
  const platform = os.platform();

  ui.section('RTK Token Optimization');

  // Check rtk
  const rtkAvailable = isCommandAvailable('rtk');
  if (rtkAvailable) {
    const version = getRtkVersion();
    ui.ok(`rtk found: ${version || 'unknown version'}`);
  } else {
    ui.warn('rtk binary not found in PATH');
    ui.info('Install rtk for 60-90% token savings on shell commands:');
    if (platform === 'darwin') {
      ui.info('  brew install rtk          # recommended');
    }
    ui.info('  curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh');
    ui.info('  cargo install --git https://github.com/rtk-ai/rtk');
    ui.info('');
    ui.info('After installing, restart Claude Code to activate the hook.');
  }

  // Check jq
  const jqAvailable = isCommandAvailable('jq');
  if (jqAvailable) {
    ui.ok('jq found (required by rtk hook)');
  } else {
    ui.warn('jq not found — rtk hook will silently skip until jq is installed');
    if (platform === 'darwin') {
      ui.info('  brew install jq');
    } else {
      ui.info('  apt-get install -y jq  # Debian/Ubuntu');
      ui.info('  yum install -y jq      # RHEL/CentOS');
    }
  }

  if (rtkAvailable && jqAvailable) {
    ui.ok('RTK integration ready — Bash commands will be auto-rewritten for token savings');
  }
}

module.exports = { run };

// Allow direct execution
if (require.main === module) {
  run();
}
