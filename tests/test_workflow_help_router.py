from __future__ import annotations

import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def run_node(args: list[str], cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["node", *args],
        cwd=cwd or ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


def make_repo_fixture(tmpdir: str, task_name: str = "2026-04-15-router-demo") -> tuple[Path, Path]:
    repo_dir = Path(tmpdir) / "repo"
    artifacts_dir = repo_dir / "docs" / "artifacts"
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy(ROOT / "package.json", repo_dir / "package.json")
    shutil.copytree(ROOT / "tests" / "fixtures" / "workflow-valid", artifacts_dir / task_name)
    memory_dir = repo_dir / "docs" / "memory"
    memory_dir.mkdir(parents=True, exist_ok=True)
    (memory_dir / "project-context.md").write_text(
        "\n".join(
            [
                "# Project Context",
                "",
                "## 当前活跃任务",
                f"- {task_name}",
                "",
                "## 当前阶段",
                "- execute-prep",
                "",
                "## 关键依赖",
                "- workflow-help router",
                "",
                "## 活跃风险",
                "- workflow-risk-monitored",
                "",
                "## 下一步建议",
                "- proceed execute",
                "",
            ]
        ),
        encoding="utf-8",
    )
    return repo_dir, artifacts_dir / task_name


class WorkflowHelpRouterTest(unittest.TestCase):
    def test_recommends_team_intake_for_repo_without_task_dir(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            repo_dir = Path(tmpdir) / "repo"
            repo_dir.mkdir(parents=True)
            shutil.copy(ROOT / "package.json", repo_dir / "package.json")

            result = run_node(["scripts/workflow-help.js", "--cwd", str(repo_dir), "--json"])
            self.assertEqual(result.returncode, 0, result.stderr)
            payload = json.loads(result.stdout)
            self.assertEqual(payload["recommendedCommand"], "/team-intake")
            self.assertIn("缺少 docs/artifacts", payload["missingPrerequisites"][0])
            self.assertTrue(payload["brownfieldSuggestions"])

    def test_recommends_team_execute_when_execute_readiness_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            repo_dir, task_dir = make_repo_fixture(tmpdir)
            result = run_node(["scripts/workflow-help.js", "--cwd", str(repo_dir), "--task-dir", str(task_dir), "--json"])
            self.assertEqual(result.returncode, 0, result.stderr)
            payload = json.loads(result.stdout)
            self.assertEqual(payload["recommendedCommand"], "/team-execute")
            self.assertIn("workflow:readiness", payload["readinessCheck"])
            self.assertEqual(payload["detectedPhase"], "execute-prep")

    def test_recommends_team_review_after_execute_log_exists(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            repo_dir, task_dir = make_repo_fixture(tmpdir)
            (task_dir / "execute-log.md").write_text(
                "---\nartifact: execute-log\ntask: router-demo\ndate: 2026-04-15\nrole: backend-engineer\nstatus: finalized\n---\n\n# Execute Log\n",
                encoding="utf-8",
            )

            result = run_node(["scripts/workflow-help.js", "--cwd", str(repo_dir), "--task-dir", str(task_dir), "--json"])
            self.assertEqual(result.returncode, 0, result.stderr)
            payload = json.loads(result.stdout)
            self.assertEqual(payload["recommendedCommand"], "/team-review")
            self.assertTrue(any("test-plan.md" in item for item in payload["missingPrerequisites"]))
            self.assertTrue(any("launch-acceptance.md" in item for item in payload["missingPrerequisites"]))

    def test_infers_latest_task_dir_when_not_provided(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            repo_dir, task_dir = make_repo_fixture(tmpdir, task_name="2026-04-15-z-task")
            make_repo_fixture(tmpdir, task_name="2026-04-14-a-task")

            result = run_node(["scripts/workflow-help.js", "--cwd", str(repo_dir), "--json"])
            self.assertEqual(result.returncode, 0, result.stderr)
            payload = json.loads(result.stdout)
            self.assertTrue(payload["inferredTaskDir"])
            self.assertEqual(Path(payload["taskDir"]), task_dir)

    def test_prefer_quick_is_ignored_when_task_dir_exists(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            repo_dir, task_dir = make_repo_fixture(tmpdir)
            result = run_node([
                "scripts/workflow-help.js",
                "--cwd",
                str(repo_dir),
                "--task-dir",
                str(task_dir),
                "--prefer-quick",
                "--json",
            ])
            self.assertEqual(result.returncode, 0, result.stderr)
            payload = json.loads(result.stdout)
            self.assertEqual(payload["recommendedCommand"], "/team-execute")

    def test_project_context_missing_required_sections_blocks_progress(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            repo_dir, task_dir = make_repo_fixture(tmpdir)
            (repo_dir / "docs" / "memory" / "project-context.md").write_text(
                "# Project Context\n\n## 当前阶段\n- execute-prep\n",
                encoding="utf-8",
            )

            result = run_node(["scripts/workflow-help.js", "--cwd", str(repo_dir), "--task-dir", str(task_dir), "--json"])
            self.assertEqual(result.returncode, 0, result.stderr)
            payload = json.loads(result.stdout)
            self.assertEqual(payload["recommendedCommand"], "/team-plan")
            self.assertTrue(any("write-project-context" in item for item in payload["missingPrerequisites"]))


if __name__ == "__main__":
    unittest.main()
