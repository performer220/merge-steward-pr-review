import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

function review(scenario) {
  return spawnSync(process.execPath, ["--import", "./test/fixtures/mock-review.mjs", "scripts/review-pr.mjs"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
    env: {
      ...process.env,
      REVIEW_SCENARIO: scenario,
      GITHUB_TOKEN: "fixture",
      GEMINI_API_KEY: "fixture",
      GITHUB_REPOSITORY: "example/repo",
      PR_NUMBER: "7",
      AUTO_MERGE: "true",
      AUTO_MERGE_TOKEN: scenario === "alternate-token" ? "merge-fixture" : "",
      WAIT_FOR_CHECKS_SECONDS: "1",
    },
  });
}

test("approved PR requests auto-merge", () => {
  const result = review("approved");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /MOCK_REVIEW=APPROVE/);
  assert.match(result.stdout, /MOCK_AUTO_MERGE=enabled/);
});

test("auto-merge can use a separate GitHub App token", () => {
  const result = review("alternate-token");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /MOCK_MERGE_TOKEN=separate/);
});

test("human review keeps merge gate closed", () => {
  const result = review("human");
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /MOCK_REVIEW=COMMENT/);
  assert.doesNotMatch(result.stdout, /MOCK_AUTO_MERGE/);
});

test("unavailable approving review never requests merge", () => {
  const result = review("approval-denied");
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /MOCK_REVIEW=COMMENT/);
  assert.doesNotMatch(result.stdout, /MOCK_AUTO_MERGE/);
});
