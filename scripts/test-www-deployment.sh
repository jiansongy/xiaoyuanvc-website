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
grep -Fq 'v22.23.1' "$SYNC"
grep -Fq 'node-${NODE_VERSION}-linux-${node_arch}.tar.gz' "$SYNC"
grep -Fq '7a8cb04b4a1df4eaf432125324b81b29a088e73570a23259a8de1c65d07fc129' "$SYNC"
grep -Fq '543fa39e57d4c07855939459a323f4deb9a79dd1bb45e6e99458b0f2de10db8d' "$SYNC"
grep -Fq 'sha256sum -c' "$SYNC"
if grep -Fq 'XYVC_NODE_VERSION' "$SYNC"; then
  echo "Node version must not be overridden from the server environment." >&2
  exit 1
fi
grep -Fq 'apply_www_redirects' "$SYNC"
grep -Fq 'xyvc-www-redirects.conf' "$SYNC"
grep -Fq 'nginx -t' "$SYNC"
grep -Fq 'resources/ai-ready-check' "$SYNC"
grep -Fq 'resources/ai-employee-interview-guide' "$SYNC"
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

grep -Fq 'https://www.xiaoyuanvc.com/learn/crypto-vc/' "$CHECK"
grep -Fq 'https://www.xiaoyuanvc.com/learn/digital-startup/' "$CHECK"
grep -Fq "grep -Fqi 'server: nginx'" "$CHECK"
grep -Fq 'for attempt in {1..3}' "$CHECK"
grep -Fq 'DNS lookup returned no A record' "$CHECK"
