#!/usr/bin/env node

/**
 * TSP Path Resolver
 *
 * 统一处理 TSP 的路径解析，支持 Claude 和 Grok 双平台：
 * - 自动检测当前平台（Claude/Grok）
 * - 提供统一的路径接口
 * - 避免直接依赖 ~/.claude 或 ~/.grok
 *
 * Usage:
 *   const { getHomeDir, getSessionDir, getPluginDir } = require('./grok/path-resolver');
 */

const path = require('path');
const os = require('os');
const fs = require('fs');

// 平台检测（优先使用 Grok 官方环境变量 GROK_HOOK_EVENT / GROK_WORKSPACE_ROOT）
const PLATFORM = (process.env.GROK_HOOK_EVENT || process.env.GROK_WORKSPACE_ROOT || process.env.GROK_HOME) ? 'grok' : 'claude';

// 路径缓存
const pathCache = {};

/**
 * 获取平台主目录
 * @returns {string} ~/.claude 或 ~/.grok
 */
function getHomeDir() {
  if (pathCache.homeDir) return pathCache.homeDir;

  const homeDir = PLATFORM === 'grok'
    ? (process.env.GROK_HOME || path.join(os.homedir(), '.grok'))
    : (process.env.CLAUDE_HOME || path.join(os.homedir(), '.claude'));

  pathCache.homeDir = homeDir;
  return homeDir;
}

/**
 * 获取工作区根目录（优先使用 Grok 官方环境变量）
 * @returns {string} 工作区根目录
 */
function getWorkspaceRoot() {
  if (pathCache.workspaceRoot) return pathCache.workspaceRoot;

  const workspaceRoot = process.env.GROK_WORKSPACE_ROOT
    || process.env.PROJECT_ROOT
    || process.cwd();

  pathCache.workspaceRoot = workspaceRoot;
  return workspaceRoot;
}

/**
 * 获取项目根目录（优先使用 Grok 官方环境变量 GROK_WORKSPACE_ROOT）
 * @returns {string} 项目根目录
 */
function getProjectRoot() {
  if (pathCache.projectRoot) return pathCache.projectRoot;

  const projectRoot = process.env.GROK_WORKSPACE_ROOT
    || process.env.PROJECT_ROOT
    || process.cwd();
  pathCache.projectRoot = projectRoot;
  return projectRoot;
}

/**
 * 获取 TSP 主目录
 * @returns {string} TSP 安装目录
 */
function getTspHome() {
  if (pathCache.tspHome) return pathCache.tspHome;

  const tspHome = process.env.TSP_HOME || path.resolve(__dirname, '../..');
  pathCache.tspHome = tspHome;
  return tspHome;
}

/**
 * 获取会话数据目录
 * @returns {string} 会话数据目录
 */
function getSessionDir() {
  const homeDir = getHomeDir();
  return path.join(homeDir, 'session-data');
}

/**
 * 获取插件目录
 * @returns {string} 插件安装目录
 */
function getPluginDir() {
  const homeDir = getHomeDir();
  return path.join(homeDir, 'installed-plugins');
}

/**
 * 获取缓存目录
 * @returns {string} 缓存目录
 */
function getCacheDir() {
  const homeDir = getHomeDir();
  return path.join(homeDir, 'cache');
}

/**
 * 获取配置文件路径
 * @returns {string} 配置文件路径
 */
function getConfigFile() {
  const homeDir = getHomeDir();
  return path.join(homeDir, 'config.toml');
}

/**
 * 获取 hooks 目录
 * @returns {string} hooks 目录
 */
function getHooksDir() {
  const homeDir = getHomeDir();
  return path.join(homeDir, 'hooks');
}

/**
 * 获取指标目录
 * @returns {string} 指标目录
 */
function getMetricsDir() {
  const homeDir = getHomeDir();
  return path.join(homeDir, 'metrics');
}

/**
 * 检查是否为 Grok 平台
 * @returns {boolean}
 */
function isGrok() {
  return PLATFORM === 'grok';
}

/**
 * 检查是否为 Claude 平台
 * @returns {boolean}
 */
function isClaude() {
  return PLATFORM === 'claude';
}

/**
 * 获取平台名称
 * @returns {string} 'grok' 或 'claude'
 */
function getPlatform() {
  return PLATFORM;
}

/**
 * 确保目录存在
 * @param {string} dir 目录路径
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 获取兼容性路径（同时支持 Claude 和 Grok）
 * 优先使用当前平台路径，回退到另一个平台
 * @param {string} relativePath 相对路径
 * @returns {string} 完整路径
 */
function getCompatiblePath(relativePath) {
  const homeDir = getHomeDir();
  const primaryPath = path.join(homeDir, relativePath);

  // 如果主路径存在，直接返回
  if (fs.existsSync(primaryPath)) {
    return primaryPath;
  }

  // 回退到另一个平台
  const fallbackHome = PLATFORM === 'grok'
    ? path.join(os.homedir(), '.claude')
    : path.join(os.homedir(), '.grok');
  const fallbackPath = path.join(fallbackHome, relativePath);

  if (fs.existsSync(fallbackPath)) {
    return fallbackPath;
  }

  // 都不存在，返回主路径
  return primaryPath;
}

// 导出
module.exports = {
  getHomeDir,
  getProjectRoot,
  getWorkspaceRoot,
  getTspHome,
  getSessionDir,
  getPluginDir,
  getCacheDir,
  getConfigFile,
  getHooksDir,
  getMetricsDir,
  isGrok,
  isClaude,
  getPlatform,
  ensureDir,
  getCompatiblePath,
  PLATFORM,
};
