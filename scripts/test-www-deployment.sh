#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SYNC="$ROOT/scripts/xyvc-sync.sh"
DEPLOY="$ROOT/.github/workflows/deploy-www-origin.yml"
CHECK="$ROOT/.github/workflows/check-www-origin.yml"

test -f "$SYNC"
bash -n "$SYNC"
grep -Fq 'prepare_release_artifact' "$SYNC"
grep -Fq 'learn/crypto-vc/index.html' "$SYNC"
grep -Fq 'learn/digital-startup/index.html' "$SYNC"
grep -Fq 'XYVC_GITHUB_SHA' "$SYNC"
grep -Fq -- "--noproxy '*'" "$SYNC"
grep -Fq 'LIVE_MOVED=1' "$SYNC"
grep -Fq 'PRESERVE_RELEASE=1' "$SYNC"
grep -Fq 'sha256sum -c' "$SYNC"
if grep -Eq 'git .*fetch|bash build.sh|npm ci|nodejs.org' "$SYNC"; then
  echo "Origin must only receive prebuilt artifacts." >&2
  exit 1
fi
grep -Fq 'npm run build' "$DEPLOY"
grep -Fq "node-version: '22.23.1'" "$DEPLOY"
grep -Fq 'relay-www-artifact.py' "$DEPLOY"
grep -Fq 'apply_www_redirects' "$SYNC"
grep -Fq 'xyvc-www-redirects.conf' "$SYNC"
grep -Fq 'nginx -t' "$SYNC"
grep -Fq 'resources/ai-ready-check' "$SYNC"
grep -Fq 'resources/ai-employee-interview-guide' "$SYNC"
grep -Fq 'location = /resources/china-hackathon-calendar { return 301 /resources/china-hackathon-statistics; }' "$SYNC"
grep -Fq 'verify_redirect_nonfatal' "$SYNC"

grep -Fq 'scripts/xyvc-sync.sh' "$DEPLOY"
grep -Fq 'uses: actions/checkout@v6' "$DEPLOY"
grep -Fq 'gzip -c scripts/xyvc-sync.sh' "$DEPLOY"
grep -Fq "base64 -d | gzip -d" "$DEPLOY"
if grep -Fq 'raw.githubusercontent.com' "$DEPLOY"; then
  echo "Deployment must not fetch its bootstrap script from raw.githubusercontent.com." >&2
  exit 1
fi
grep -Fq 'https://www.xiaoyuanvc.com/learn/crypto-vc/' "$DEPLOY"
grep -Fq 'https://www.xiaoyuanvc.com/learn/digital-startup/' "$DEPLOY"
grep -Fq "grep -Fqi 'server: nginx'" "$DEPLOY"
grep -Fq 'resources/ai-ready-check' "$DEPLOY"
grep -Fq 'resources/ai-employee-interview-guide' "$DEPLOY"
grep -Fq 'resources/china-hackathon-calendar' "$DEPLOY"

grep -Fq 'https://www.xiaoyuanvc.com/learn/crypto-vc/' "$CHECK"
grep -Fq 'https://www.xiaoyuanvc.com/learn/digital-startup/' "$CHECK"
grep -Fq "grep -Fqi 'server: nginx'" "$CHECK"
grep -Fq 'ariadne.ns.cloudflare.com' "$CHECK"
grep -Fq 'dante.ns.cloudflare.com' "$CHECK"
grep -Fq 'DNS lookup returned no valid A record' "$CHECK"
if grep -Fq '@223.5.5.5' "$CHECK"; then
  echo "Origin check must query the authoritative DNS servers, not AliDNS public DNS." >&2
  exit 1
fi
