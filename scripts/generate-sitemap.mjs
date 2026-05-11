/**
 * Generate sitemap.xml from static pages + episodes.json.
 *
 * Usage: node scripts/generate-sitemap.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const EPISODES_PATH = join(ROOT, "resources/data/episodes.json");
const SITEMAP_PATH = join(ROOT, "sitemap.xml");
const LEARN_DOCS = join(ROOT, "learn-src/docs");

const today = new Date().toISOString().slice(0, 10);

const staticPages = [
  { loc: "https://xiaoyuanvc.com/", changefreq: "weekly", priority: "1.0" },
  {
    loc: "https://xiaoyuanvc.com/resources/",
    changefreq: "weekly",
    priority: "0.8",
  },
  {
    loc: "https://xiaoyuanvc.com/student",
    changefreq: "monthly",
    priority: "0.8",
  },
  {
    loc: "https://xiaoyuanvc.com/teacher",
    changefreq: "monthly",
    priority: "0.8",
  },
  {
    loc: "https://xiaoyuanvc.com/resources/what-is-digital-entrepreneurship-education",
    changefreq: "monthly",
    priority: "0.7",
  },
  {
    loc: "https://xiaoyuanvc.com/resources/platforms-comparison",
    changefreq: "monthly",
    priority: "0.7",
  },
  {
    loc: "https://xiaoyuanvc.com/resources/ai-startup-roadmap",
    changefreq: "monthly",
    priority: "0.7",
  },
  {
    loc: "https://xiaoyuanvc.com/resources/no-code-ai-startup",
    changefreq: "monthly",
    priority: "0.8",
  },
  {
    loc: "https://xiaoyuanvc.com/resources/ai-era-entrepreneurship-skills",
    changefreq: "monthly",
    priority: "0.8",
  },
  {
    loc: "https://xiaoyuanvc.com/resources/chinese-web3-startup-course",
    changefreq: "monthly",
    priority: "0.8",
  },
  {
    loc: "https://xiaoyuanvc.com/resources/podcast",
    changefreq: "weekly",
    priority: "0.8",
  },
  {
    loc: "https://xiaoyuanvc.com/resources/zero-to-hero-book",
    changefreq: "monthly",
    priority: "0.7",
  },
];

const episodes = JSON.parse(readFileSync(EPISODES_PATH, "utf-8"));

function walkMarkdown(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === ".vitepress" || entry === "public" || entry.startsWith("."))
      continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walkMarkdown(full, acc);
    } else if (entry.endsWith(".md")) {
      acc.push(full);
    }
  }
  return acc;
}

// VitePress 源 → URL：foo/index.md → /learn/foo/；foo/bar.md → /learn/foo/bar
// (CF Pages 把 .html 308 到无扩展名，sitemap 必须用最终 URL)
const learnUrls = walkMarkdown(LEARN_DOCS).map((mdPath) => {
  const rel = relative(LEARN_DOCS, mdPath).replace(/\\/g, "/");
  const cleaned = rel.replace(/index\.md$/, "").replace(/\.md$/, "");
  return `https://xiaoyuanvc.com/learn/${cleaned}`;
});
learnUrls.sort();

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
    `    <loc>https://xiaoyuanvc.com/resources/episodes/ep${ep.ep}</loc>`,
  );
  lines.push(`    <lastmod>${ep.date}</lastmod>`);
  lines.push("    <changefreq>monthly</changefreq>");
  lines.push("    <priority>0.6</priority>");
  lines.push("  </url>");
}

for (const loc of learnUrls) {
  lines.push("  <url>");
  lines.push(`    <loc>${loc}</loc>`);
  lines.push(`    <lastmod>${today}</lastmod>`);
  lines.push("    <changefreq>monthly</changefreq>");
  lines.push("    <priority>0.7</priority>");
  lines.push("  </url>");
}

lines.push("</urlset>");
lines.push("");

writeFileSync(SITEMAP_PATH, lines.join("\n"));
console.log(
  `Sitemap generated: ${staticPages.length} static + ${episodes.length} episodes + ${learnUrls.length} learn = ${staticPages.length + episodes.length + learnUrls.length} URLs`,
);
