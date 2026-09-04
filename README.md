# Merge Steward

A dependency-free GitHub Action that reviews pull requests with the Gemini
Developer API. It reads the PR diff and CI results, scores six risk dimensions,
approves only deterministic low-risk changes, and optionally sends medium/high
risk changes to Slack. It never merges or executes pull-request code.

## Risk policy

Each dimension is scored 0–3: blast radius, reversibility, data security,
operational impact, verification gap, and change surface.

- Low: total 0–4, with no dimension above 1. Eligible for auto-approval.
- Medium: total 5–9, or any dimension scored 2. Human review required.
- High: total 10–18, or any dimension scored 3. Human review required.

Passing CI is necessary but not sufficient. Any actionable defect prevents
approval regardless of the numeric score.

## Setup

1. Create a Gemini API key in Google AI Studio. The free tier works for small
   public projects. Use paid API billing for private code because Google may use
   free-tier content to improve its products.
2. Add the key to the repository as an Actions secret named `GEMINI_API_KEY`.
3. Enable GitHub Actions and allow workflows to create pull-request reviews.
4. Push `.github/workflows/merge-steward.yml` to the default branch.
5. Optionally add `SLACK_WEBHOOK_URL` as an Actions secret.

The workflow runs from the trusted base branch with `pull_request_target`. It
never checks out or executes the proposed change. It waits up to ten minutes for
other check runs, then reviews the diff. Use **Run workflow** to retry a PR by
number if its CI takes longer.

The default model is `gemini-3.6-flash`, which Google makes available to new API
accounts. Its introductory paid-tier price through December 31, 2026 is $0.75
per million input tokens and $3.75 per million output tokens. Set
`GEMINI_MODEL` to `gemini-3.5-flash-lite` for lower-cost reviews.

To use Merge Steward in another repository, publish a `v1` tag from this repo
and add this workflow to the target repository:

```yaml
name: Merge Steward
on:
  pull_request_target:
    types: [opened, synchronize, reopened, ready_for_review]
permissions:
  contents: read
  checks: read
  pull-requests: write
jobs:
  review:
    if: github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/setup-node@v5
        with:
          node-version: 24
      - uses: performer220/merge-steward-pr-review@v1
        with:
          pr_number: ${{ github.event.pull_request.number }}
        env:
          GITHUB_TOKEN: ${{ github.token }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

Pin the action to a full commit SHA when using it in a sensitive repository.

For local use, export the variables shown in `.env.example`, then run
`node scripts/review-pr.mjs`. No package installation is required.

To verify the API key before reviewing a PR, open **Actions → Test Gemini API →
Run workflow**. A successful run prints `Gemini API connection succeeded`
without exposing the key.

See [OPERATIONS.md](OPERATIONS.md) for cost, security, and recovery details.

## Safety notes

Start with a sandbox repository and branch protection. Keep required checks and
the rule preventing authors from approving their own PRs. Automatic approval is
disabled for forked PRs and whenever the diff is truncated.
