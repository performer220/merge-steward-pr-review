import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Post a medium/high-risk PR escalation to the configured Slack incoming webhook. Use only after a completed risk assessment.",
  inputSchema: z.object({
    pullRequestUrl: z.string().url(),
    title: z.string().min(1),
    riskBand: z.enum(["medium", "high"]),
    totalScore: z.number().int().min(0).max(18),
    summary: z.string().min(1),
  }),
  async execute(input) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      return { posted: false, reason: "SLACK_WEBHOOK_URL is not configured." };
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: `PR needs human review: <${input.pullRequestUrl}|${input.title}>\nRisk: ${input.riskBand} (${input.totalScore}/18)\n${input.summary}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed with HTTP ${response.status}.`);
    }

    return { posted: true };
  },
});
