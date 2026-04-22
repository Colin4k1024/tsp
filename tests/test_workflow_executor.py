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


class WorkflowExecutorTest(unittest.TestCase):
    def test_create_execution_batches_orders_dependencies(self) -> None:
        file_path = FIXTURES / "valid" / "branching.yaml"
        code = textwrap.dedent(
            f"""
            const {{ loadWorkflowFile }} = require('./scripts/lib/workflow/loader');
            const {{ createExecutionBatches }} = require('./scripts/lib/workflow/executor');
            const result = loadWorkflowFile({json.dumps(str(file_path))});
            process.stdout.write(JSON.stringify(createExecutionBatches(result.workflow)));
            """
        )
        result = run_node(code)
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload, [["plan"], ["backend", "frontend"], ["review"]])

    def test_execute_workflow_runs_success_path(self) -> None:
        file_path = FIXTURES / "valid" / "branching.yaml"
        code = textwrap.dedent(
            f"""
            (async () => {{
              const {{ loadWorkflowFile }} = require('./scripts/lib/workflow/loader');
              const {{ executeWorkflow }} = require('./scripts/lib/workflow/executor');
              const result = loadWorkflowFile({json.dumps(str(file_path))});
              const execution = await executeWorkflow(result.workflow, {{
                handlers: {{
                  prompt: async (input) => `prompt:${{input.node.id}}`,
                  bash: async (input) => `bash:${{input.node.id}}`,
                  command: async (input) => `command:${{input.node.id}}`,
                  loop: async (input) => `loop:${{input.node.id}}`,
                }},
              }});
              process.stdout.write(JSON.stringify({{
                status: execution.runState.status,
                nodeStatuses: Object.fromEntries(Object.entries(execution.runState.nodes).map(([id, value]) => [id, value.status])),
                completedEvents: execution.events.filter(event => event.type === 'workflow.node.completed').length,
              }}));
            }})().catch(error => {{
              process.stderr.write(error.stack || error.message);
              process.exit(1);
            }});
            """
        )
        result = run_node(code)
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["status"], "succeeded")
        self.assertEqual(payload["nodeStatuses"]["plan"], "succeeded")
        self.assertEqual(payload["nodeStatuses"]["backend"], "succeeded")
        self.assertEqual(payload["nodeStatuses"]["frontend"], "succeeded")
        self.assertEqual(payload["nodeStatuses"]["review"], "succeeded")
        self.assertEqual(payload["completedEvents"], 4)

    def test_execute_workflow_aborts_and_skips_downstream_on_failure(self) -> None:
        file_path = FIXTURES / "valid" / "branching.yaml"
        code = textwrap.dedent(
            f"""
            (async () => {{
              const {{ loadWorkflowFile }} = require('./scripts/lib/workflow/loader');
              const {{ executeWorkflow }} = require('./scripts/lib/workflow/executor');
              const result = loadWorkflowFile({json.dumps(str(file_path))});
              const execution = await executeWorkflow(result.workflow, {{
                handlers: {{
                  prompt: async (input) => `prompt:${{input.node.id}}`,
                  bash: async (input) => {{
                    throw new Error('bash failed');
                  }},
                  command: async (input) => `command:${{input.node.id}}`,
                  loop: async (input) => `loop:${{input.node.id}}`,
                }},
              }});
              process.stdout.write(JSON.stringify({{
                status: execution.runState.status,
                nodeStatuses: Object.fromEntries(Object.entries(execution.runState.nodes).map(([id, value]) => [id, value.status])),
                failedEvents: execution.events.filter(event => event.type === 'workflow.node.failed').length,
              }}));
            }})().catch(error => {{
              process.stderr.write(error.stack || error.message);
              process.exit(1);
            }});
            """
        )
        result = run_node(code)
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["status"], "failed")
        self.assertEqual(payload["nodeStatuses"]["plan"], "succeeded")
        self.assertEqual(payload["nodeStatuses"]["backend"], "failed")
        self.assertEqual(payload["nodeStatuses"]["frontend"], "succeeded")
        self.assertEqual(payload["nodeStatuses"]["review"], "skipped")
        self.assertEqual(payload["failedEvents"], 1)

    def test_execute_workflow_continues_across_batches_when_enabled(self) -> None:
        file_path = FIXTURES / "valid" / "continue-on-error.yaml"
        code = textwrap.dedent(
            f"""
            (async () => {{
              const {{ loadWorkflowFile }} = require('./scripts/lib/workflow/loader');
              const {{ executeWorkflow }} = require('./scripts/lib/workflow/executor');
              const result = loadWorkflowFile({json.dumps(str(file_path))});
              const execution = await executeWorkflow(result.workflow, {{
                continueOnError: true,
                handlers: {{
                  prompt: async (input) => `prompt:${{input.node.id}}`,
                  bash: async () => {{
                    throw new Error('bash failed');
                  }},
                  command: async (input) => `command:${{input.node.id}}`,
                  loop: async (input) => `loop:${{input.node.id}}`,
                }},
              }});
              process.stdout.write(JSON.stringify({{
                status: execution.runState.status,
                nodeStatuses: Object.fromEntries(Object.entries(execution.runState.nodes).map(([id, value]) => [id, value.status])),
                completedEvents: execution.events.filter(event => event.type === 'workflow.node.completed').length,
              }}));
            }})().catch(error => {{
              process.stderr.write(error.stack || error.message);
              process.exit(1);
            }});
            """
        )
        result = run_node(code)
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["status"], "failed")
        self.assertEqual(payload["nodeStatuses"]["plan"], "succeeded")
        self.assertEqual(payload["nodeStatuses"]["backend"], "failed")
        self.assertEqual(payload["nodeStatuses"]["frontend"], "succeeded")
        self.assertEqual(payload["nodeStatuses"]["notify"], "succeeded")
        self.assertEqual(payload["nodeStatuses"]["review"], "skipped")
        self.assertEqual(payload["completedEvents"], 3)

    def test_execute_workflow_fails_fast_when_persistence_write_fails(self) -> None:
        file_path = FIXTURES / "valid" / "branching.yaml"
        code = textwrap.dedent(
            f"""
            (async () => {{
              const {{ loadWorkflowFile }} = require('./scripts/lib/workflow/loader');
              const {{ executeWorkflow }} = require('./scripts/lib/workflow/executor');
              const result = loadWorkflowFile({json.dumps(str(file_path))});
              await executeWorkflow(result.workflow, {{
                stateStore: {{
                  upsertWorkflowRun() {{
                    throw new Error('disk full');
                  }},
                }},
                handlers: {{
                  prompt: async (input) => `prompt:${{input.node.id}}`,
                  bash: async (input) => `bash:${{input.node.id}}`,
                  command: async (input) => `command:${{input.node.id}}`,
                  loop: async (input) => `loop:${{input.node.id}}`,
                }},
              }});
            }})().catch(error => {{
              process.stderr.write(error.message);
              process.exit(1);
            }});
            """
        )
        result = run_node(code)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Failed to persist workflow run", result.stderr)

    def test_execute_workflow_fails_bash_node_on_timeout(self) -> None:
        file_path = FIXTURES / "valid" / "timeout-smoke.yaml"
        code = textwrap.dedent(
            f"""
            (async () => {{
              const {{ loadWorkflowFile }} = require('./scripts/lib/workflow/loader');
              const {{ executeWorkflow }} = require('./scripts/lib/workflow/executor');
              const workflowRun = require('./scripts/workflow-run');
              const result = loadWorkflowFile({json.dumps(str(file_path))});
              const execution = await executeWorkflow(result.workflow, {{
                handlers: workflowRun.createDefaultHandlers(process.cwd()),
              }});
              process.stdout.write(JSON.stringify({{
                status: execution.runState.status,
                nodeStatus: execution.runState.nodes['slow-bash'].status,
                error: execution.runState.nodes['slow-bash'].error,
              }}));
            }})().catch(error => {{
              process.stderr.write(error.stack || error.message);
              process.exit(1);
            }});
            """
        )
        result = run_node(code)
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["status"], "failed")
        self.assertEqual(payload["nodeStatus"], "failed")
        self.assertIn("timed out after 25ms", payload["error"])


if __name__ == "__main__":
    unittest.main()
