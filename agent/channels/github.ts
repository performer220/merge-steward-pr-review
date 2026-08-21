import { connectGitHubCredentials } from "@vercel/connect/eve";
import { defaultGitHubAuth, githubChannel } from "eve/channels/github";

export default githubChannel({
  botName: "merge-steward-performer220",
  credentials: connectGitHubCredentials("github/pr-review-bot"),

  // Review newly opened PRs, but the agent will wait when required CI is pending.
  onPullRequest: (ctx, pullRequest) =>
    pullRequest.action === "opened"
      ? {
          auth: defaultGitHubAuth(ctx),
          context: ["Review this newly opened pull request after confirming required CI status."],
        }
      : null,

  // Retry at the right moment: only after a successful GitHub Actions check suite.
  onCheckSuite: (ctx, suite) =>
    suite.action === "completed" &&
    suite.conclusion === "success" &&
    suite.app.slug === "github-actions" &&
    suite.pullRequests.length > 0
      ? {
          auth: defaultGitHubAuth(ctx),
          context: [
            `Required checks completed successfully for ${suite.headSha}. Review and risk-score the pull request now.`,
          ],
        }
      : null,
});
