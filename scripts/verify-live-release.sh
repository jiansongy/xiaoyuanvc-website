#!/usr/bin/env bash
# Verify that a pushed release is visible on the URLs and assets selected for this release.

set -euo pipefail

WAIT_SECONDS=300
INTERVAL_SECONDS=10
URLS=()
MARKERS=()
ASSETS=()

usage() {
  cat <<'EOF'
Usage:
  scripts/verify-live-release.sh --url URL [--url URL ...] \
    --contains TEXT [--contains TEXT ...] [--asset 'URL|content-type'] \
    [--wait-seconds SECONDS] [--interval-seconds SECONDS]

Every URL must return HTTP 200 without a redirect and contain every TEXT marker.
Each asset must be written as URL|content-type, for example:
  --asset 'https://example.com/image.webp|image/webp'
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url)
      URLS+=("${2:?--url requires a URL}")
      shift 2
      ;;
    --contains)
      MARKERS+=("${2:?--contains requires text}")
      shift 2
      ;;
    --asset)
      ASSETS+=("${2:?--asset requires URL|content-type}")
      shift 2
      ;;
    --wait-seconds)
      WAIT_SECONDS="${2:?--wait-seconds requires seconds}"
      shift 2
      ;;
    --interval-seconds)
      INTERVAL_SECONDS="${2:?--interval-seconds requires seconds}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ ${#URLS[@]} -eq 0 || ${#MARKERS[@]} -eq 0 ]]; then
  echo "At least one --url and one --contains are required." >&2
  usage >&2
  exit 2
fi

if ! [[ "$WAIT_SECONDS" =~ ^[0-9]+$ && "$INTERVAL_SECONDS" =~ ^[1-9][0-9]*$ ]]; then
  echo "Wait must be zero or more whole seconds; interval must be a positive whole number." >&2
  exit 2
fi

check_page() {
  local url="$1" body headers status marker
  body="$(mktemp)"
  headers="$(mktemp)"
  status="$(curl --noproxy '*' -sS --connect-timeout 6 --max-time 12 --max-redirs 0 -D "$headers" -o "$body" -w '%{http_code}' "$url")"

  if [[ "$status" != "200" ]]; then
    echo "$url returned HTTP $status, expected 200." >&2
    rm -f "$body" "$headers"
    return 1
  fi
  if grep -Fqi 'location:' "$headers"; then
    echo "$url redirected unexpectedly." >&2
    rm -f "$body" "$headers"
    return 1
  fi
  for marker in "${MARKERS[@]}"; do
    if ! grep -Fq "$marker" "$body"; then
      echo "$url does not yet contain: $marker" >&2
      rm -f "$body" "$headers"
      return 1
    fi
  done
  rm -f "$body" "$headers"
}

check_asset() {
  local asset="$1" url expected_type headers status content_type
  url="${asset%%|*}"
  expected_type="${asset#*|}"
  if [[ "$url" == "$expected_type" || -z "$expected_type" ]]; then
    echo "Asset must use URL|content-type: $asset" >&2
    return 1
  fi
  headers="$(mktemp)"
  status="$(curl --noproxy '*' -sS --connect-timeout 6 --max-time 12 --max-redirs 0 -D "$headers" -o /dev/null -w '%{http_code}' "$url")"
  content_type="$(awk 'tolower($0) ~ /^content-type:/ { sub(/^[^:]*:[[:space:]]*/, ""); sub(/\r$/, ""); print; exit }' "$headers")"
  rm -f "$headers"
  if [[ "$status" != "200" || "$content_type" != "$expected_type"* ]]; then
    echo "$url returned HTTP $status with content type '$content_type'; expected 200 and '$expected_type'." >&2
    return 1
  fi
}

deadline=$((SECONDS + WAIT_SECONDS))
while :; do
  passed=1
  for url in "${URLS[@]}"; do
    check_page "$url" || passed=0
  done
  for asset in "${ASSETS[@]-}"; do
    [[ -n "$asset" ]] || continue
    check_asset "$asset" || passed=0
  done
  if [[ "$passed" == "1" ]]; then
    echo "Live release verification passed."
    exit 0
  fi
  if (( SECONDS >= deadline )); then
    echo "Live release verification timed out after ${WAIT_SECONDS}s." >&2
    exit 1
  fi
  sleep "$INTERVAL_SECONDS"
done
