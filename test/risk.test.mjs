import assert from "node:assert/strict";
import test from "node:test";
import { classifyRisk } from "../scripts/lib/risk.mjs";

const scores = (overrides = {}) => ({
  blastRadius: 0,
  reversibility: 0,
  dataSecurity: 0,
  operationalImpact: 0,
  verificationGap: 0,
  changeSurface: 0,
  ...overrides,
});

test("auto-approves only low-risk totals", () => {
  assert.deepEqual(classifyRisk(scores({ blastRadius: 1, changeSurface: 1 })), {
    total: 2,
    maximum: 18,
    band: "low",
    autoApprove: true,
  });
});

test("a score of two forces medium risk", () => {
  const result = classifyRisk(scores({ verificationGap: 2 }));
  assert.equal(result.band, "medium");
  assert.equal(result.autoApprove, false);
});

test("a score of three forces high risk", () => {
  assert.equal(classifyRisk(scores({ dataSecurity: 3 })).band, "high");
});

test("rejects invalid model scores", () => {
  assert.throws(() => classifyRisk(scores({ changeSurface: 4 })), /changeSurface/);
});
