'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_CONFIG = {
  always_on: false,
  flavor: 'alibaba',
  feedback_enabled: false,
};

const DEFAULT_STATE = {
  failure_count: 0,
  level: 'L0',
  last_tool: '',
  last_reason: '',
  last_updated: '',
  last_success_at: '',
  route: 'alibaba',
};

function getPuaDir() {
  return path.join(os.homedir(), '.claude', 'pua');
}

function ensurePuaDir() {
  fs.mkdirSync(getPuaDir(), { recursive: true });
}

function getConfigPath() {
  return path.join(getPuaDir(), 'config.json');
}

function getStatePath() {
  return path.join(getPuaDir(), 'state.json');
}

function getJournalPath() {
  return path.join(getPuaDir(), 'builder-journal.md');
}

function safeReadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return { ...fallback, ...JSON.parse(fs.readFileSync(filePath, 'utf8')) };
  } catch {
    return fallback;
  }
}

function safeWriteJson(filePath, value) {
  ensurePuaDir();
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readConfig() {
  return safeReadJson(getConfigPath(), DEFAULT_CONFIG);
}

function writeConfig(config) {
  safeWriteJson(getConfigPath(), { ...DEFAULT_CONFIG, ...config });
}

function readState() {
  return safeReadJson(getStatePath(), DEFAULT_STATE);
}

function writeState(state) {
  safeWriteJson(getStatePath(), { ...DEFAULT_STATE, ...state });
}

function levelFromFailures(count) {
  if (count >= 5) return 'L4';
  if (count >= 4) return 'L3';
  if (count >= 3) return 'L2';
  if (count >= 2) return 'L1';
  return 'L0';
}

function flavorLabel(flavor) {
  const labels = {
    alibaba: '🟠 阿里',
    huawei: '🔴 华为',
    musk: '⬛ Musk',
    jobs: '⬜ Jobs',
    amazon: '🔶 Amazon',
    baidu: '⚫ 百度',
    tencent: '🟢 腾讯',
    pinduoduo: '🟣 拼多多',
    meituan: '🔵 美团',
    jd: '🟦 京东',
    xiaomi: '🟧 小米',
    bytedance: '🟡 字节',
    netflix: '🟤 Netflix',
    mama: '👩 中文妈妈',
    yes: '🌤 鼓励模式',
  };
  return labels[flavor] || '🟠 阿里';
}

function appendJournal(section) {
  ensurePuaDir();
  const journalPath = getJournalPath();
  const prefix = fs.existsSync(journalPath) ? '\n' : '# PUA Builder Journal\n';
  fs.appendFileSync(journalPath, `${prefix}${section}\n`, 'utf8');
}

module.exports = {
  DEFAULT_CONFIG,
  DEFAULT_STATE,
  appendJournal,
  flavorLabel,
  getConfigPath,
  getJournalPath,
  getPuaDir,
  getStatePath,
  levelFromFailures,
  readConfig,
  readState,
  writeConfig,
  writeState,
};
