#!/usr/bin/env node
/**
 * Grok Build 测试套件运行器
 *
 * 运行所有 Grok Build 适配相关测试，输出汇总结果。
 *
 * Usage:
 *   node tests/run-grok-tests.js          # 运行全部
 *   node tests/run-grok-tests.js --fast    # 跳过集成测试（不执行 packager）
 */

const { execSync } = require("child_process");
const path = require("path");

const isFast = process.argv.includes("--fast");

const tests = [
  { name: "Path Resolver", file: "test_grok_path_resolver.js", required: true },
  { name: "Event Bridge", file: "test_grok_event_bridge.js", required: true },
  { name: "Hook Wrapper", file: "test_grok_hook_wrapper.js", required: true },
  { name: "Packager", file: "test_grok_packager.js", required: true },
  { name: "Validate Plugin", file: "test_grok_validate_plugin.js", required: true },
  { name: "Release", file: "test_grok_release.js", required: !isFast },
  { name: "Integration (E2E)", file: "test_grok_integration.js", required: !isFast },
];

let totalPassed = 0;
let totalFailed = 0;
const results = [];

console.log("╔══════════════════════════════════════════════════════════╗");
console.log("║          Grok Build 适配测试套件                        ║");
console.log("╚══════════════════════════════════════════════════════════╝");
console.log(`模式: ${isFast ? "快速（跳过集成测试）" : "完整"}\n`);

for (const test of tests) {
  if (!test.required) {
    console.log(`⏭️  跳过: ${test.name}`);
    results.push({ name: test.name, status: "skipped" });
    continue;
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`▶ ${test.name}`);
  console.log(`${"─".repeat(60)}`);

  const testPath = path.join(__dirname, test.file);
  const startTime = Date.now();

  try {
    const output = execSync(`node "${testPath}"`, {
      encoding: "utf-8",
      timeout: 120000,
      cwd: path.resolve(__dirname, ".."),
      stdio: ["pipe", "pipe", "pipe"],
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(output);

    // 从输出中提取通过/失败数
    const match = output.match(/(\d+) passed, (\d+) failed/);
    if (match) {
      totalPassed += parseInt(match[1]);
      totalFailed += parseInt(match[2]);
    }

    results.push({ name: test.name, status: "pass", duration });
    console.log(`✅ ${test.name} 通过 (${duration}s)`);
  } catch (e) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(e.stdout || "");
    console.log(e.stderr || "");

    const match = (e.stdout || "").match(/(\d+) passed, (\d+) failed/);
    if (match) {
      totalPassed += parseInt(match[1]);
      totalFailed += parseInt(match[2]);
    }

    results.push({ name: test.name, status: "fail", duration });
    console.log(`❌ ${test.name} 失败 (${duration}s)`);
  }
}

// ── 汇总 ─────────────────────────────────────────────────────────────────

console.log(`\n${"═".repeat(60)}`);
console.log(`  测试汇总`);
console.log(`${"═".repeat(60)}\n`);

for (const r of results) {
  const icon = r.status === "pass" ? "✅" : r.status === "fail" ? "❌" : "⏭️";
  const duration = r.duration ? ` (${r.duration}s)` : "";
  console.log(`  ${icon} ${r.name}${duration}`);
}

console.log(`\n  总计: ${totalPassed} passed, ${totalFailed} failed`);
console.log(`\n${"═".repeat(60)}`);

process.exit(totalFailed > 0 ? 1 : 0);
