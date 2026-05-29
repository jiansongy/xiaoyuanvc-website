#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const HOSTNAME = "https://xiaoyuanvc.com";
const OUTPUTS = [path.join(DIST, "assets", "site-search-index.json")];

if (process.env.WRITE_ROOT_SEARCH_INDEX === "1") {
  OUTPUTS.unshift(path.join(ROOT, "assets", "site-search-index.json"));
}

const IGNORE_DIRS = new Set([
  "assets",
  "glm-proxy",
  "learn-src",
  "node_modules",
  "scripts",
  ".git",
  ".omc",
  ".omx",
  "t",
]);

const TYPE_BY_PATH = [
  [/^\/learn\//, "教程"],
  [/^\/resources\//, "资源"],
  [/^\/teacher/, "教师"],
  [/^\/student/, "学生"],
];

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (IGNORE_DIRS.has(name)) continue;
    const file = path.join(dir, name);
    const stat = fs.statSync(file);
    if (stat.isDirectory()) {
      walk(file, files);
    } else if (file.endsWith(".html")) {
      files.push(file);
    }
  }
  return files;
}

function stripTags(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&middot;/g, "·")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function normalizeSpace(text) {
  return decodeEntities(text).replace(/\s+/g, " ").trim();
}

function matchMeta(html, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `<meta\\b(?=[^>]*(?:name|property)=["']${escaped}["'])[^>]*content=["']([^"']*)["'][^>]*>`,
    "i",
  );
  const match = html.match(re);
  return match ? normalizeSpace(match[1]) : "";
}

function titleFromHtml(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? normalizeSpace(match[1]) : "";
}

function canonicalFromHtml(html) {
  const match = html.match(
    /<link\b(?=[^>]*rel=["']canonical["'])[^>]*href=["']([^"']+)["'][^>]*>/i,
  );
  return match ? normalizeSpace(match[1]) : "";
}

function urlFromFile(file, html) {
  const canonical = canonicalFromHtml(html);
  if (canonical && canonical.startsWith(HOSTNAME)) {
    return canonical.slice(HOSTNAME.length) || "/";
  }

  let rel = path.relative(DIST, file).split(path.sep).join("/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"index.html".length)}`;
  if (rel.endsWith(".html")) rel = rel.slice(0, -".html".length);
  return `/${rel}`;
}

function typeForUrl(url) {
  const found = TYPE_BY_PATH.find(([pattern]) => pattern.test(url));
  return found ? found[1] : "官网";
}

function buildEntry(file) {
  const html = fs.readFileSync(file, "utf8");
  const url = urlFromFile(file, html);
  if (url === "/404" || url === "/resources.html") return null;

  const title = titleFromHtml(html).replace(/\s*[|｜—-]\s*校园VC.*$/, "");
  const description =
    matchMeta(html, "description") || matchMeta(html, "og:description");
  const body = normalizeSpace(stripTags(html));
  const excerpt = description || body.slice(0, 140);

  return {
    title: title || url,
    url,
    type: typeForUrl(url),
    excerpt,
    text: normalizeSpace(`${title} ${description} ${body}`).slice(0, 12000),
  };
}

function main() {
  if (!fs.existsSync(DIST)) {
    throw new Error(`Missing dist directory: ${DIST}`);
  }

  const entries = walk(DIST)
    .map(buildEntry)
    .filter(Boolean)
    .sort((a, b) => a.url.localeCompare(b.url, "zh-CN"));

  const payload = `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    entries,
  })}\n`;

  for (const output of OUTPUTS) {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, payload);
  }

  console.log(
    `Built search index: ${entries.length} pages -> ${OUTPUTS.join(", ")}`,
  );
}

main();
