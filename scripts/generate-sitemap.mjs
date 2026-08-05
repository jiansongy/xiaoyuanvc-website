import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const siteOrigin = "https://xiaoyuanvc.com";
const outputRoot = resolve(process.argv[2] || "dist");

function listHtmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? listHtmlFiles(path)
      : extname(entry.name) === ".html"
        ? [path]
        : [];
  });
}

function attribute(tag, name) {
  return tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1];
}

function canonicalFrom(html) {
  const tag = (html.match(/<link\b[^>]*>/gi) || []).find(
    (candidate) => attribute(candidate, "rel")?.toLowerCase() === "canonical",
  );
  return tag ? attribute(tag, "href") : undefined;
}

function isNoindex(html) {
  return (html.match(/<meta\b[^>]*>/gi) || []).some((tag) => {
    return (
      attribute(tag, "name")?.toLowerCase() === "robots" &&
      attribute(tag, "content")?.toLowerCase().split(/[\s,]+/).includes("noindex")
    );
  });
}

const urls = new Set();
for (const file of listHtmlFiles(outputRoot)) {
  const html = readFileSync(file, "utf8");
  if (isNoindex(html)) continue;

  const canonical = canonicalFrom(html);
  if (!canonical) continue;

  const url = new URL(canonical);
  if (url.origin !== siteOrigin) {
    throw new Error(`非本站 canonical：${canonical}（${file}）`);
  }
  if (url.hash || url.search || url.pathname.endsWith(".html")) {
    throw new Error(`canonical 不是规范 URL：${canonical}（${file}）`);
  }
  urls.add(url.href);
}

const ordered = [...urls].sort((a, b) => {
  if (a === `${siteOrigin}/`) return -1;
  if (b === `${siteOrigin}/`) return 1;
  return a.localeCompare(b, "zh-CN");
});

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...ordered.map((url) => `  <url><loc>${url.replaceAll("&", "&amp;")}</loc></url>`),
  "</urlset>",
  "",
].join("\n");

writeFileSync(join(outputRoot, "sitemap.xml"), xml);
console.log(`Sitemap generated: ${ordered.length} canonical URLs`);
