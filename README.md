# Merge Steward

An Eve-based PR review agent inspired by Claire Vo's “Build an AI code review
bot in 30 minutes with Vercel Eve” episode.

It reads a pull request and CI results, reviews the code, scores six risk
dimensions, approves only deterministic low-risk changes, and sends medium/high
risk changes to Slack. It never merges.

## Risk policy

Each dimension is scored 0–3: blast radius, reversibility, data security,
operational impact, verification gap, and change surface.

- Low: total 0–4, with no dimension above 1. Eligible for auto-approval.
- Medium: total 5–9, or any dimension scored 2. Human review required.
- High: total 10–18, or any dimension scored 3. Human review required.

Passing CI is necessary but not sufficient. Any actionable defect prevents
approval regardless of the numeric score.

## Run locally

Requirements: Node.js 24 and a GitHub fine-grained personal access token with
read access to repository contents, metadata, pull requests, and checks, plus
pull-request review write access.

1. Copy `.env.example` to `.env.local` and add `GITHUB_TOKEN`.
2. Optionally create a Slack incoming webhook and set `SLACK_WEBHOOK_URL`.
3. Run `npm install`.
4. Run `npm run dev` and ask the agent to review a PR URL.

The HTTP channel is included by Eve. Production uses the official Eve GitHub
channel and Vercel Connect so GitHub credentials are short-lived. The channel
reviews newly opened pull requests and retries after a successful GitHub Actions
check suite completes. Existing PRs can be retriggered by rerunning their CI
workflow.

## Production

- Vercel project: `merge-steward-pr-review` in team `kevin-f09c`
- Production URL: <https://merge-steward-pr-review.vercel.app>
- Vercel Connect connector UID: `github/pr-review-bot`
- GitHub webhook route: `/eve/v1/github`
- GitHub App: `merge-steward-performer220-github`

See [OPERATIONS.md](OPERATIONS.md) for deployment, recovery, external
configuration, and troubleshooting.

## Safety notes

Start with a sandbox repository and branch protection. Keep required checks and
the rule preventing authors from approving their own PRs. Review the risk policy
against your organization's controls before enabling automatic approvals. Eve
and Vercel Connect are currently preview/beta software.
