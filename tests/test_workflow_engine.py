from __future__ import annotations

import json
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "tests" / "fixtures" / "workflow-engine"


def run_node(code: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["node", "-e", code],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


class WorkflowEngineTest(unittest.TestCase):
    def test_loader_accepts_valid_workflow(self) -> None:
        file_path = FIXTURES / "valid" / "basic.yaml"
        code = textwrap.dedent(
            f"""
            const {{ loadWorkflowFile }} = require('./scripts/lib/workflow/loader');
            const result = loadWorkflowFile({json.dumps(str(file_path))});
            process.stdout.write(JSON.stringify({{
              name: result.workflow.name,
              nodeCount: result.workflow.nodes.length,
              firstNode: result.workflow.nodes[0].id,
              requiredVariables: result.workflow.requiredVariables,
            }}));
            """
        )
        result = run_node(code)
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["name"], "basic-valid")
        self.assertEqual(payload["nodeCount"], 2)
        self.assertEqual(payload["firstNode"], "plan")
        self.assertEqual(payload["requiredVariables"], [])

    def test_loader_extracts_required_variables(self) -> None:
        file_path = FIXTURES / "valid" / "multi-var.yaml"
        code = textwrap.dedent(
            f"""
            const {{ loadWorkflowFile }} = require('./scripts/lib/workflow/loader');
            const result = loadWorkflowFile({json.dumps(str(file_path))});
            process.stdout.write(JSON.stringify(result.workflow.requiredVariables));
            """
        )
        result = run_node(code)
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload, ["var1", "var2", "var3"])

    def test_loader_deduplicates_required_variables(self) -> None:
        file_path = FIXTURES / "valid" / "duplicate-vars.yaml"
        code = textwrap.dedent(
            f"""
            const {{ loadWorkflowFile }} = require('./scripts/lib/workflow/loader');
            const result = loadWorkflowFile({json.dumps(str(file_path))});
            process.stdout.write(JSON.stringify(result.workflow.requiredVariables));
            """
        )
        result = run_node(code)
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload, ["taskDir"])

    def test_loader_extracts_required_variables_from_loop_fields(self) -> None:
        file_path = FIXTURES / "valid" / "loop-var.yaml"
        code = textwrap.dedent(
            f"""
            const {{ loadWorkflowFile }} = require('./scripts/lib/workflow/loader');
            const result = loadWorkflowFile({json.dumps(str(file_path))});
            process.stdout.write(JSON.stringify(result.workflow.requiredVariables));
            """
        )
        result = run_node(code)
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload, ["maxRetries", "resourceId"])

    def test_loader_preserves_bash_timeout_ms(self) -> None:
        file_path = FIXTURES / "valid" / "timeout-smoke.yaml"
        code = textwrap.dedent(
            f"""
            const {{ loadWorkflowFile }} = require('./scripts/lib/workflow/loader');
            const result = loadWorkflowFile({json.dumps(str(file_path))});
            process.stdout.write(JSON.stringify(result.workflow.nodes[0].timeout_ms));
            """
        )
        result = run_node(code)
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload, 25)

    def test_loader_rejects_missing_name(self) -> None:
        file_path = FIXTURES / "invalid" / "missing-name.yaml"
        code = textwrap.dedent(
            f"""
            const {{ loadWorkflowFile }} = require('./scripts/lib/workflow/loader');
            try {{
              loadWorkflowFile({json.dumps(str(file_path))});
            }} catch (error) {{
              process.stderr.write(error.message);
              process.exit(1);
            }}
            """
        )
        result = run_node(code)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Invalid workflow definition", result.stderr)

    def test_loader_rejects_unknown_dependency(self) -> None:
        file_path = FIXTURES / "invalid" / "unknown-dependency.yaml"
        code = textwrap.dedent(
            f"""
            const {{ loadWorkflowFile }} = require('./scripts/lib/workflow/loader');
            try {{
              loadWorkflowFile({json.dumps(str(file_path))});
            }} catch (error) {{
              process.stderr.write(error.message);
              process.exit(1);
            }}
            """
        )
        result = run_node(code)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('depends on unknown node', result.stderr)

    def test_loader_rejects_duplicate_node_ids(self) -> None:
        file_path = FIXTURES / "invalid" / "duplicate-node.yaml"
        code = textwrap.dedent(
            f"""
            const {{ loadWorkflowFile }} = require('./scripts/lib/workflow/loader');
            try {{
              loadWorkflowFile({json.dumps(str(file_path))});
            }} catch (error) {{
              process.stderr.write(error.message);
              process.exit(1);
            }}
            """
        )
        result = run_node(code)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Duplicate node id', result.stderr)

    def test_loader_rejects_node_without_execution_field(self) -> None:
        file_path = FIXTURES / "invalid" / "missing-execution-field.yaml"
        code = textwrap.dedent(
            f"""
            const {{ loadWorkflowFile }} = require('./scripts/lib/workflow/loader');
            try {{
              loadWorkflowFile({json.dumps(str(file_path))});
            }} catch (error) {{
              process.stderr.write(error.message);
              process.exit(1);
            }}
            """
        )
        result = run_node(code)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Invalid workflow definition', result.stderr)

    def test_loader_rejects_multiple_execution_fields(self) -> None:
        file_path = FIXTURES / "invalid" / "multiple-execution-fields.yaml"
        code = textwrap.dedent(
            f"""
            const {{ loadWorkflowFile }} = require('./scripts/lib/workflow/loader');
            try {{
              loadWorkflowFile({json.dumps(str(file_path))});
            }} catch (error) {{
              process.stderr.write(error.message);
              process.exit(1);
            }}
            """
        )
        result = run_node(code)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Invalid workflow definition', result.stderr)

    def test_loader_rejects_circular_dependencies(self) -> None:
        file_path = FIXTURES / "invalid" / "circular-dependency.yaml"
        code = textwrap.dedent(
            f"""
            const {{ loadWorkflowFile }} = require('./scripts/lib/workflow/loader');
            try {{
              loadWorkflowFile({json.dumps(str(file_path))});
            }} catch (error) {{
              process.stderr.write(error.message);
              process.exit(1);
            }}
            """
        )
        result = run_node(code)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Circular dependency detected', result.stderr)

    def test_discovery_prefers_project_workflow_over_bundled(self) -> None:
        bundled_root = FIXTURES / "bundled"
        cwd = FIXTURES / "project"
        code = textwrap.dedent(
            f"""
            const {{ discoverWorkflows }} = require('./scripts/lib/workflow/discovery');
            const result = discoverWorkflows({{
              cwd: {json.dumps(str(cwd))},
              bundledRoot: {json.dumps(str(bundled_root))},
            }});
            const shared = result.workflows.find(entry => entry.workflow.name === 'shared');
            process.stdout.write(JSON.stringify({{
              source: shared.source,
              description: shared.workflow.description,
              errorCount: result.errors.length,
              workflowCount: result.workflows.length,
            }}));
            """
        )
        result = run_node(code)
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["source"], "project")
        self.assertEqual(payload["description"], "Project override for bundled workflow.")
        self.assertEqual(payload["errorCount"], 1)
        self.assertEqual(payload["workflowCount"], 2)

    def test_validate_workflows_script_fails_when_errors_exist(self) -> None:
        bundled_root = FIXTURES / "bundled"
        cwd = FIXTURES / "project"
        result = subprocess.run(
            [
                "node",
                "scripts/validate-workflows.js",
                "--cwd",
                str(cwd),
                "--bundled-root",
                str(bundled_root),
                "--json",
            ],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertNotEqual(result.returncode, 0)
        payload = json.loads(result.stdout)
        self.assertFalse(payload["valid"])
        self.assertEqual(payload["workflowCount"], 2)
        self.assertEqual(len(payload["errors"]), 1)


if __name__ == "__main__":
    unittest.main()
