#!/usr/bin/env bash
# Retry transport failures only. COMMAND_CONTENT must deduplicate execution on the server.
set -euo pipefail

error_file="$(mktemp)"
trap 'rm -f "$error_file"' EXIT
for attempt in 1 2 3; do
  if response="$(aliyun swas-open run-command "$@" 2>"$error_file")"; then
    printf '%s\n' "$response"
    exit 0
  fi
  cat "$error_file" >&2
  if ! grep -Eqi 'connection reset by peer|connection refused|i/o timeout|TLS handshake timeout|unexpected EOF|: EOF|temporary failure in name resolution' "$error_file"; then
    exit 1
  fi
  if [[ "$attempt" == 3 ]]; then
    echo 'Command submission failed after 3 transport attempts.' >&2
    exit 1
  fi
  echo "Retrying command submission after transport failure ($attempt/3)." >&2
  sleep "$((attempt * 5))"
done
