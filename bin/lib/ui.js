'use strict';

/**
 * Terminal UI helpers — ANSI-only, zero external dependencies.
 */

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RED = '\x1b[31m';
const MAGENTA = '\x1b[35m';

function bold(text) { return `${BOLD}${text}${RESET}`; }
function dim(text) { return `${DIM}${text}${RESET}`; }
function green(text) { return `${GREEN}${text}${RESET}`; }
function yellow(text) { return `${YELLOW}${text}${RESET}`; }
function cyan(text) { return `${CYAN}${text}${RESET}`; }
function red(text) { return `${RED}${text}${RESET}`; }
function magenta(text) { return `${MAGENTA}${text}${RESET}`; }

function banner() {
  console.log();
  console.log(cyan(bold('  ╔══════════════════════════════════════════╗')));
  console.log(cyan(bold('  ║') + '   🚀  Team Skills Platform Installer    ' + bold('║')));
  console.log(cyan(bold('  ╚══════════════════════════════════════════╝')));
  console.log();
}

function step(number, text) {
  console.log(`  ${cyan(bold(`[${number}]`))} ${text}`);
}

function success(text) {
  console.log(`  ${green('✔')} ${text}`);
}

function warn(text) {
  console.log(`  ${yellow('⚠')} ${text}`);
}

function error(text) {
  console.error(`  ${red('✖')} ${text}`);
}

function info(text) {
  console.log(`  ${dim('ℹ')} ${dim(text)}`);
}

function separator() {
  console.log(dim('  ─'.repeat(22)));
}

function printPlanSummary(plan) {
  console.log();
  separator();
  console.log(`  ${bold('Install Plan Summary')}`);
  separator();
  console.log(`  Target:   ${cyan(plan.target)}`);
  console.log(`  Profile:  ${cyan(plan.profileId || '(custom)')}`);
  console.log(`  Modules:  ${cyan(String(plan.selectedModuleIds?.length || plan.requestedModuleIds?.length || 0))}`);
  console.log(`  Files:    ${cyan(String(plan.operations?.length || 0))}`);
  if (plan.installRoot) {
    console.log(`  Root:     ${dim(plan.installRoot)}`);
  }
  separator();
  console.log();
}

module.exports = {
  banner,
  step,
  success,
  warn,
  error,
  info,
  separator,
  printPlanSummary,
  bold,
  dim,
  green,
  yellow,
  cyan,
  red,
  magenta,
};
