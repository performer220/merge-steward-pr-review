# Merge Steward contributor notes

Merge Steward is a dependency-free Node.js 24 program run by GitHub Actions.
Keep the privileged `pull_request_target` workflow on the trusted base branch;
never check out or execute code from a pull request.

The model supplies structured findings and six evidence-backed scores. The code
in `scripts/lib/risk.mjs` owns the final risk band and approval decision. Keep
that boundary deterministic and covered by `node --test`.

Use direct GitHub and Gemini REST APIs unless a dependency provides a clear,
necessary benefit. Never commit API keys, GitHub tokens, or Slack webhooks.
