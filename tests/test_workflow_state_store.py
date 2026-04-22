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


class WorkflowStateStoreTest(unittest.TestCase):
    def test_executor_persists_workflow_run_snapshot(self) -> None:
        file_path = FIXTURES / "valid" / "branching.yaml"
        code = textwrap.dedent(
            f"""
            (async () => {{
              const {{ createStateStore }} = require('./scripts/lib/state-store');
              const {{ loadWorkflowFile }} = require('./scripts/lib/workflow/loader');
              const {{ executeWorkflow }} = require('./scripts/lib/workflow/executor');
              const stateStore = await createStateStore({{ dbPath: ':memory:' }});
              const result = loadWorkflowFile({json.dumps(str(file_path))});
              const execution = await executeWorkflow(result.workflow, {{
                runId: 'run-1',
                inputContext: {{ taskDir: 'docs/artifacts/demo-task', targetPhase: 'execute' }},
                source: 'bundled',
                stateStore,
                handlers: {{
                  prompt: async (input) => `prompt:${{input.node.id}}`,
                  bash: async (input) => `bash:${{input.node.id}}`,
                  command: async (input) => `command:${{input.node.id}}`,
                  loop: async (input) => `loop:${{input.node.id}}`,
                }},
              }});
              const persisted = stateStore.getWorkflowRunById('run-1');
              const recent = stateStore.listRecentWorkflowRuns({{ limit: 5 }});
              stateStore.close();
              process.stdout.write(JSON.stringify({{
                runId: execution.runId,
                persistedStatus: persisted.status,
                persistedWorkflowName: persisted.workflowName,
                persistedWorkflowFingerprint: persisted.workflowFingerprint,
                persistedInputContext: persisted.inputContext,
                persistedSource: persisted.source,
                persistedFilePath: persisted.filePath,
                resumedFromRunId: persisted.resumedFromRunId,
                persistedNodeStatuses: Object.fromEntries(Object.entries(persisted.runState.nodes).map(([id, value]) => [id, value.status])),
                recentCount: recent.length,
                eventCount: persisted.events.length,
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
        self.assertEqual(payload["runId"], "run-1")
        self.assertEqual(payload["persistedStatus"], "succeeded")
        self.assertEqual(payload["persistedWorkflowName"], "branching")
        self.assertTrue(payload["persistedWorkflowFingerprint"])
        self.assertEqual(payload["persistedInputContext"]["taskDir"], "docs/artifacts/demo-task")
        self.assertEqual(payload["persistedInputContext"]["targetPhase"], "execute")
        self.assertEqual(payload["persistedSource"], "bundled")
        self.assertIsNone(payload["persistedFilePath"])
        self.assertIsNone(payload["resumedFromRunId"])
        self.assertEqual(payload["persistedNodeStatuses"]["review"], "succeeded")
        self.assertEqual(payload["recentCount"], 1)
        self.assertGreater(payload["eventCount"], 0)


if __name__ == "__main__":
    unittest.main()
