# Memory Persistence — 仓库感知经验系统

本模块在会话开始和结束时，从仓库自身提取上下文与经验，而不依赖 Claude 主动发送结构化数据（实践证明后者极少发生）。

## 核心思路

```
会话结束                          会话开始
  ↓                                 ↓
git log → 提交清单              docs/memory/project-context.md ← 项目当前状态
  ↓                                 ↓
docs/memory/ → 项目结构化记录   docs/memory/lessons-learned.md ← 可复用经验
  ↓                                 ↓
分类 + 提炼经验胶囊             docs/memory/sessions/*.md ← 上次完成了什么
  ↓                                 ↓
~/.claude/memory/sessions/       经验胶囊（来自上次 session_end）
  {session_id}.json
  {session_id}_experience.json
```

## 两个 hook

### session_end.py — 仓库感知收割

触发时机：Claude 会话结束（`Stop` 事件）

**做什么：**
1. `git log -15` 获取最近 15 次提交：commit msg、changed files
2. 读取 `docs/memory/project-context.md`、`decisions.md`、`lessons-learned.md`、`sessions/*.md`
3. 按 domain（skills / commands / roles / agents / docs / scripts / hooks）分类变更
4. 提炼经验胶囊：`{domain, type, summary, commit, date}`
5. 持久化到 `~/.claude/memory/sessions/<id>.json` + `<id>_experience.json`

**不做什么：**
- 不等待 Claude 发送 JSON（之前的方式，实际收不到）
- 不修改仓库内任何文件

---

### session_start.py — 双源上下文加载

触发时机：Claude 会话开始（`SessionStart` 事件）

**做什么：**

| 来源 | 加载内容 |
|------|----------|
| `docs/memory/project-context.md` | 项目当前状态摘要 |
| `docs/memory/decisions.md` | 待确认决策（提取"待/pending"行） |
| `docs/memory/lessons-learned.md` | 可复用经验标题列表 |
| `docs/memory/sessions/*.md` | 上次会话完成事项 |
| `~/.claude/memory/sessions/*_experience.json` | 上次 session_end 提炼的经验胶囊 |

**输出 payload：**
```json
{
  "project_context_summary": "一行话描述项目当前状态",
  "repo_memory_files_found": ["project-context.md", "decisions.md", ...],
  "recent_accomplishments": ["feat: 新增 Cursor 支持", ...],
  "lessons_available": ["...", "..."],
  "pending_items": ["待确认：...", ...],
  "pending_decisions_count": 2,
  "experience_capsules": [{"domain":"skills","type":"feat","summary":"..."},...],
  "domains_touched": {"skills": 5, "commands": 3},
  "previous_commits_harvested": 12,
  "next_session_hints": ["上次 feat: ...", "可参考经验: ..."]
}
```

## 存储结构

```
~/.claude/memory/
└── sessions/
    ├── session_xxx.json             # SessionSummary（tasks / key_findings / pending）
    └── session_xxx_experience.json  # 经验胶囊（commits / domains / capsules）
```

仓库内（authoritative source，由团队命令手动写入）：
```
docs/memory/
├── project-context.md      # 当前任务 / tech stack / 风险（覆盖更新）
├── decisions.md            # 决策日志（追加）
├── lessons-learned.md      # 经验教训（追加）
└── sessions/
    └── YYYY-MM-DD-NNN-slug.md   # 每次 /team-release 写入
```

## 与旧版的区别

| 维度 | 旧版 | 新版 |
|------|------|------|
| 数据来源 | 等待 Claude 主动发送 JSON | 主动读取 git log + docs/memory/ |
| 覆盖率 | 几乎为空（Claude 不发送） | 完整：提交历史 + 结构化文档 |
| 经验提取 | 无 | 按 domain/type 分类的经验胶囊 |
| 启动提示 | "无历史" | 项目状态 + 待办 + 可复用经验 |

