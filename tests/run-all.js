#!/usr/bin/env node
/**
 * Test runner: executes both JS tests and Python unittest suite.
 * JS tests exit with code 0 on success, 1 on failure.
 * Python tests use the same exit code convention.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const JS_TEST_PATTERN = /^test_.*\.js$/;
const INSTALL_SMOKE_TESTS = new Set(["test_platform_smoke.js"]);
const TEST_DIR = __dirname;
const includeInstallSmoke = process.env.RUN_INSTALL_SMOKE_TESTS === "1";

const jsTestFiles = fs
  .readdirSync(TEST_DIR)
  .filter((f) => JS_TEST_PATTERN.test(f))
  .filter((f) => includeInstallSmoke || !INSTALL_SMOKE_TESTS.has(f))
  .sort();

// Run JS tests
let allPassed = true;
for (const jsTest of jsTestFiles) {
  const result = spawnSync("node", [path.join(TEST_DIR, jsTest)], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    allPassed = false;
  }
}

// Run Python unittest suite
const pyResult = spawnSync(
  "python3",
  ["-m", "unittest", "discover", "tests", "-v"],
  { stdio: "inherit" }
);

const pyExitCode = typeof pyResult.status === "number" ? pyResult.status : 1;
if (pyExitCode !== 0) {
  allPassed = false;
}

process.exit(allPassed ? 0 : 1);
