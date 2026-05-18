#!/usr/bin/env bash
# Publish the site to the main branch with the repository's Lore commit format.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE="${PUBLISH_REMOTE:-origin}"
BRANCH="${PUBLISH_BRANCH:-main}"
INCLUDE_UNTRACKED=0

usage() {
  cat <<'EOF'
Usage:
  scripts/publish-main.sh [--include-untracked] "<intent subject>" ["body"]

Environment overrides:
  PUBLISH_REMOTE      Git remote to push to. Default: origin
  PUBLISH_BRANCH      Branch to publish. Default: main
  PUBLISH_CONSTRAINT  Lore Constraint trailer.
  PUBLISH_REJECTED    Lore Rejected trailer.
  PUBLISH_CONFIDENCE  Lore Confidence trailer. Default: high
  PUBLISH_SCOPE_RISK  Lore Scope-risk trailer. Default: narrow
  PUBLISH_DIRECTIVE   Lore Directive trailer.
  PUBLISH_TESTED      Lore Tested trailer.
  PUBLISH_NOT_TESTED  Lore Not-tested trailer.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ "${1:-}" == "--include-untracked" ]]; then
  INCLUDE_UNTRACKED=1
  shift
fi

SUBJECT="${1:-}"
BODY="${2:-}"

if [[ -z "$SUBJECT" ]]; then
  usage >&2
  exit 2
fi

cd "$ROOT"

CURRENT_BRANCH="$(git branch --show-current)"
if [[ "$CURRENT_BRANCH" != "$BRANCH" ]]; then
  echo "Refusing to publish from branch '$CURRENT_BRANCH'; expected '$BRANCH'." >&2
  exit 1
fi

UNTRACKED="$(git ls-files --others --exclude-standard)"
if [[ -n "$UNTRACKED" && "$INCLUDE_UNTRACKED" != "1" ]]; then
  echo "Refusing to publish with untracked files. Review them or rerun with --include-untracked:" >&2
  echo "$UNTRACKED" >&2
  exit 1
fi

echo "==> Running production build"
bash build.sh

UNTRACKED_AFTER_BUILD="$(git ls-files --others --exclude-standard)"
if [[ -n "$UNTRACKED_AFTER_BUILD" && "$INCLUDE_UNTRACKED" != "1" ]]; then
  echo "Build left untracked files. Review them or rerun with --include-untracked:" >&2
  echo "$UNTRACKED_AFTER_BUILD" >&2
  exit 1
fi

if [[ "$INCLUDE_UNTRACKED" == "1" ]]; then
  git add -A
else
  git add -u
fi

if git diff --cached --quiet; then
  echo "No staged changes to publish."
  exit 0
fi

CONSTRAINT="${PUBLISH_CONSTRAINT:-Cloudflare Pages deploys from the pushed main branch via build.sh and dist output.}"
REJECTED="${PUBLISH_REJECTED:-Manual git commit and push flow | repeats Lore trailer and generated-file checks by hand.}"
CONFIDENCE="${PUBLISH_CONFIDENCE:-high}"
SCOPE_RISK="${PUBLISH_SCOPE_RISK:-narrow}"
DIRECTIVE="${PUBLISH_DIRECTIVE:-Use scripts/publish-main.sh for future main-branch publishes.}"
TESTED="${PUBLISH_TESTED:-bash build.sh completed successfully before commit.}"
NOT_TESTED="${PUBLISH_NOT_TESTED:-Cloudflare Pages deployment completion after push.}"

if [[ -z "$BODY" ]]; then
  BODY="Use the repository publish script so build verification, generated-file handling, Lore commit trailers, and remote confirmation happen in one repeatable path."
fi

git commit \
  -m "$SUBJECT" \
  -m "$BODY" \
  -m "Constraint: $CONSTRAINT" \
  -m "Rejected: $REJECTED" \
  -m "Confidence: $CONFIDENCE" \
  -m "Scope-risk: $SCOPE_RISK" \
  -m "Directive: $DIRECTIVE" \
  -m "Tested: $TESTED" \
  -m "Not-tested: $NOT_TESTED" \
  -m "Co-authored-by: OmX <omx@oh-my-codex.dev>"

echo "==> Pushing $BRANCH to $REMOTE"
git push "$REMOTE" "$BRANCH"

LOCAL_HEAD="$(git rev-parse HEAD)"
REMOTE_HEAD="$(git ls-remote "$REMOTE" "refs/heads/$BRANCH" | awk '{print $1}')"

if [[ "$LOCAL_HEAD" != "$REMOTE_HEAD" ]]; then
  echo "Push verification failed: local HEAD $LOCAL_HEAD != remote HEAD $REMOTE_HEAD" >&2
  exit 1
fi

echo "Published $REMOTE/$BRANCH at $LOCAL_HEAD"
