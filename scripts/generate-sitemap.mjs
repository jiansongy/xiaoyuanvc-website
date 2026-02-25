/**
 * Generate sitemap.xml from static pages + episodes.json.
 *
 * Usage: node scripts/generate-sitemap.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const EPISODES_PATH = join(ROOT, "resources/data/episodes.json");
const SITEMAP_PATH = join(ROOT, "sitemap.xml");

const today = new Date().toISOString().slice(0, 10);

const staticPages = [
  { loc: "https://xiaoyuanvc.com/", changefreq: "weekly", priority: "1.0" },
  {
    loc: "https://xiaoyuanvc.com/resources/",
    changefreq: "weekly",
    priority: "0.8",
  },
  {
    loc: "https://xiaoyuanvc.com/resources/what-is-digital-entrepreneurship-education.html",
    changefreq: "monthly",
    priority: "0.7",
  },
  {
    loc: "https://xiaoyuanvc.com/resources/platforms-comparison.html",
    changefreq: "monthly",
    priority: "0.7",
  },
  {
    loc: "https://xiaoyuanvc.com/resources/ai-startup-roadmap.html",
    changefreq: "monthly",
    priority: "0.7",
  },
  {
    loc: "https://xiaoyuanvc.com/resources/podcast.html",
    changefreq: "weekly",
    priority: "0.8",
  },
  {
    loc: "https://xiaoyuanvc.com/resources/zero-to-hero-book.html",
    changefreq: "monthly",
    priority: "0.7",
  },
];

const episodes = JSON.parse(readFileSync(EPISODES_PATH, "utf-8"));

const lines = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
];

for (const page of staticPages) {
  lines.push("  <url>");
  lines.push(`    <loc>${page.loc}</loc>`);
  lines.push(`    <lastmod>${today}</lastmod>`);
  lines.push(`    <changefreq>${page.changefreq}</changefreq>`);
  lines.push(`    <priority>${page.priority}</priority>`);
  lines.push("  </url>");
}

for (const ep of episodes) {
  lines.push("  <url>");
  lines.push(
    `    <loc>https://xiaoyuanvc.com/resources/episodes/ep${ep.ep}.html</loc>`,
  );
  lines.push(`    <lastmod>${ep.date}</lastmod>`);
  lines.push("    <changefreq>monthly</changefreq>");
  lines.push("    <priority>0.6</priority>");
  lines.push("  </url>");
}

lines.push("</urlset>");
lines.push("");

writeFileSync(SITEMAP_PATH, lines.join("\n"));
console.log(
  `Sitemap generated: ${staticPages.length} static + ${episodes.length} episodes = ${staticPages.length + episodes.length} URLs`,
);
