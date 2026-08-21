import { defineTool } from "eve/tools";
import { z } from "zod";
import { classifyRisk, riskDimensions } from "../lib/risk.js";

const score = z.object({
  score: z.number().int().min(0).max(3),
  evidence: z.array(z.string().min(1)).min(1),
});

const dimensions = z.object(Object.fromEntries(
  riskDimensions.map((name) => [name, score]),
) as Record<(typeof riskDimensions)[number], typeof score>);

export default defineTool({
  description:
    "Deterministically classify a PR from six evidence-backed risk scores. Call once after reading the diff, repository context, and CI status.",
  inputSchema: z.object({ dimensions }),
  execute({ dimensions }) {
    const scores = Object.fromEntries(
      riskDimensions.map((name) => [name, dimensions[name].score]),
    ) as Record<(typeof riskDimensions)[number], number>;

    return {
      ...classifyRisk(scores),
      dimensions,
      policy: "Auto-approval requires total <= 4 and every dimension <= 1.",
    };
  },
});
