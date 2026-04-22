#!/usr/bin/env node
const path = require("path");
const {
  checkExpectedFiles,
  expectedGeneratedFiles,
  repoRoot,
  resetGeneratedAgents,
  resetGeneratedCommands,
  resetGeneratedRoleDirs,
  writeExpectedFiles,
} = require("./lib/team-skills-platform");
const { emitPre, emitPost } = require("./lib/audit-logger");

function main() {
  const root = repoRoot();
  const checkOnly = process.argv.includes("--check");
  const callId = emitPre({
    component: "script",
    action: "build_platform_artifacts",
    source: "build-platform-artifacts",
    projectPath: root,
    payload: { check_only: checkOnly },
  });
  const expected = expectedGeneratedFiles(root);

  if (checkOnly) {
    const mismatches = checkExpectedFiles(expected);
    if (mismatches.length) {
      emitPost({
        component: "script",
        action: "build_platform_artifacts",
        status: "error",
        source: "build-platform-artifacts",
        projectPath: root,
        callId,
        payload: { check_only: true, mismatch_count: mismatches.length },
      });
      console.log("Generated artifacts are out of date:");
      for (const mismatch of mismatches) {
        console.log(`- ${path.relative(root, mismatch)}`);
      }
      process.exitCode = 1;
      return;
    }
    emitPost({
      component: "script",
      action: "build_platform_artifacts",
      status: "success",
      source: "build-platform-artifacts",
      projectPath: root,
      callId,
      payload: { check_only: true, artifact_count: expected.size },
    });
    console.log(`All generated artifacts are up to date (${expected.size} files).`);
    return;
  }

  resetGeneratedRoleDirs(root);
  resetGeneratedAgents(root);
  resetGeneratedCommands(root);
  const written = writeExpectedFiles(expected);
  emitPost({
    component: "script",
    action: "build_platform_artifacts",
    status: "success",
    source: "build-platform-artifacts",
    projectPath: root,
    callId,
    payload: { check_only: false, artifact_count: expected.size, updated_count: written.length },
  });
  console.log(`Generated ${expected.size} artifacts, updated ${written.length} files.`);
  for (const filePath of written) {
    console.log(`- ${path.relative(root, filePath)}`);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
