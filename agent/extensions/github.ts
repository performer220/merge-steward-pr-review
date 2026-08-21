import githubTools from "@github-tools/eve-extension";

export default githubTools({
  connector: "github/pr-review-bot",
  preset: "code-review",
  // The agent may submit a formal review without pausing only after the
  // deterministic risk gate in instructions.md returns autoApprove: true.
  requireApproval: {
    createPullRequestReview: false,
  },
});
