#!/usr/bin/env node

/**
 * Node.js Version Preflight
 *
 * 检查 Node.js 版本是否满足 TSP 要求（>=18）。
 *
 * Usage:
 *   node scripts/grok/node-preflight.js [--strict]
 */

const semver = require('semver') || null;

const REQUIRED_VERSION = '>=18.0.0';
const CURRENT_VERSION = process.version;

/**
 * 检查 Node.js 版本
 * @param {boolean} strict 是否严格模式（失败时退出）
 * @returns {boolean} 是否满足要求
 */
function checkNodeVersion(strict = false) {
  const current = CURRENT_VERSION;
  let isValid = false;

  if (semver) {
    isValid = semver.satisfies(current, REQUIRED_VERSION);
  } else {
    // 简单的版本比较
    const match = current.match(/^v(\d+)/);
    if (match) {
      const major = parseInt(match[1], 10);
      isValid = major >= 18;
    }
  }

  if (!isValid) {
    console.error(`Node.js version check failed:`);
    console.error(`  Current: ${current}`);
    console.error(`  Required: ${REQUIRED_VERSION}`);
    console.error('');
    console.error('Please upgrade Node.js to version 18 or later.');
    console.error('Download: https://nodejs.org/');

    if (strict) {
      process.exit(1);
    }

    return false;
  }

  console.log(`Node.js version check passed: ${current}`);
  return true;
}

// CLI 接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');

  checkNodeVersion(strict);
}

module.exports = { checkNodeVersion, CURRENT_VERSION, REQUIRED_VERSION };
