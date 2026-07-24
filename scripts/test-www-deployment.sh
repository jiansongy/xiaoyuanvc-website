#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SYNC="$ROOT/scripts/xyvc-sync.sh"
DEPLOY="$ROOT/.github/workflows/deploy-www-origin.yml"
CHECK="$ROOT/.github/workflows/check-www-origin.yml"

test -f "$SYNC"
bash -n "$SYNC"
grep -Fq 'bash build.sh' "$SYNC"
grep -Fq 'dist/learn/crypto-vc/index.html' "$SYNC"
grep -Fq 'dist/learn/digital-startup/index.html' "$SYNC"
grep -Fq 'docker ps' "$SYNC"
grep -Fq 'npm list -g' "$SYNC"
grep -Fq 'systemctl list-units' "$SYNC"
grep -Fq 'XYVC_GITHUB_SHA' "$SYNC"
grep -Fq -- "--noproxy '*'" "$SYNC"
grep -Fq 'LIVE_MOVED=1' "$SYNC"
grep -Fq 'PRESERVE_RELEASE=1' "$SYNC"

grep -Fq 'scripts/xyvc-sync.sh' "$DEPLOY"
grep -Fq 'https://www.xiaoyuanvc.com/learn/crypto-vc/' "$DEPLOY"
grep -Fq 'https://www.xiaoyuanvc.com/learn/digital-startup/' "$DEPLOY"
grep -Fq "grep -Fqi 'server: nginx'" "$DEPLOY"

grep -Fq 'https://www.xiaoyuanvc.com/learn/crypto-vc/' "$CHECK"
grep -Fq 'https://www.xiaoyuanvc.com/learn/digital-startup/' "$CHECK"
grep -Fq "grep -Fqi 'server: nginx'" "$CHECK"
