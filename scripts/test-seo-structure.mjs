import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const read = (path) => readFileSync(join(root, path), "utf8");

const failures = [];
function check(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

check("第三期招生页已从源码移除", () => {
  assert.equal(existsSync(join(root, "css/camp-3/index.html")), false);
});

check("第三期招生旧地址永久跳转到加密方向", () => {
  const redirects = read("_redirects");
  assert.match(redirects, /^\/css\/camp-3 \/student#css 301$/m);
  assert.match(redirects, /^\/css\/camp-3\/ \/student#css 301$/m);
});

check("加密教程已更新为五章新版且不含旧招生信息", () => {
  const cryptoIndex = read("learn-src/docs/crypto-vc/index.md");
  assert.doesNotMatch(cryptoIndex, /css\/camp-3|¥999|第三期 7 月开营/);
  assert.match(cryptoIndex, /公链与区块链基础/);
  assert.match(cryptoIndex, /Perp DEX、预测市场与 Crypto AI/);
  assert.doesNotMatch(cryptoIndex, /29\s*课/);
});

const metadata = [
  [
    "resources/find-your-idea.html",
    "https://xiaoyuanvc.com/resources/find-your-idea",
    true,
  ],
  [
    "resources/hard-tech-check.html",
    "https://xiaoyuanvc.com/resources/hard-tech-check",
    true,
  ],
  [
    "resources/my-explorations.html",
    "https://xiaoyuanvc.com/resources/my-explorations",
    false,
  ],
  [
    "resources/tools-presentation.html",
    "https://xiaoyuanvc.com/resources/tools-presentation",
    true,
  ],
];

for (const [path, canonical, needsDescription] of metadata) {
  check(`${path} 的搜索元信息完整`, () => {
    const html = read(path);
    assert.match(
      html,
      new RegExp(`<link\\s+rel=["']canonical["']\\s+href=["']${canonical}["']\\s*/?>`),
    );
    if (needsDescription) {
      assert.match(html, /<meta\s+name=["']description["']\s+content=["'][^"']+["']\s*\/?>/);
    }
  });
}

check("AI 员工面试工具与指南文章已下架并干净移除", () => {
  assert.ok(!existsSync(join(root, "resources/ai-ready-check.html")), "ai-ready-check 工具页应移除");
  assert.ok(!existsSync(join(root, "resources/ai-employee-interview-guide.html")), "指南文章应移除");
  assert.doesNotMatch(read("resources/index.html"), /ai-employee-interview-guide/);
  assert.doesNotMatch(read("llms.txt"), /ai-employee-interview-guide/);
  assert.ok(
    !/href=["']ai-employee-interview-guide["']/.test(
      read("resources/ai-era-entrepreneurship-skills.html"),
    ),
    "相关主题文章不应再链接到已下架指南",
  );
});

check("AI 员工面试与指南旧链接已 301 重定向到资源中心", () => {
  const rules = read("_redirects");
  assert.match(rules, /\/resources\/ai-ready-check\s+\/resources\/\s+301/);
  assert.match(rules, /\/resources\/ai-employee-interview-guide\s+\/resources\/\s+301/);
});

check("生产构建会从页面索引信号生成 sitemap", () => {
  assert.ok(existsSync(join(root, "scripts/generate-sitemap.mjs")));
  assert.match(read("build.sh"), /generate-sitemap\.mjs/);
  assert.match(read("build.sh"), /test-seo-structure\.mjs/);
});

check("教程入口直接指向真实课程页", () => {
  assert.doesNotMatch(read("_redirects"), /\/student#courses/);
  assert.match(read("_redirects"), /^\/learn\/? \/learn\/digital-startup\/ 301$/m);
  const files = [
    "404.html",
    "llms.txt",
    "resources/ai-startup-roadmap.html",
    "resources/digital-entrepreneurship-platforms.html",
    "resources/digital-nomad-skills.html",
    "resources/free-digital-entrepreneurship-courses.html",
    "resources/hackathon-starter-guide.html",
    "resources/no-code-ai-startup.html",
    "resources/platforms-comparison.html",
    "resources/what-is-digital-entrepreneurship-education.html",
    "resources/zero-to-hero-book.html",
  ];
  for (const file of files) {
    const source = read(file);
    assert.doesNotMatch(source, /\/student#courses/, file);
    assert.doesNotMatch(source, />\s*xiaoyuanvc\.com\/learn\/\s*<\/a/, file);
  }
});

check("教程 404 不输出 canonical 且明确 noindex", () => {
  const config = read("learn-src/docs/.vitepress/config.ts");
  assert.match(config, /relativePath\s*===\s*["']404\.md["']/);
  assert.match(config, /noindex/);
  assert.match(config, /cleanUrls:\s*true/);
});

check("源码内链直接指向规范 URL", () => {
  assert.doesNotMatch(read("404.html"), /href=["']\/(?:student|teacher)\.html["']/);
  assert.doesNotMatch(read("resources/find-what-you-want.html"), /href=["'](?:\.\/)?index["']/);
  assert.doesNotMatch(read("resources/my-explorations.html"), /href=["']\.\/index["']/);
  assert.doesNotMatch(read("llms.txt"), /xiaoyuanvc\.com\/(?:student\.html|learn\/)(?:[)\s：]|$)/m);

  const files = [
    "resources/ai-opportunity.js",
    "resources/ai-startup-roadmap.html",
    "resources/digital-entrepreneurship-platforms.html",
    "resources/digital-nomad-skills.html",
    "resources/free-digital-entrepreneurship-courses.html",
    "resources/hackathon-starter-guide.html",
    "resources/hard-tech-check.html",
    "resources/my-explorations.html",
    "resources/no-code-ai-startup.html",
    "resources/platforms-comparison.html",
    "resources/what-is-digital-entrepreneurship-education.html",
    "resources/zero-to-hero-book.html",
  ];
  for (const file of files) {
    const source = read(file);
    assert.doesNotMatch(source, /(?:href|path):?\s*["'](?:\.\/|\/)?[^"']+\.html["']/);
    assert.doesNotMatch(source, /href=["'](?:https:\/\/xiaoyuanvc\.com)?\/learn\/["']/);
  }
});

check("robots 区分搜索抓取与训练抓取", () => {
  const robots = read("robots.txt");
  assert.match(robots, /User-agent: OAI-SearchBot\s+Allow: \//);
  assert.match(robots, /User-agent: PerplexityBot\s+Allow: \//);
  assert.match(robots, /User-agent: ChatGPT-User\s+Allow: \//);
  assert.match(robots, /User-agent: GPTBot\s+Disallow: \//);
  assert.match(robots, /User-agent: Google-Extended\s+Disallow: \//);
  assert.match(robots, /User-agent: ClaudeBot\s+Disallow: \//);
});

if (!existsSync(join(root, "dist/index.html"))) {
  check("存在新鲜构建产物", () => {
    assert.fail("缺少 dist/index.html；请先运行 npm run build");
  });
} else {
  const listHtml = (directory) =>
    readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory()
        ? listHtml(path)
        : entry.name.endsWith(".html")
          ? [path]
          : [];
    });
  const attribute = (tag, name) =>
    tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1];

  check("构建产物 sitemap 与可索引 canonical 集合一致", () => {
    const expected = new Set();
    for (const file of listHtml(join(root, "dist"))) {
      const html = readFileSync(file, "utf8");
      const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
      const noindex = metaTags.some(
        (tag) =>
          attribute(tag, "name")?.toLowerCase() === "robots" &&
          attribute(tag, "content")?.toLowerCase().split(/[\s,]+/).includes("noindex"),
      );
      if (noindex) continue;
      const canonicalTag = (html.match(/<link\b[^>]*>/gi) || []).find(
        (tag) => attribute(tag, "rel")?.toLowerCase() === "canonical",
      );
      const canonical = canonicalTag && attribute(canonicalTag, "href");
      if (canonical) expected.add(canonical);
    }

    const sitemap = read("dist/sitemap.xml");
    const actual = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
    assert.deepEqual(actual, expected);
    assert.ok(actual.size >= 46, `预期至少 46 条，实际 ${actual.size} 条`);
    assert.ok(![...actual].some((url) => url.includes("camp-3")));
    assert.doesNotMatch(sitemap, /<lastmod>/);
  });

  check("构建产物 404 与旧招生页状态正确", () => {
    const learn404 = read("dist/learn/404.html");
    assert.match(learn404, /<meta name="robots" content="noindex, nofollow">/);
    assert.doesNotMatch(learn404, /rel="canonical"/);
    assert.equal(existsSync(join(root, "dist/css/camp-3/index.html")), false);
  });

  check("构建产物 JSON-LD 全部可解析", () => {
    let count = 0;
    for (const file of listHtml(join(root, "dist"))) {
      const html = readFileSync(file, "utf8");
      for (const match of html.matchAll(
        /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
      )) {
        JSON.parse(match[1]);
        count += 1;
      }
    }
    assert.ok(count > 0, "没有发现 JSON-LD");
    console.log(`INFO parsed ${count} JSON-LD blocks`);
  });

  check("构建产物不再链接站内重定向 URL", () => {
    for (const file of listHtml(join(root, "dist"))) {
      const html = readFileSync(file, "utf8");
      for (const match of html.matchAll(/href=["']([^"']+)["']/gi)) {
        const href = match[1];
        if (/^(?:#|mailto:|tel:|javascript:)/.test(href)) continue;
        const basePath = file
          .slice(join(root, "dist").length)
          .replace(/index\.html$/, "")
          .replace(/\.html$/, "");
        const url = new URL(href, `https://xiaoyuanvc.com${basePath}`);
        if (url.origin !== "https://xiaoyuanvc.com") continue;
        assert.ok(!url.pathname.endsWith(".html"), `${file}: ${href}`);
        assert.notEqual(url.pathname, "/learn/", `${file}: ${href}`);
      }
    }
  });
}

if (failures.length) {
  console.error(`\n${failures.length} SEO structure check(s) failed.`);
  process.exit(1);
}

console.log("\nAll SEO structure checks passed.");
