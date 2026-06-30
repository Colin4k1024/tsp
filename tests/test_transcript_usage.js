#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  resolveContextLimit,
  readTailLines,
  parseTranscriptUsage,
  resolveTranscriptMetrics,
  normalizeUsage,
  DEFAULT_CONTEXT_LIMIT,
  EXTENDED_CONTEXT_LIMIT,
} = require('../scripts/lib/transcript-usage');

let passed = 0;
let failed = 0;

function assert(description, condition) {
  if (condition) {
    console.log(`  ✅ ${description}`);
    passed++;
  } else {
    console.log(`  ❌ ${description}`);
    failed++;
  }
}

function assertEq(description, actual, expected) {
  if (actual === expected) {
    console.log(`  ✅ ${description}`);
    passed++;
  } else {
    console.log(`  ❌ ${description}: expected ${expected}, got ${actual}`);
    failed++;
  }
}

const tmpDir = path.join(os.tmpdir(), `test-transcript-usage-${Date.now()}`);
fs.mkdirSync(tmpDir, { recursive: true });

function writeTempJsonl(filename, entries) {
  const filePath = path.join(tmpDir, filename);
  const content = entries.map(e => JSON.stringify(e)).join('\n') + '\n';
  fs.writeFileSync(filePath, content);
  return filePath;
}

// --- Test: resolveContextLimit ---
console.log('\n📐 resolveContextLimit');
assertEq('default model → 200K', resolveContextLimit('claude-opus-4-6'), DEFAULT_CONTEXT_LIMIT);
assertEq('[1M] suffix → 1M', resolveContextLimit('claude-opus-4-6[1M]'), EXTENDED_CONTEXT_LIMIT);
assertEq('[1m] lowercase → 1M', resolveContextLimit('claude-sonnet-4-5[1m]'), EXTENDED_CONTEXT_LIMIT);
assertEq('null model → 200K', resolveContextLimit(null), DEFAULT_CONTEXT_LIMIT);
assertEq('empty string → 200K', resolveContextLimit(''), DEFAULT_CONTEXT_LIMIT);

// --- Test: normalizeUsage ---
console.log('\n📊 normalizeUsage');
const usage1 = normalizeUsage({
  input_tokens: 5000,
  output_tokens: 300,
  cache_creation_input_tokens: 50000,
  cache_read_input_tokens: 60000,
});
assertEq('contextTokens follows CCometixLine prompt-side sum', usage1.contextTokens, 115000);
assertEq('inputTokens', usage1.inputTokens, 5000);
assertEq('outputTokens', usage1.outputTokens, 300);
assertEq('cacheCreationTokens', usage1.cacheCreationTokens, 50000);
assertEq('cacheReadTokens', usage1.cacheReadTokens, 60000);

assertEq('null input → null', normalizeUsage(null), null);
assertEq('empty object → null', normalizeUsage({}), null);
assertEq('all zeros → null', normalizeUsage({ input_tokens: 0 }), null);

// OpenAI format
const usage2 = normalizeUsage({ prompt_tokens: 1000, completion_tokens: 200 });
assertEq('OpenAI prompt-side contextTokens', usage2.contextTokens, 1000);

// --- Test: readTailLines ---
console.log('\n📖 readTailLines');
const bigFile = path.join(tmpDir, 'big.jsonl');
const bigLines = [];
for (let i = 0; i < 1000; i++) {
  bigLines.push(JSON.stringify({ type: 'user', index: i }));
}
bigLines.push(JSON.stringify({ type: 'assistant', message: { usage: { input_tokens: 9999, output_tokens: 100 } } }));
fs.writeFileSync(bigFile, bigLines.join('\n') + '\n');

const tail = readTailLines(bigFile, 4096);
assert('tail returns lines', tail.length > 0);
assert('tail contains last entry', tail.some(l => l.includes('"input_tokens":9999')));

assertEq('non-existent file → empty', readTailLines('/nonexistent/path.jsonl').length, 0);

const emptyFile = path.join(tmpDir, 'empty.jsonl');
fs.writeFileSync(emptyFile, '');
assertEq('empty file → empty', readTailLines(emptyFile).length, 0);

// --- Test: parseTranscriptUsage ---
console.log('\n🔍 parseTranscriptUsage');

const transcript1 = writeTempJsonl('session1.jsonl', [
  { type: 'user', message: { content: 'hello' } },
  { type: 'assistant', message: { content: [{ type: 'text', text: 'hi' }], usage: { input_tokens: 3000, output_tokens: 200, cache_creation_input_tokens: 50000, cache_read_input_tokens: 60000 } } },
  { type: 'user', message: { content: 'more' } },
  { type: 'assistant', message: { content: [{ type: 'text', text: 'ok' }], usage: { input_tokens: 4000, output_tokens: 500, cache_creation_input_tokens: 55000, cache_read_input_tokens: 65000 } } },
]);
const result1 = parseTranscriptUsage(transcript1);
assertEq('finds last assistant usage', result1.contextTokens, 4000 + 55000 + 65000);

const transcript2 = writeTempJsonl('no-assistant.jsonl', [
  { type: 'user', message: { content: 'hello' } },
  { type: 'tool_use', name: 'read_file' },
  { type: 'tool_result', output: 'content' },
]);
assertEq('no assistant entries → null', parseTranscriptUsage(transcript2), null);

assertEq('null path → null', parseTranscriptUsage(null), null);
assertEq('non-existent path → null', parseTranscriptUsage('/no/such/file.jsonl'), null);
assertEq('empty file → null', parseTranscriptUsage(emptyFile), null);

// --- Test: resolveTranscriptMetrics ---
console.log('\n📈 resolveTranscriptMetrics');

const metrics1 = resolveTranscriptMetrics(transcript1, 'claude-opus-4-6');
assert('returns metrics object', metrics1 != null);
assertEq('source is transcript_usage', metrics1.source, 'transcript_usage');
assertEq('contextLimit is 200K', metrics1.contextLimit, 200000);
assertEq('remainingTokens is derived', metrics1.remainingTokens, 200000 - (4000 + 55000 + 65000));
assertEq('remainingPct is derived', metrics1.remainingPct, 38);
assert('usagePct is reasonable', metrics1.usagePct > 0 && metrics1.usagePct <= 100);

const metrics2 = resolveTranscriptMetrics(transcript1, 'claude-opus-4-6[1M]');
assertEq('1M model contextLimit', metrics2.contextLimit, 1000000);
assert('1M model lower usagePct', metrics2.usagePct < metrics1.usagePct);

assertEq('no transcript → null', resolveTranscriptMetrics(null, 'claude-opus-4-6'), null);

// --- Test: Integration with suggest-compact resolveContextMetrics ---
console.log('\n🔗 Integration with resolveContextMetrics');
const { resolveContextMetrics } = require('../scripts/hooks/suggest-compact');

const intResult = resolveContextMetrics({
  transcript_path: transcript1,
  model: { id: 'claude-opus-4-6' },
  context_window: null,
});
assert('resolveContextMetrics returns metrics when context_window is null', intResult != null);
assertEq('source is transcript_usage', intResult.source, 'transcript_usage');
assert('usagePct > 0', intResult.usagePct > 0);

// Cleanup
fs.rmSync(tmpDir, { recursive: true, force: true });

// --- Summary ---
console.log(`\n=== 测试总结 ===`);
console.log(`通过: ${passed}`);
console.log(`失败: ${failed}`);
console.log(`总计: ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 所有测试通过！');
  process.exit(0);
} else {
  console.log('\n⚠️  部分测试失败');
  process.exit(1);
}
