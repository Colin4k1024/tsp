'use strict';

const INITIAL_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  adapter_id TEXT NOT NULL,
  harness TEXT NOT NULL,
  state TEXT NOT NULL,
  repo_root TEXT,
  started_at TEXT,
  ended_at TEXT,
  snapshot TEXT NOT NULL CHECK (json_valid(snapshot))
);

CREATE INDEX IF NOT EXISTS idx_sessions_state_started_at
  ON sessions (state, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at
  ON sessions (started_at DESC);

CREATE TABLE IF NOT EXISTS skill_runs (
  id TEXT PRIMARY KEY,
  skill_id TEXT NOT NULL,
  skill_version TEXT NOT NULL,
  session_id TEXT NOT NULL,
  task_description TEXT NOT NULL,
  outcome TEXT NOT NULL,
  failure_reason TEXT,
  tokens_used INTEGER,
  duration_ms INTEGER,
  user_feedback TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_skill_runs_session_id_created_at
  ON skill_runs (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_runs_created_at
  ON skill_runs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_runs_outcome_created_at
  ON skill_runs (outcome, created_at DESC);

CREATE TABLE IF NOT EXISTS skill_versions (
  skill_id TEXT NOT NULL,
  version TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  amendment_reason TEXT,
  promoted_at TEXT,
  rolled_back_at TEXT,
  PRIMARY KEY (skill_id, version)
);

CREATE INDEX IF NOT EXISTS idx_skill_versions_promoted_at
  ON skill_versions (promoted_at DESC);

CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  title TEXT NOT NULL,
  rationale TEXT NOT NULL,
  alternatives TEXT NOT NULL CHECK (json_valid(alternatives)),
  supersedes TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE,
  FOREIGN KEY (supersedes) REFERENCES decisions (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_decisions_session_id_created_at
  ON decisions (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_status_created_at
  ON decisions (status, created_at DESC);

CREATE TABLE IF NOT EXISTS workflow_runs (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  workflow_name TEXT NOT NULL,
  workflow_fingerprint TEXT NOT NULL DEFAULT 'unknown',
  input_context TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(input_context)),
  source TEXT,
  file_path TEXT,
  resumed_from_run_id TEXT,
  status TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT,
  batches TEXT NOT NULL CHECK (json_valid(batches)),
  run_state TEXT NOT NULL CHECK (json_valid(run_state)),
  events TEXT NOT NULL CHECK (json_valid(events)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_created_at
  ON workflow_runs (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_session_id_created_at
  ON workflow_runs (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status_created_at
  ON workflow_runs (status, created_at DESC);

CREATE TABLE IF NOT EXISTS install_state (
  target_id TEXT NOT NULL,
  target_root TEXT NOT NULL,
  profile TEXT,
  modules TEXT NOT NULL CHECK (json_valid(modules)),
  operations TEXT NOT NULL CHECK (json_valid(operations)),
  installed_at TEXT NOT NULL,
  source_version TEXT,
  PRIMARY KEY (target_id, target_root)
);

CREATE INDEX IF NOT EXISTS idx_install_state_installed_at
  ON install_state (installed_at DESC);

CREATE TABLE IF NOT EXISTS governance_events (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  resolved_at TEXT,
  resolution TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_governance_events_resolved_at_created_at
  ON governance_events (resolved_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_governance_events_session_id_created_at
  ON governance_events (session_id, created_at DESC);
`;

function quoteSqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function assertSqlIdentifier(value, label) {
  if (typeof value !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Invalid SQL identifier for ${label}: ${value}`);
  }

  return value;
}

function listTableColumns(db, tableName) {
  const safeTableName = assertSqlIdentifier(tableName, 'tableName');
  return db
    .prepare(`PRAGMA table_info(${safeTableName})`)
    .all()
    .map(row => row.name);
}

function hasTableColumn(db, tableName, columnName) {
  assertSqlIdentifier(columnName, 'columnName');
  return listTableColumns(db, tableName).includes(columnName);
}

function ensureTableColumn(db, tableName, columnName, definition) {
  const safeTableName = assertSqlIdentifier(tableName, 'tableName');
  const safeColumnName = assertSqlIdentifier(columnName, 'columnName');
  if (hasTableColumn(db, tableName, columnName)) {
    return false;
  }

  db.exec(`ALTER TABLE ${safeTableName} ADD COLUMN ${safeColumnName} ${definition};`);
  return true;
}

function backfillNullColumn(db, tableName, columnName, value) {
  const safeTableName = assertSqlIdentifier(tableName, 'tableName');
  const safeColumnName = assertSqlIdentifier(columnName, 'columnName');
  db.exec(`
UPDATE ${safeTableName}
SET ${safeColumnName} = ${quoteSqlString(value)}
WHERE ${safeColumnName} IS NULL;
`);
}

const MIGRATIONS = [
  {
    version: 1,
    name: '001_initial_state_store',
    sql: INITIAL_SCHEMA_SQL,
  },
  {
    version: 2,
    name: '002_workflow_run_resume_fields',
    apply(db) {
      ensureTableColumn(db, 'workflow_runs', 'file_path', 'TEXT');
      ensureTableColumn(db, 'workflow_runs', 'resumed_from_run_id', 'TEXT');
    },
  },
  {
    version: 3,
    name: '003_workflow_run_fingerprint',
    apply(db) {
      ensureTableColumn(db, 'workflow_runs', 'workflow_fingerprint', 'TEXT');
      db.exec(`
UPDATE workflow_runs
SET workflow_fingerprint = COALESCE(workflow_fingerprint, workflow_name, 'unknown')
WHERE workflow_fingerprint IS NULL;
`);
    },
  },
  {
    version: 4,
    name: '004_workflow_run_input_context',
    apply(db) {
      ensureTableColumn(db, 'workflow_runs', 'input_context', 'TEXT');
      backfillNullColumn(db, 'workflow_runs', 'input_context', '{}');
    },
  },
  {
    version: 5,
    name: '005_workflow_runs_workflow_name_index',
    apply(db) {
      db.exec(`
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_name_created_at
ON workflow_runs (workflow_name, created_at DESC);
`);
    },
  },
];

function ensureMigrationTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);
}

function getAppliedMigrations(db) {
  ensureMigrationTable(db);
  return db
    .prepare(`
      SELECT version, name, applied_at
      FROM schema_migrations
      ORDER BY version ASC
    `)
    .all()
    .map(row => ({
      version: row.version,
      name: row.name,
      appliedAt: row.applied_at,
    }));
}

function applyMigrations(db) {
  ensureMigrationTable(db);

  const appliedVersions = new Set(
    db.prepare('SELECT version FROM schema_migrations').all().map(row => row.version)
  );
  const insertMigration = db.prepare(`
    INSERT INTO schema_migrations (version, name, applied_at)
    VALUES (@version, @name, @applied_at)
  `);

  const applyPending = db.transaction(() => {
    for (const migration of MIGRATIONS) {
      if (appliedVersions.has(migration.version)) {
        continue;
      }

      if (typeof migration.apply === 'function') {
        migration.apply(db);
      } else {
        db.exec(migration.sql);
      }
      insertMigration.run({
        version: migration.version,
        name: migration.name,
        applied_at: new Date().toISOString(),
      });
    }
  });

  applyPending();
  return getAppliedMigrations(db);
}

module.exports = {
  MIGRATIONS,
  applyMigrations,
  getAppliedMigrations,
  hasTableColumn,
  listTableColumns,
};
