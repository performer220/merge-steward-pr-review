# Operations and recovery

## Architecture

GitHub Actions runs Merge Steward on `pull_request_target`, using only code from
the trusted base branch. The script reads PR metadata, the diff, and check runs
through GitHub's REST API. It sends the review context directly to the Gemini
Developer API, validates the structured response, applies the deterministic
risk policy, and submits an APPROVE or COMMENT review with the temporary
`GITHUB_TOKEN`.

There is no Vercel deployment, webhook service, long-lived GitHub credential,
database, or package dependency.

The root `action.yml` makes the reviewer reusable across repositories. Publish a
version tag, add the small caller workflow from the README to each target
repository, and store `GEMINI_API_KEY` in each repository or organization.

## Cost

The default model is the stable `gemini-3.6-flash`. Google currently offers
a free Gemini Developer API tier and token-based paid usage. Check Google's live
pricing before enabling paid billing. GitHub-hosted Actions runners are free for
public repositories; private repositories use the minutes included with the
GitHub account and then usage-based billing.

Through December 31, 2026, Gemini 3.6 Flash has introductory pricing of $0.75
per million input tokens and $3.75 per million output tokens. A review with
45,000 input tokens and 2,000 output tokens is about $0.041. The published
standard price beginning January 1, 2027 is $1.50 input and $7.50 output per
million tokens. `gemini-3.5-flash-lite` is cheaper but less capable for subtle
code review.

ChatGPT Plus and Claude paid plans do not include API calls for external
applications. They cannot fund this workflow directly.

For private source code, use Gemini's paid tier. Google states that free-tier
content may be used to improve its products and paid-tier content is not.

## GitHub configuration

The workflow needs these repository permissions:

- Contents: read
- Checks: read
- Pull requests: write

Add `GEMINI_API_KEY` under **Settings → Secrets and variables → Actions**.
`SLACK_WEBHOOK_URL` is optional. In **Settings → Actions → General**, ensure the
repository allows GitHub Actions to create and approve pull requests. Branch
protection should require the Merge Steward job if it is intended to be a gate.

The workflow waits up to 600 seconds for other check runs. Change
`WAIT_FOR_CHECKS_SECONDS` in the workflow if normal CI is slower. A timed-out
review leaves a comment and can be retried from **Actions → Merge Steward → Run
workflow** with the PR number.

## Security properties

`pull_request_target` has a write token and access to secrets, so the workflow
must never check out, import, source, or execute files from the PR head. The
checked-in workflow uses the base branch and sends the PR diff only as untrusted
model input. Keep action dependencies pinned to trusted publishers.

Automatic approval is disabled when:

- a concrete blocking finding exists;
- any risk dimension is 2 or 3;
- the total risk score exceeds 4;
- the diff is incomplete or exceeds `MAX_DIFF_CHARS`; or
- the PR originates from a fork.

The script does not merge pull requests.

## Validate

Node.js 24 is required. No install step is needed.

```sh
npm test
```

For an end-to-end test, add the API key, open a harmless PR, and inspect the
Merge Steward job and resulting review. Test medium-risk behavior with a PR that
changes authentication, migrations, or deployment configuration.

## Troubleshooting

### Gemini rejects the request

Confirm `GEMINI_API_KEY` exists in Actions secrets and the API project has access
to `gemini-3.6-flash`. Free-tier rate limits can temporarily reject bursts;
retry the workflow or enable usage-based billing with a budget.

### Review cannot be submitted

Confirm the workflow has `pull-requests: write` and the repository setting that
allows Actions to approve pull requests. Organization policy can override the
repository setting.

### Review waits for itself

The job excludes the check named by `SELF_CHECK_NAME`, which defaults to
`review`. Update that variable if the job name changes.

### Remove the old deployment

After this workflow succeeds on a test PR, disable the old GitHub App webhook
and delete the Vercel project or leave it undeployed. Remove the old Vercel
Connect GitHub App installation if no other project uses it.
