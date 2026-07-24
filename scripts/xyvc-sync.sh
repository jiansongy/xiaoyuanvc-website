#!/usr/bin/env bash

set -euo pipefail

REPOSITORY="${XYVC_REPOSITORY:-jiansongy/xiaoyuanvc-website}"
GITHUB_SHA="${XYVC_GITHUB_SHA:?XYVC_GITHUB_SHA is required}"
LIVE_ROOT="/var/www/xiaoyuanvc"
DEPLOY_PARENT="/var/www"
MIN_FREE_KB=1048576

if [[ ! "$GITHUB_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "XYVC_GITHUB_SHA must be a 40-character lowercase commit SHA." >&2
  exit 2
fi

WORK_DIR="$(mktemp -d /tmp/xyvc-sync.XXXXXX)"
RELEASE_DIR="$DEPLOY_PARENT/.xyvc-release-${GITHUB_SHA}-$$"
BACKUP_DIR="$DEPLOY_PARENT/.xyvc-backup-${GITHUB_SHA}-$$"
FAILED_DIR="$DEPLOY_PARENT/.xyvc-failed-${GITHUB_SHA}-$$"
SWAPPED=0
LIVE_MOVED=0
PRESERVE_RELEASE=0

remove_managed_tree() {
  local target="$1"
  case "$target" in
    /tmp/xyvc-sync.*|/var/www/.xyvc-release-*|/var/www/.xyvc-backup-*|/var/www/.xyvc-failed-*)
      if [[ -e "$target" ]]; then
        rm -rf -- "$target"
      fi
      ;;
    *)
      echo "Refusing to remove unmanaged path: $target" >&2
      return 1
      ;;
  esac
}

cleanup() {
  local status=$?
  trap - EXIT

  if (( status != 0 && LIVE_MOVED == 1 )); then
    echo "Deployment failed while the live path was empty; attempting immediate recovery." >&2
    if mv "$BACKUP_DIR" "$LIVE_ROOT"; then
      LIVE_MOVED=0
      echo "Previous release returned to the live path." >&2
    elif mv "$RELEASE_DIR" "$LIVE_ROOT"; then
      LIVE_MOVED=0
      echo "New release returned to the live path as a safety fallback." >&2
    else
      PRESERVE_RELEASE=1
      echo "Automatic recovery failed; preserving both candidate trees." >&2
      echo "Manual recovery required: $RELEASE_DIR and $BACKUP_DIR" >&2
    fi
  fi

  if (( status != 0 && SWAPPED == 1 )); then
    echo "Deployment failed after the live swap; restoring the previous release." >&2
    if [[ ! -e "$BACKUP_DIR" ]]; then
      echo "Rollback backup is missing; preserving the current live tree." >&2
    elif [[ -e "$LIVE_ROOT" ]] && ! mv "$LIVE_ROOT" "$FAILED_DIR"; then
      echo "Could not move the failed release aside; preserving live and backup trees." >&2
    elif mv "$BACKUP_DIR" "$LIVE_ROOT"; then
      echo "Previous release restored." >&2
      remove_managed_tree "$FAILED_DIR" || true
    else
      echo "Could not restore the previous release; preserving the backup tree." >&2
      if [[ ! -e "$LIVE_ROOT" && -e "$FAILED_DIR" ]]; then
        if mv "$FAILED_DIR" "$LIVE_ROOT"; then
          echo "The new release was returned to the live path as a safety fallback." >&2
        else
          echo "Manual recovery required: $FAILED_DIR and $BACKUP_DIR" >&2
        fi
      fi
    fi
  fi

  remove_managed_tree "$WORK_DIR" || true
  if (( PRESERVE_RELEASE == 0 )); then
    remove_managed_tree "$RELEASE_DIR" || true
  fi
  if (( status == 0 )); then
    remove_managed_tree "$BACKUP_DIR" || true
  fi
  exit "$status"
}
trap cleanup EXIT

echo "[1/7] Snapshot current server state"
docker ps || true
npm list -g --depth=0 || true
systemctl list-units --type=service --state=running --no-pager || true
node --version
npm --version
df -Pk "$DEPLOY_PARENT"

available_kb="$(df -Pk "$DEPLOY_PARENT" | awk 'NR == 2 { print $4 }')"
if [[ ! "$available_kb" =~ ^[0-9]+$ ]] || (( available_kb < MIN_FREE_KB )); then
  echo "At least 1 GiB of free space is required under $DEPLOY_PARENT." >&2
  exit 1
fi

if [[ ! -d "$LIVE_ROOT" ]]; then
  echo "Expected nginx document root does not exist: $LIVE_ROOT" >&2
  exit 1
fi

echo "[2/7] Download exact source SHA: $GITHUB_SHA"
archive="$WORK_DIR/source.tar.gz"
source_parent="$WORK_DIR/source"
mkdir -p "$source_parent"
curl -fsSL \
  "https://codeload.github.com/${REPOSITORY}/tar.gz/${GITHUB_SHA}" \
  -o "$archive"
tar -xzf "$archive" -C "$source_parent"

source_dir="$(find "$source_parent" -mindepth 1 -maxdepth 1 -type d -print -quit)"
if [[ -z "$source_dir" || ! -f "$source_dir/build.sh" || ! -f "$source_dir/learn-src/package-lock.json" ]]; then
  echo "Downloaded source archive does not contain the expected project structure." >&2
  exit 1
fi

echo "[3/7] Build complete dist tree"
(
  cd "$source_dir"
  bash build.sh
)

echo "[4/7] Validate build output"
required_files=(
  "dist/index.html"
  "dist/learn/crypto-vc/index.html"
  "dist/learn/digital-startup/index.html"
)
for required_file in "${required_files[@]}"; do
  if [[ ! -s "$source_dir/$required_file" ]]; then
    echo "Missing required build output: $required_file" >&2
    exit 1
  fi
done
grep -Fq '京ICP备2021017602号-1' "$source_dir/dist/index.html"
grep -Fq '京公网安备11010802035175号' "$source_dir/dist/index.html"

mkdir "$RELEASE_DIR"
cp -a "$source_dir/dist/." "$RELEASE_DIR/"
release_file_count="$(find "$RELEASE_DIR" -type f | wc -l | tr -d ' ')"
echo "Prepared $release_file_count files for release."

echo "[5/7] Replace nginx document root"
mv "$LIVE_ROOT" "$BACKUP_DIR"
LIVE_MOVED=1
mv "$RELEASE_DIR" "$LIVE_ROOT"
LIVE_MOVED=0
SWAPPED=1

echo "[6/7] Verify local nginx origin"
origin=(curl --noproxy '*' --silent --show-error --resolve www.xiaoyuanvc.com:443:127.0.0.1)

verify_page() {
  local path="$1"
  local marker="$2"
  local body_file="$WORK_DIR/response.html"
  local status

  status="$("${origin[@]}" --output "$body_file" --write-out '%{http_code}' "https://www.xiaoyuanvc.com$path")"
  if [[ "$status" != "200" ]]; then
    echo "Local smoke test failed for $path: HTTP $status" >&2
    return 1
  fi
  grep -Fq "$marker" "$body_file"
}

verify_page "/" "京ICP备2021017602号-1"
verify_page "/learn/crypto-vc/" "加密创投教程"
verify_page "/learn/digital-startup/" "数字创业教程"

missing_path="/deployment-smoke-missing-${GITHUB_SHA}"
missing_status="$("${origin[@]}" --output /dev/null --write-out '%{http_code}' "https://www.xiaoyuanvc.com$missing_path")"
if [[ "$missing_status" != "404" ]]; then
  echo "Expected HTTP 404 for $missing_path, got $missing_status." >&2
  exit 1
fi

echo "[7/7] Finalize release"
SWAPPED=0
remove_managed_tree "$BACKUP_DIR"
echo "DONE-SYNC SHA=$GITHUB_SHA FILES=$release_file_count"
