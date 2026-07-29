#!/usr/bin/env node

/**
 * Grok Plugin Validator
 *
 * 验证 Grok 插件的完整性和安全性：
 * - 检查是否意外写入 Claude 目录
 * - 验证 plugin.json 格式
 * - 检查文件完整性
 *
 * Usage:
 *   node scripts/grok/validate-plugin.js <plugin-dir>
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE_HOME = path.join(os.homedir(), '.claude');
const GROK_HOME = path.join(os.homedir(), '.grok');

/**
 * 验证 plugin.json 格式
 */
function validateManifest(manifestPath) {
  const errors = [];

  if (!fs.existsSync(manifestPath)) {
    errors.push('plugin.json not found');
    return { valid: false, errors };
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // 必需字段
    const requiredFields = ['name', 'version', 'description'];
    for (const field of requiredFields) {
      if (!manifest[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // 版本格式
    if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
      errors.push(`Invalid version format: ${manifest.version}`);
    }

    // capabilities 字段
    if (manifest.capabilities) {
      const validCapabilities = ['skills', 'commands', 'agents', 'hooks'];
      for (const cap of Object.keys(manifest.capabilities)) {
        if (!validCapabilities.includes(cap)) {
          errors.push(`Unknown capability: ${cap}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      manifest,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Failed to parse plugin.json: ${error.message}`],
    };
  }
}

/**
 * 检查文件是否引用 Claude 目录
 */
function checkClaudeReferences(dir) {
  const violations = [];
  const claudePatterns = [
    /\~\/\.claude/,
    /\$\{CLAUDE_HOME\}/,
    /\$\{CLAUDE_PLUGIN_ROOT\}/,
    /CLAUDE_HOME/,
    /CLAUDE_PROJECT_ROOT/,
  ];

  function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      for (const pattern of claudePatterns) {
        if (pattern.test(lines[i])) {
          violations.push({
            file: filePath,
            line: i + 1,
            content: lines[i].trim(),
            pattern: pattern.toString(),
          });
        }
      }
    }
  }

  function scanDir(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // 跳过 node_modules 和 .git
        if (entry.name === 'node_modules' || entry.name === '.git') {
          continue;
        }
        scanDir(fullPath);
      } else if (entry.isFile() && /\.(js|ts|sh|md|json)$/.test(entry.name)) {
        scanFile(fullPath);
      }
    }
  }

  scanDir(dir);
  return violations;
}

/**
 * 检查文件完整性
 */
function checkFileIntegrity(pluginDir) {
  const issues = [];

  // 检查 manifest
  const manifestPath = path.join(pluginDir, '.grok-plugin', 'plugin.json');
  const manifestResult = validateManifest(manifestPath);

  if (!manifestResult.valid) {
    issues.push(...manifestResult.errors);
  }

  // 检查引用的文件是否存在
  if (manifestResult.manifest) {
    const manifest = manifestResult.manifest;

    // 检查 skills
    if (manifest.skills) {
      for (const skill of manifest.skills) {
        const skillPath = path.join(pluginDir, skill);
        if (!fs.existsSync(skillPath)) {
          issues.push(`Skill not found: ${skill}`);
        }
      }
    }

    // 检查 agents
    if (manifest.agents) {
      for (const agent of manifest.agents) {
        const agentPath = path.join(pluginDir, agent);
        if (!fs.existsSync(agentPath)) {
          issues.push(`Agent not found: ${agent}`);
        }
      }
    }
  }

  return issues;
}

/**
 * 主验证函数
 */
function validatePlugin(pluginDir) {
  console.log(`Validating plugin: ${pluginDir}`);
  console.log('');

  const results = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // 1. 验证 manifest
  console.log('1. Validating plugin.json...');
  const manifestPath = path.join(pluginDir, '.grok-plugin', 'plugin.json');
  const manifestResult = validateManifest(manifestPath);

  if (!manifestResult.valid) {
    results.valid = false;
    results.errors.push(...manifestResult.errors);
    console.log('   ❌ Invalid');
  } else {
    console.log('   ✅ Valid');
  }

  // 2. 检查 Claude 目录引用
  console.log('2. Checking for Claude directory references...');
  const violations = checkClaudeReferences(pluginDir);

  if (violations.length > 0) {
    results.warnings.push(`Found ${violations.length} Claude directory references`);
    console.log(`   ⚠️  Found ${violations.length} references`);

    // 显示前 5 个违规
    for (const v of violations.slice(0, 5)) {
      console.log(`      - ${v.file}:${v.line}`);
    }
    if (violations.length > 5) {
      console.log(`      ... and ${violations.length - 5} more`);
    }
  } else {
    console.log('   ✅ No Claude references found');
  }

  // 3. 检查文件完整性
  console.log('3. Checking file integrity...');
  const integrityIssues = checkFileIntegrity(pluginDir);

  if (integrityIssues.length > 0) {
    results.valid = false;
    results.errors.push(...integrityIssues);
    console.log('   ❌ Integrity issues found');
  } else {
    console.log('   ✅ All files present');
  }

  // 输出结果
  console.log('');
  console.log('='.repeat(50));
  console.log(`Validation ${results.valid ? 'PASSED' : 'FAILED'}`);

  if (results.errors.length > 0) {
    console.log('');
    console.log('Errors:');
    for (const error of results.errors) {
      console.log(`  ❌ ${error}`);
    }
  }

  if (results.warnings.length > 0) {
    console.log('');
    console.log('Warnings:');
    for (const warning of results.warnings) {
      console.log(`  ⚠️  ${warning}`);
    }
  }

  return results;
}

// CLI 接口
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage:');
    console.log('  validate-plugin.js <plugin-dir>');
    process.exit(1);
  }

  const pluginDir = path.resolve(args[0]);
  const results = validatePlugin(pluginDir);

  process.exit(results.valid ? 0 : 1);
}

module.exports = { validatePlugin, validateManifest, checkClaudeReferences };
