# Operations and recovery

This document records the configuration that is not fully represented by the
source tree. Keep it current when the Vercel project, GitHub App, connector,
model, permissions, or event subscriptions change.

## Architecture

GitHub sends subscribed events to Vercel Connect, which invokes the Eve GitHub
channel at `/eve/v1/github`. The agent reads the PR and CI state through the
GitHub extension, calls the deterministic risk scorer, and submits either an
approval or a PR-level comment. It never merges.

Production identifiers:

- Vercel team: `kevin-f09c`
- Vercel project: `merge-steward-pr-review`
- Production URL: <https://merge-steward-pr-review.vercel.app>
- Connector UID: `github/pr-review-bot`
- Connector trigger path: `/eve/v1/github`
- GitHub App: `merge-steward-performer220-github`
- Agent model: `zai/glm-5.2`

## External GitHub App configuration

The GitHub App is installed for the repositories the bot reviews. Its repository
permissions are:

- Actions: read
- Checks: read
- Contents: read
- Issues: write
- Pull requests: write
- Commit statuses: read

Subscribed events:

- Pull request
- Issue comment
- Pull request review comment
- Check suite

The application code currently dispatches only newly opened PRs and successful,
completed GitHub Actions check suites associated with at least one PR. Rerunning
a PR's successful CI workflow is the cleanest manual retrigger.

## Secrets

Never commit `.env.local`, a GitHub PAT, a GitHub App private key, or a webhook
URL. `.gitignore` excludes all `.env*` files except the placeholder
`.env.example`.

Production GitHub authentication is supplied by Vercel Connect. A fine-grained
PAT is needed only for local diagnostics. `SLACK_WEBHOOK_URL` is optional; when
unset, escalation is skipped safely.

## Validate locally

Use Node.js 24.

```sh
npm ci
npm run typecheck
npm run build
```

`eve dev` may hit the macOS file-watch limit (`EMFILE`) on machines with a low
open-file limit. A successful production build is the authoritative packaging
check.

## Deploy

Authenticate to Vercel, link the checkout to the existing project, then deploy:

```sh
npx eve link --non-interactive --project merge-steward-pr-review --team kevin-f09c
npx eve deploy --non-interactive --yes --project merge-steward-pr-review
```

If Eve reports a continuation command during link or connector setup, run the
reported command rather than starting a second connector.

After deployment, confirm the production URL responds and open a harmless test
PR. Wait for CI to complete and verify that
`merge-steward-performer220[bot]` leaves a PR review.

## Rebuild from scratch

1. Clone this repository and run the local validation commands above.
2. Create or select the Vercel project `merge-steward-pr-review`.
3. Create a Vercel Connect GitHub connector with UID
   `github/pr-review-bot` and trigger path `/eve/v1/github`.
4. Create or connect the GitHub App, grant the listed permissions, subscribe to
   the listed events, and install it for the target repositories.
5. Link the checkout to Vercel and deploy.
6. Open a harmless PR or rerun CI on an existing PR to verify the full path.

## Troubleshooting

### No bot review appears

1. Allow a couple of minutes after CI completes; reviews are asynchronous.
2. Confirm the PR is not a draft and its GitHub Actions workflow completed
   successfully.
3. Check whether the bot left an error comment on the PR.
4. Check the Vercel deployment logs for `/eve/v1/github` invocations.
5. Confirm the GitHub App is installed for the repository and the connector is
   attached to the production Vercel project.
6. Rerun all jobs for the PR's CI workflow to produce a new successful check
   suite event.

Closing and reopening a PR is not a reliable retry because the handler accepts
the `opened` action, not `reopened`.

### `GatewayInternalServerError: Service temporarily unavailable`

This is an upstream model or AI Gateway availability error. The agent retries
three times automatically. Wait briefly, then rerun the PR's CI workflow. If it
persists, inspect Vercel logs and the configured model's availability before
changing application code.

### Duplicate bot messages

The bot can run once when a PR opens and again when its check suite succeeds.
Eve may also add a conversational summary after the formal GitHub review. This
is expected with the current event configuration.

### CI passed but the Checks API is unavailable locally

A fine-grained diagnostic PAT may be able to read Actions runs while GitHub
still denies the Checks API. Production uses the GitHub App, which has Checks
read permission. Use the Actions run as the local diagnostic signal and verify
the App permission in GitHub if production cannot read checks.
