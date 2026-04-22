# /trigger-pipeline

触发 GitLab 项目最新流水线中所有手动 Job。适用于发版、上线、CD 触发场景。

## 触发词

发版、上线、发布、开始部署、触发流水线、release、deploy

## 输入

用户提供 `PROJECT_ID, TOKEN`，例如 `12522, glpat-xxxxxx`

## 执行

```bash
python ~/.claude/skills/trigger-gitlab-pipeline/scripts/trigger_pipeline.py <PROJECT_ID> <TOKEN>
```

## 输出

- Latest Pipeline ID 及状态
- 找到的手动 Job 数量
- 每个 Job 的触发结果（OK / FAIL）

**特殊情况**：若输出 `No manual jobs to trigger` 或 `No pipeline records found`，任务正常结束，无需重试。
