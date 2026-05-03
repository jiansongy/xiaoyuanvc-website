#!/usr/bin/env bash
# deploy.sh — preview-v2 → production deploy script
# Usage:
#   bash deploy.sh           # dry-run (default): prints what would happen, changes nothing
#   bash deploy.sh --apply   # actually executes all steps
#   bash deploy.sh --apply --no-push  # execute locally and commit, but do not push
#
# Must be run from XYVC/ root directory.

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PREVIEW_DIR="$SCRIPT_DIR"
ARCHIVE_DIR="$ROOT_DIR/archive/2026-04-30"
DATE="2026-04-30"

# ── Dry-run mode ──────────────────────────────────────────────────────────────
DRY_RUN=true
PUSH=true
for arg in "$@"; do
  case "$arg" in
    --apply)
      DRY_RUN=false
      ;;
    --no-push)
      PUSH=false
      ;;
    *)
      echo "ERROR: Unknown argument: $arg"
      echo "Usage: bash deploy.sh [--apply] [--no-push]"
      exit 1
      ;;
  esac
done

if $DRY_RUN; then
  echo "========================================="
  echo "  DRY-RUN MODE (no files will be changed)"
  echo "  Pass --apply to execute for real"
  echo "========================================="
  echo ""
fi

# Helper: print or execute a command
run() {
  if $DRY_RUN; then
    echo "  [DRY-RUN] $*"
  else
    echo "  [EXEC] $*"
    eval "$*"
  fi
}

# ── Preflight checks ──────────────────────────────────────────────────────────
echo "=== Preflight checks ==="

if [[ ! -f "$ROOT_DIR/styles.css" ]]; then
  echo "ERROR: Not running from XYVC/ root. Expected styles.css at $ROOT_DIR/styles.css"
  exit 1
fi
echo "  [OK] Working directory: $ROOT_DIR"

for f in \
  "$PREVIEW_DIR/index.html" \
  "$PREVIEW_DIR/student.html" \
  "$PREVIEW_DIR/teacher.html" \
  "$PREVIEW_DIR/resources.html"; do
  if [[ ! -f "$f" ]]; then
    echo "ERROR: Missing source file: $f"
    exit 1
  fi
  echo "  [OK] Found: $f"
done

echo ""

# ── Step 1: Backup ─────────────────────────────────────────────────────────────
echo "=== Step 1: Backup existing files ==="
run "mkdir -p '$ARCHIVE_DIR'"
run "cp '$ROOT_DIR/index.html' '$ARCHIVE_DIR/index.html'"
run "cp '$ROOT_DIR/resources/index.html' '$ARCHIVE_DIR/resources-index.html'"
echo ""

# ── Step 2: Move files ─────────────────────────────────────────────────────────
echo "=== Step 2: Move preview-v2 files into production paths ==="
run "cp '$PREVIEW_DIR/index.html' '$ROOT_DIR/index.html'"
run "cp '$PREVIEW_DIR/student.html' '$ROOT_DIR/student.html'"
run "cp '$PREVIEW_DIR/teacher.html' '$ROOT_DIR/teacher.html'"
run "cp '$PREVIEW_DIR/resources.html' '$ROOT_DIR/resources/index.html'"
echo ""

# ── Step 3: Path replacements — index.html / student.html / teacher.html ───────
echo "=== Step 3: Fix paths in root-level pages ==="

for file in index.html student.html teacher.html; do
  target="$ROOT_DIR/$file"
  echo "  Processing: $file"

  # ../assets/ → assets/
  run "sed -i '' 's|\"\\.\\./assets/|\"assets/|g' '$target'"

  # ../styles.css → styles.css
  run "sed -i '' 's|\"\\.\\./styles\\.css\"|\"styles.css\"|g' '$target'"

  # ../main.js → main.js
  run "sed -i '' 's|\"\\.\\./main\\.js\"|\"main.js\"|g' '$target'"

  # href="resources.html#xxx" → href="resources/#xxx"
  run "sed -i '' 's|href=\"resources\\.html#|href=\"resources/#|g' '$target'"

  # href="resources.html" → href="resources/"
  run "sed -i '' 's|href=\"resources\\.html\"|href=\"resources/\"|g' '$target'"
done
echo ""

# ── Step 4: Path replacements — resources/index.html ──────────────────────────
echo "=== Step 4: Fix paths in resources/index.html ==="
target="$ROOT_DIR/resources/index.html"

# ../resources/<file>.html → <file>.html (sibling files in resources/)
run "sed -i '' 's|href=\"\\.\\./resources/|href=\"|g' '$target'"

# resources.html self-links → current resources/ directory
run "sed -i '' 's|href=\"resources\\.html\"|href=\"./\"|g' '$target'"

# root-level audience pages from resources/ directory
run "sed -i '' 's|href=\"student\\.html\"|href=\"../student.html\"|g' '$target'"
run "sed -i '' 's|href=\"teacher\\.html\"|href=\"../teacher.html\"|g' '$target'"

# Note: ../assets/, ../styles.css, ../main.js, ../index.html
# all correctly point to XYVC/ root from resources/ — no change needed.
echo "  [NOTE] ../assets/, ../styles.css, ../main.js, ../index.html kept as-is (correct from resources/)"
echo ""

# ── Step 5: Update sitemap.xml ─────────────────────────────────────────────────
echo "=== Step 5: Update sitemap.xml ==="
SITEMAP="$ROOT_DIR/sitemap.xml"

if $DRY_RUN; then
  echo "  [DRY-RUN] Would check sitemap.xml for student.html / teacher.html entries"
  echo "  [DRY-RUN] Would insert new <url> blocks if missing"
  echo "  [DRY-RUN] Would update lastmod for / and /resources/ to $DATE"
else
  # Add student.html if not already present
  if ! grep -q "xiaoyuanvc.com/student" "$SITEMAP"; then
    echo "  [EXEC] Adding student.html to sitemap"
    sed -i '' "s|</urlset>|  <url>\n    <loc>https://xiaoyuanvc.com/student.html</loc>\n    <lastmod>${DATE}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n</urlset>|" "$SITEMAP"
  else
    echo "  [SKIP] student.html already in sitemap"
  fi

  # Add teacher.html if not already present
  if ! grep -q "xiaoyuanvc.com/teacher" "$SITEMAP"; then
    echo "  [EXEC] Adding teacher.html to sitemap"
    sed -i '' "s|</urlset>|  <url>\n    <loc>https://xiaoyuanvc.com/teacher.html</loc>\n    <lastmod>${DATE}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n</urlset>|" "$SITEMAP"
  else
    echo "  [SKIP] teacher.html already in sitemap"
  fi

  # Update lastmod for root and resources URLs
  sed -i '' \
    "/<loc>https:\/\/xiaoyuanvc\.com\/<\/loc>/{n;s|<lastmod>.*</lastmod>|<lastmod>${DATE}</lastmod>|;}" \
    "$SITEMAP"
  sed -i '' \
    "/<loc>https:\/\/xiaoyuanvc\.com\/resources\/<\/loc>/{n;s|<lastmod>.*</lastmod>|<lastmod>${DATE}</lastmod>|;}" \
    "$SITEMAP"
  echo "  [OK] sitemap.xml updated"
fi
echo ""

# ── Step 6: Git commit ─────────────────────────────────────────────────────────
echo "=== Step 6: Git commit & push ==="
if $DRY_RUN; then
  echo "  [DRY-RUN] Would run: git add index.html student.html teacher.html resources/index.html sitemap.xml _redirects styles.css main.js llms.txt assets/book-fun-of-startup.png assets/book-zero-to-hero.png assets/partners/{diic,shandong-digital-valley,tsinghua-x-lab}.png preview-v2/{AUDIT,CLOUDFLARE-MIGRATION,DEPLOY-PLAN}.md preview-v2/{deploy,index,resources,student,teacher}.html preview-v2/sitemap-additions.txt"
  echo "  [DRY-RUN] Would run: git commit with Lore protocol message"
  if $PUSH; then
    echo "  [DRY-RUN] Would run: git push origin main"
  else
    echo "  [DRY-RUN] Would skip git push because --no-push is set"
  fi
else
  cd "$ROOT_DIR"
  git add \
    index.html \
    student.html \
    teacher.html \
    resources/index.html \
    sitemap.xml \
    _redirects \
    styles.css \
    main.js \
    llms.txt \
    assets/book-fun-of-startup.png \
    assets/book-zero-to-hero.png \
    assets/partners/diic.png \
    assets/partners/shandong-digital-valley.png \
    assets/partners/tsinghua-x-lab.png \
    preview-v2/AUDIT.md \
    preview-v2/CLOUDFLARE-MIGRATION.md \
    preview-v2/DEPLOY-PLAN.md \
    preview-v2/deploy.sh \
    preview-v2/index.html \
    preview-v2/resources.html \
    preview-v2/sitemap-additions.txt \
    preview-v2/student.html \
    preview-v2/teacher.html
  git commit -m "Launch preview-v2 because the four-page site passed release gates" \
    -m "Constraint: Cloudflare Pages deploys from origin/main after the production paths are updated." \
    -m "Rejected: Keep preview-v2 only as an unpublished staging folder | The launch plan requires root, student, teacher, and resources production URLs." \
    -m "Confidence: high" \
    -m "Scope-risk: moderate" \
    -m "Directive: Preserve the 19万+ / 1000+ / 100万愿景数字口径 and Lore commit trailers in future launch commits." \
    -m "Tested: deploy.sh dry-run; mobile Lighthouse A11y/Best Practices/SEO >= 95 for all four pages; JSON-LD parse check; local link/resource smoke test for four pages, eight tools, and eleven articles." \
    -m "Not-tested: Cloudflare CDN purge, GA4 realtime page_view, schema.org online validator, and Google Search Console sitemap submission require production access after push."
  if $PUSH; then
    git push origin main
    echo "  [OK] Pushed to origin/main"
  else
    echo "  [SKIP] git push skipped because --no-push is set"
  fi
fi
echo ""

# ── Summary ────────────────────────────────────────────────────────────────────
echo "========================================="
if $DRY_RUN; then
  echo "  DRY-RUN complete. No files were changed."
  echo "  Review the output above, then run:"
  echo "    bash preview-v2/deploy.sh --apply"
else
  echo "  Deploy complete!"
  echo "  Backups saved to: $ARCHIVE_DIR"
  echo "  Rollback: cp $ARCHIVE_DIR/index.html $ROOT_DIR/index.html"
  echo "            cp $ARCHIVE_DIR/resources-index.html $ROOT_DIR/resources/index.html"
fi
echo "========================================="
