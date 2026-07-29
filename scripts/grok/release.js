#!/usr/bin/env node

/**
 * TSP Grok Release Script
 *
 * 生成 Grok Compatibility Pack 发布包：
 * - 验证插件完整性
 * - 生成发布 manifest
 * - 创建 Git tag
 * - 打包发布文件
 *
 * Usage:
 *   node scripts/grok/release.js [--version <version>] [--tag] [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TSP_ROOT = path.resolve(__dirname, '../..');
const BUILD_DIR = path.join(TSP_ROOT, '.grok-build');
const TSP_VERSION = require(path.join(TSP_ROOT, 'package.json')).version;
const ADAPTER_VERSION = '0.1.0';

/**
 * 验证构建产物
 */
function validateBuild() {
  console.log('Validating build...');

  // 检查 plugin.json
  const manifestPath = path.join(BUILD_DIR, '.grok-plugin', 'plugin.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('plugin.json not found');
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  // 验证版本
  if (manifest.version !== TSP_VERSION) {
    throw new Error(`Version mismatch: expected ${TSP_VERSION}, got ${manifest.version}`);
  }

  // 验证组件数量
  const skills = fs.readdirSync(path.join(BUILD_DIR, 'skills')).length;
  const agents = fs.readdirSync(path.join(BUILD_DIR, 'agents')).length;

  console.log(`  Skills: ${skills}`);
  console.log(`  Agents: ${agents}`);
  console.log(`  Version: ${manifest.version}`);

  return { skills, agents, manifest };
}

/**
 * 生成发布 manifest
 */
function generateReleaseManifest(validation) {
  console.log('Generating release manifest...');

  const releaseManifest = {
    name: 'tsp-grok-compatibility-pack',
    version: TSP_VERSION,
    adapter_version: ADAPTER_VERSION,
    description: 'TSP Grok Compatibility Pack',
    author: 'Colin4k1024',
    license: 'MIT',
    homepage: 'https://github.com/Colin4k1024/tsp',
    compatibility: {
      tsp: TSP_VERSION,
      grok: '>=0.2.109',
      node: '>=18',
    },
    components: {
      skills: validation.skills,
      agents: validation.agents,
    },
    generated_at: new Date().toISOString(),
    git_commit: getGitCommit(),
    git_tag: null,
  };

  const manifestPath = path.join(BUILD_DIR, 'release-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(releaseManifest, null, 2));

  console.log(`  Written to: ${manifestPath}`);
  return releaseManifest;
}

/**
 * 获取 Git commit hash
 */
function getGitCommit() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  } catch (e) {
    return 'unknown';
  }
}

/**
 * 创建 Git tag
 */
function createGitTag(version) {
  console.log(`Creating Git tag: v${version}-grok`);

  try {
    execSync(`git tag -a "v${version}-grok" -m "TSP Grok Compatibility Pack v${version}"`, {
      cwd: TSP_ROOT,
      stdio: 'inherit',
    });
    console.log('  Tag created successfully');
    return true;
  } catch (e) {
    console.error('  Failed to create tag:', e.message);
    return false;
  }
}

/**
 * 打包发布文件
 */
function createReleasePackage(version) {
  console.log('Creating release package...');

  const packageName = `tsp-grok-${version}.tar.gz`;
  const packagePath = path.join(TSP_ROOT, packageName);

  try {
    execSync(`tar -czf "${packageName}" -C "${BUILD_DIR}" .`, {
      cwd: TSP_ROOT,
      stdio: 'inherit',
    });

    const stats = fs.statSync(packagePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

    console.log(`  Package: ${packageName}`);
    console.log(`  Size: ${sizeMB} MB`);

    return { packageName, packagePath, sizeMB };
  } catch (e) {
    console.error('  Failed to create package:', e.message);
    return null;
  }
}

/**
 * 生成发布说明
 */
function generateReleaseNotes(version, validation, releaseManifest) {
  console.log('Generating release notes...');

  const notes = `# TSP Grok Compatibility Pack v${version}

## 版本信息

- TSP Version: ${TSP_VERSION}
- Adapter Version: ${ADAPTER_VERSION}
- Grok Requirement: >=0.2.109
- Node.js Requirement: >=18

## 组件统计

- Skills: ${validation.skills}
- Agents: ${validation.agents}

## 安装方式

\`\`\`bash
grok plugin install https://github.com/Colin4k1024/tsp.git --trust
\`\`\`

## 卸载方式

\`\`\`bash
grok plugin uninstall tsp
\`\`\`

## 兼容性

| 组件 | 版本 |
|------|------|
| TSP | ${TSP_VERSION} |
| Grok | >=0.2.109 |
| Node.js | >=18 |

## 变更日志

- 初始版本，支持 203 skills、87 commands、35 agents
- 完整的 provenance 元数据
- 自动替换 Claude 目录引用
- 验证通过，无 Claude 目录依赖

## 已知限制

- Hooks 功能尚未启用（Phase 3）
- 部分 hooks 依赖特定环境变量
- 需要 --trust 标志安装

## 下一步

- [ ] 启用 observe-only hooks
- [ ] 添加 blocking hooks 支持
- [ ] 性能优化和 token 预算控制
- [ ] 跨版本回归测试

---

Generated at: ${new Date().toISOString()}
Git Commit: ${releaseManifest.git_commit}
`;

  const notesPath = path.join(BUILD_DIR, 'RELEASE_NOTES.md');
  fs.writeFileSync(notesPath, notes);

  console.log(`  Written to: ${notesPath}`);
  return notes;
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const shouldTag = args.includes('--tag');
  const versionIndex = args.indexOf('--version');
  const version = versionIndex !== -1 ? args[versionIndex + 1] : TSP_VERSION;

  console.log('TSP Grok Release');
  console.log('================');
  console.log(`Version: ${version}`);
  console.log('');

  // 1. 验证构建
  let validation;
  try {
    validation = validateBuild();
  } catch (e) {
    console.error('Validation failed:', e.message);
    process.exit(1);
  }
  console.log('');

  if (isDryRun) {
    console.log('Dry run - no changes made');
    return;
  }

  // 2. 生成发布 manifest
  const releaseManifest = generateReleaseManifest(validation);
  console.log('');

  // 3. 生成发布说明
  generateReleaseNotes(version, validation, releaseManifest);
  console.log('');

  // 4. 创建 Git tag（可选）
  if (shouldTag) {
    createGitTag(version);
    console.log('');
  }

  // 5. 打包发布文件
  const packageInfo = createReleasePackage(version);
  console.log('');

  // 输出总结
  console.log('='.repeat(50));
  console.log('Release Summary');
  console.log('='.repeat(50));
  console.log(`Version: ${version}`);
  console.log(`Skills: ${validation.skills}`);
  console.log(`Agents: ${validation.agents}`);
  console.log(`Git Commit: ${releaseManifest.git_commit}`);

  if (packageInfo) {
    console.log(`Package: ${packageInfo.packageName} (${packageInfo.sizeMB} MB)`);
  }

  console.log('');
  console.log('Next steps:');
  console.log('1. Review RELEASE_NOTES.md');
  console.log('2. Test the plugin: grok plugin install .grok-build --trust');
  console.log('3. Push tag: git push origin v' + version + '-grok');
  console.log('4. Create GitHub release');
}

main();
