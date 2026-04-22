from __future__ import annotations

import json
import subprocess
import tempfile
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def run_node(code: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["node", "-e", code],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


class StateStoreMigrationsTest(unittest.TestCase):
    def test_list_table_columns_rejects_unsafe_identifier(self) -> None:
        code = textwrap.dedent(
            """
            (async () => {
              const { createStateStore } = require('./scripts/lib/state-store');
              const { listTableColumns } = require('./scripts/lib/state-store/migrations');
              const stateStore = await createStateStore({ dbPath: ':memory:' });
              try {
                listTableColumns(stateStore._database, 'workflow_runs; DROP TABLE workflow_runs; --');
                process.stdout.write('unexpected-success');
              } catch (error) {
                process.stderr.write(error.message);
                process.exit(1);
              } finally {
                stateStore.close();
              }
            })().catch(error => {
              process.stderr.write(error.stack || error.message);
              process.exit(1);
            });
            """
        )
        result = run_node(code)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Invalid SQL identifier for tableName", result.stderr)

    def test_create_state_store_builds_complete_workflow_run_schema_for_fresh_db(self) -> None:
        code = textwrap.dedent(
            """
            (async () => {
              const { createStateStore } = require('./scripts/lib/state-store');
              const { listTableColumns } = require('./scripts/lib/state-store/migrations');
              const stateStore = await createStateStore({ dbPath: ':memory:' });
              const columns = listTableColumns(stateStore._database, 'workflow_runs');
              const migrations = stateStore.getAppliedMigrations().map(item => item.version);
              stateStore.close();
              process.stdout.write(JSON.stringify({ columns, migrations }));
            })().catch(error => {
              process.stderr.write(error.stack || error.message);
              process.exit(1);
            });
            """
        )
        result = run_node(code)
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["migrations"], [1, 2, 3, 4, 5])
        self.assertIn("workflow_fingerprint", payload["columns"])
        self.assertIn("input_context", payload["columns"])
        self.assertIn("file_path", payload["columns"])
        self.assertIn("resumed_from_run_id", payload["columns"])

    def test_create_state_store_upgrades_legacy_workflow_run_schema(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = Path(tmpdir) / 'legacy-state.db'
            code = textwrap.dedent(
                f"""
                (async () => {{
                  const fs = require('fs');
                  const initSqlJs = require('sql.js');
                  const {{ createStateStore }} = require('./scripts/lib/state-store');
                  const {{ listTableColumns }} = require('./scripts/lib/state-store/migrations');
                  const SQL = await initSqlJs();
                  const db = new SQL.Database();
                  db.run(`
CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);
CREATE TABLE workflow_runs (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  workflow_name TEXT NOT NULL,
  source TEXT,
  status TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT,
  batches TEXT NOT NULL CHECK (json_valid(batches)),
  run_state TEXT NOT NULL CHECK (json_valid(run_state)),
  events TEXT NOT NULL CHECK (json_valid(events)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
INSERT INTO schema_migrations (version, name, applied_at)
VALUES (1, '001_initial_state_store', '2026-04-11T00:00:00.000Z');
INSERT INTO workflow_runs (
  id, session_id, workflow_name, source, status, started_at, finished_at, batches, run_state, events, created_at, updated_at
) VALUES (
  'legacy-run-1', NULL, 'legacy-workflow', 'bundled', 'failed', '2026-04-11T00:00:00.000Z', '2026-04-11T00:01:00.000Z', '[]', '{{}}', '[]', '2026-04-11T00:00:00.000Z', '2026-04-11T00:01:00.000Z'
);
                  `);
                  fs.writeFileSync({json.dumps(str(db_path))}, Buffer.from(db.export()));
                  db.close();

                  const stateStore = await createStateStore({{ dbPath: {json.dumps(str(db_path))} }});
                  const columns = listTableColumns(stateStore._database, 'workflow_runs');
                  const run = stateStore.getWorkflowRunById('legacy-run-1');
                  const migrations = stateStore.getAppliedMigrations().map(item => item.version);
                  stateStore.close();
                  process.stdout.write(JSON.stringify({{
                    columns,
                    migrations,
                    workflowFingerprint: run.workflowFingerprint,
                    inputContext: run.inputContext,
                    filePath: run.filePath,
                    resumedFromRunId: run.resumedFromRunId,
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
            self.assertEqual(payload["migrations"], [1, 2, 3, 4, 5])
            self.assertIn("workflow_fingerprint", payload["columns"])
            self.assertIn("input_context", payload["columns"])
            self.assertIn("file_path", payload["columns"])
            self.assertIn("resumed_from_run_id", payload["columns"])
            self.assertEqual(payload["workflowFingerprint"], "legacy-workflow")
            self.assertEqual(payload["inputContext"], {})
            self.assertIsNone(payload["filePath"])
            self.assertIsNone(payload["resumedFromRunId"])


if __name__ == "__main__":
    unittest.main()
