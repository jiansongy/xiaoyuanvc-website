#!/usr/bin/env bash
# build.sh — XYVC + learn-src 合并构建脚本
#
# 输出 dist/：
#   - 主站静态资源（XYVC 根目录所有 HTML/CSS/JS/资源），位于 dist/ 顶层
#   - VitePress 子站构建产物，位于 dist/learn/
#
# Cloudflare Pages 配置（PR 合入后必须改）：
#   Build command:           bash build.sh
#   Build output directory:  dist
#   Node version:            18+

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
DIST="$ROOT/dist"
LEARN_SRC="$ROOT/learn-src"

echo "==> [1/4] 清理 dist/"
rm -rf "$DIST"
mkdir -p "$DIST"

echo "==> [2/4] 复制主站静态资源到 dist/"
# 用 tar 流复制并排除大目录与构建产物；保留隐藏文件（_redirects、_headers、.cloudflare 等）
# CF Pages 容器没有 rsync，tar 更通用。
( cd "$ROOT" && tar -cf - \
    --exclude="./dist" \
    --exclude="./node_modules" \
    --exclude="./.git" \
    --exclude="./.obsidian" \
    --exclude="./learn-src" \
    --exclude="./build.sh" \
    --exclude="./.DS_Store" \
    . ) | ( cd "$DIST" && tar -xf - )

echo "==> [3/4] 构建 VitePress 子站 (learn-src)"
cd "$LEARN_SRC"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi
npx vitepress build docs

echo "==> [4/5] 拷贝 VitePress 产物到 dist/learn/"
mkdir -p "$DIST/learn"
cp -R "$LEARN_SRC/docs/.vitepress/dist/." "$DIST/learn/"

echo "==> [5/5] 生成全站搜索索引并注入搜索脚本"
node "$ROOT/scripts/build-search-index.js"
node "$ROOT/scripts/inject-site-search.js"

echo ""
echo "✅ 构建完成"
echo "   主站根：       $DIST/index.html"
echo "   加密教程总览： $DIST/learn/crypto-vc/index.html"
echo "   数创教程总览： $DIST/learn/digital-startup/index.html"
