#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
git_dir="$(git rev-parse --path-format=absolute --git-common-dir)"

# A linked worktree's .git file points outside the checkout. Mount both paths
# so gitleaks can scan its full history locally and in standalone CI checkouts.
docker run --rm \
  -v "$repo_root:$repo_root:ro" \
  -v "$git_dir:$git_dir:ro" \
  ghcr.io/gitleaks/gitleaks:v8.30.1 git "$repo_root" --no-banner --redact
