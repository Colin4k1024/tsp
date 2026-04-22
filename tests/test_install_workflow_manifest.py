from __future__ import annotations

import json
import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def run_node(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["node", *args],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


class InstallWorkflowManifestTest(unittest.TestCase):
    def test_workflow_modules_exist_in_manifest_listing(self) -> None:
        result = run_node(["scripts/install-plan.js", "--list-modules", "--json"])
        self.assertEqual(result.returncode, 0, result.stderr)

        payload = json.loads(result.stdout)
        modules_by_id = {module["id"]: module for module in payload["modules"]}

        self.assertIn("workflow-engine", modules_by_id)
        self.assertIn("workflow-defaults", modules_by_id)
        self.assertEqual(modules_by_id["workflow-engine"]["kind"], "workflow")
        self.assertEqual(modules_by_id["workflow-defaults"]["kind"], "workflow")

    def test_workflow_component_is_exposed(self) -> None:
        result = run_node([
            "scripts/install-plan.js",
            "--list-components",
            "--family",
            "capability",
            "--json",
        ])
        self.assertEqual(result.returncode, 0, result.stderr)

        payload = json.loads(result.stdout)
        components_by_id = {component["id"]: component for component in payload["components"]}
        workflow_component = components_by_id.get("capability:workflow-engine")

        self.assertIsNotNone(workflow_component)
        self.assertEqual(
            workflow_component["moduleIds"],
            ["workflow-engine", "workflow-defaults"],
        )

    def test_developer_profile_plans_workflow_operations(self) -> None:
        result = run_node([
            "scripts/install-plan.js",
            "--profile",
            "developer",
            "--target",
            "claude",
            "--json",
        ])
        self.assertEqual(result.returncode, 0, result.stderr)

        payload = json.loads(result.stdout)

        self.assertIn("workflow-engine", payload["selectedModuleIds"])
        self.assertIn("workflow-defaults", payload["selectedModuleIds"])

        operation_paths = [operation["sourceRelativePath"] for operation in payload["operations"]]
        self.assertIn("scripts/lib/workflow", operation_paths)
        self.assertIn("scripts/workflow-run.js", operation_paths)
        self.assertIn("scripts/workflow-runs.js", operation_paths)
        self.assertIn("workflows/defaults", operation_paths)


if __name__ == "__main__":
    unittest.main()
