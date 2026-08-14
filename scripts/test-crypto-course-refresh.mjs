import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const cryptoRoot = join(root, "learn-src/docs/crypto-vc");
const read = (path) => readFileSync(join(root, path), "utf8");

function markdownFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory()
      ? markdownFiles(path)
      : path.endsWith(".md")
        ? [relative(root, path)]
        : [];
  });
}

const expectedPages = [
  "learn-src/docs/crypto-vc/index.md",
  "learn-src/docs/crypto-vc/start/chapter1-overview/index.md",
  "learn-src/docs/crypto-vc/start/chapter2-overview/index.md",
  "learn-src/docs/crypto-vc/advanced/chapter3-overview/index.md",
  "learn-src/docs/crypto-vc/advanced/chapter4-overview/index.md",
  "learn-src/docs/crypto-vc/advanced/chapter5-overview/index.md",
].sort();

assert.deepEqual(
  markdownFiles(cryptoRoot).sort(),
  expectedPages,
  "加密教程源码应只保留总览和五个新版章节",
);

const courseSource = expectedPages.map(read).join("\n");
assert.doesNotMatch(
  courseSource,
  /https?:\/\/[^\s<>()\]]*[，；：）]/,
  "加密教程裸网址不得吞入后续中文标点或正文",
);

const faithfulChapters = [
  {
    file: "learn-src/docs/crypto-vc/start/chapter1-overview/index.md",
    minBytes: 12000,
    topics: ["教学设计", "比特币", "区块链的数据结构", "以太坊", "加密工具推荐", "太多陌生术语", "建议从做 KOL 起步"],
  },
  {
    file: "learn-src/docs/crypto-vc/start/chapter2-overview/index.md",
    minBytes: 19000,
    topics: ["实务的重要性", "币安的创业故事", "加密钱包基础入门", "钱包的全生命周期安全", "币圈常见骗局", "囤比特币的指标"],
  },
  {
    file: "learn-src/docs/crypto-vc/advanced/chapter3-overview/index.md",
    minBytes: 10000,
    topics: ["从“数字货币”到“可编程产权”", "一笔完整的交易是如何走的", "DAPP生态分类图", "CROPS使命", "一笔二层交易到底怎么走"],
  },
  {
    file: "learn-src/docs/crypto-vc/advanced/chapter4-overview/index.md",
    minBytes: 15000,
    topics: ["Stablecoin", "DeFi 行业地图", "简化版 AMM 智能合约", "Uniswap", "RWA", "bStocks", "OpenSea"],
  },
  {
    file: "learn-src/docs/crypto-vc/advanced/chapter5-overview/index.md",
    minBytes: 19000,
    topics: ["HyperLiquid", "预测市场的工作原理", "Polymarket", "问答环节", "Bittensor", "九本推荐阅读书", "Top10 概念"],
  },
];
for (const chapter of faithfulChapters) {
  const source = read(chapter.file);
  assert.ok(
    Buffer.byteLength(source) >= chapter.minBytes,
    `${chapter.file} 正文过短，未达到忠实迁移下限 ${chapter.minBytes} 字节`,
  );
  for (const topic of chapter.topics) {
    assert.ok(source.includes(topic), `${chapter.file} 缺少原课件主题：${topic}`);
  }
}

const expectedIllustrations = [
  ["learn-src/docs/crypto-vc/start/chapter1-overview/index.md", "chapter-1", 11],
  ["learn-src/docs/crypto-vc/start/chapter2-overview/index.md", "chapter-2", 9],
  ["learn-src/docs/crypto-vc/advanced/chapter3-overview/index.md", "chapter-3", 3],
  ["learn-src/docs/crypto-vc/advanced/chapter4-overview/index.md", "chapter-4", 10],
  ["learn-src/docs/crypto-vc/advanced/chapter5-overview/index.md", "chapter-5", 4],
];
for (const [file, imageDirectory, expectedCount] of expectedIllustrations) {
  const source = read(file);
  assert.doesNotMatch(source, /^> \*\*图示说明：\*\*/m, `${file} 仍用可见文字代替插图`);
  const imageReferences = [...source.matchAll(
    new RegExp(`!\\[[^\\]]+\\]\\((/images/crypto-vc/${imageDirectory}/\\d{2}\\.webp)\\)`, "g"),
  )].map((match) => match[1]);
  assert.equal(imageReferences.length, expectedCount, `${file} 应包含 ${expectedCount} 张本地插图`);
  for (const imageReference of imageReferences) {
    const imagePath = join(root, "learn-src/docs/public", imageReference);
    assert.ok(statSync(imagePath).size > 1024, `${imageReference} 图片缺失或文件过小`);
  }
}

assert.doesNotMatch(
  courseSource,
  /作业|学员|评语|总分|截止日期|学习报告|结业证书|优秀学员证书|顾曼|范心怡|段岳[崧菘]|刘桐|邢维灵|第三期|每周三晚上|课程周期/,
  "公开教程不得包含学生信息、作业安排或班级运营信息",
);
assert.doesNotMatch(
  courseSource,
  /internal-api-drive-stream|yl23q26jon\.feishu\.cn|<cite\b|<sheet\b|<whiteboard\b|<grid\b|<column\b|<readonly-block\b/,
  "公开教程不得依赖飞书内部资源",
);

const config = read("learn-src/docs/.vitepress/config.ts");
for (const page of expectedPages.slice(1)) {
  const link = `/${page
    .replace("learn-src/docs/", "")
    .replace(/index\.md$/, "")}`;
  assert.match(config, new RegExp(link.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}
assert.doesNotMatch(config, /29|bitcoin-introduction|stablecoin-basics|graduation-project/);

const student = read("student.html");
assert.doesNotMatch(student, /加密创投教程29课|免费\s*·\s*29\s*课时|5章29课/);
assert.match(student, /公链、实务、以太坊、链上金融与前沿创新/);

const redirects = read("_redirects");
const legacyRedirects = {
  "/learn/crypto-vc/start/chapter1-overview/": [
    "bitcoin-introduction",
    "what-is-blockchain",
    "solana",
    "chain-comparison",
    "wallet-practice",
  ],
  "/learn/crypto-vc/start/chapter2-overview/": [
    "exchanges",
    "wallet-basics",
    "security-basics",
    "risk-management",
    "tools-and-learning-method",
  ],
  "/learn/crypto-vc/advanced/chapter3-overview/": [
    "ethereum",
  ],
  "/learn/crypto-vc/advanced/chapter4-overview/": [
    "stablecoin-basics",
    "yield-stablecoin",
    "etf-traditional-finance",
    "defi-basics",
    "uniswap-practice",
    "nft-digital-ownership",
    "gamefi",
    "memecoin-culture",
    "pump-fun",
    "kol-evaluation",
    "rwa-tokenization",
  ],
  "/learn/crypto-vc/advanced/chapter5-overview/": [
    "hyperliquid",
    "polymarket",
    "ai-agents",
    "depin",
    "nof1-quantitative-trading",
    "ai-tools",
    "graduation-project",
  ],
};
for (const [target, slugs] of Object.entries(legacyRedirects)) {
  for (const slug of slugs) {
    const section = [
      "bitcoin-introduction",
      "what-is-blockchain",
      "ethereum",
      "solana",
      "chain-comparison",
      "wallet-practice",
      "exchanges",
      "wallet-basics",
      "security-basics",
      "risk-management",
      "tools-and-learning-method",
    ].includes(slug)
      ? "start"
      : "advanced";
    assert.match(
      redirects,
      new RegExp(`^/learn/crypto-vc/${section}/${slug}/ ${target} 301$`, "m"),
      `缺少旧课时 ${slug} 的永久跳转`,
    );
  }
}

const staleCountPattern = /加密(?:创投)?教程[^\n<]{0,30}29\s*[课节]|29\s*[课节][^\n<]{0,30}加密|5\s*章\s*29\s*课|P29L/;
for (const file of [
  "index.html",
  "llms.txt",
  "student.html",
  "learn-src/docs/.vitepress/config.ts",
  "resources/crypto-investing-guide.html",
  "resources/digital-nomad-skills.html",
  "resources/platforms-comparison.html",
  "resources/what-is-digital-entrepreneurship-education.html",
  "resources/yc-startup-school-chinese-alternative.html",
  "resources/zero-to-hero-book.html",
]) {
  assert.doesNotMatch(read(file), staleCountPattern, `${file} 仍含旧版 29 课描述`);
}

console.log("PASS 加密创投教程五章更新、脱敏与站内文案检查");
