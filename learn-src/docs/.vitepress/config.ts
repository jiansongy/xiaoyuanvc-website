import { defineConfig, type HeadConfig } from "vitepress";

const HOSTNAME = "https://xiaoyuanvc.com";
const BASE = "/learn/";
const LOGO_URL = `${HOSTNAME}${BASE}campus-vc-logo.png`;

const TUTORIAL_NAMES: Record<
  string,
  { name: string; url: string; courseId: string }
> = {
  "crypto-vc": {
    name: "加密创投教程",
    url: `${HOSTNAME}${BASE}crypto-vc/start/chapter1-overview/`,
    courseId: `${HOSTNAME}/#course-crypto`,
  },
  "digital-startup": {
    name: "数字创业教程",
    url: `${HOSTNAME}${BASE}digital-startup/`,
    courseId: `${HOSTNAME}/#course-digital`,
  },
};

function toCanonical(relativePath: string) {
  // CF Pages 把 *.html 308 重定向到无扩展名版本，canonical 对齐目标 URL
  const cleaned = relativePath
    .replace(/index\.md$/, "")
    .replace(/\.md$/, "");
  return `${HOSTNAME}${BASE}${cleaned}`;
}

function addJsonLd(head: HeadConfig[], data: Record<string, unknown>) {
  head.push(["script", { type: "application/ld+json" }, JSON.stringify(data)]);
}

export default defineConfig({
  base: BASE,
  cleanUrls: true,
  ignoreDeadLinks: true,
  title: "校园VC教程站",
  description:
    "校园VC教程站：免费数字创业教程 + 加密创投教程，覆盖 AI 创业认知、机会洞察、产品开发、增长营销、融资路演，以及比特币、区块链、DeFi、稳定币、NFT、AI 代理。清华大学 x-lab 创业导师殷建松主讲。",
  lang: "zh-CN",

  head: [
    ["meta", { name: "theme-color", content: "#2563eb" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:locale", content: "zh_CN" }],
    ["meta", { property: "og:site_name", content: "校园VC" }],
    [
      "script",
      {
        async: "",
        src: "https://www.googletagmanager.com/gtag/js?id=G-LP5EB2HW33",
      },
    ],
    [
      "script",
      {},
      "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-LP5EB2HW33');",
    ],
  ],

  transformHead({ pageData, siteData }) {
    const head: HeadConfig[] = [];
    if (pageData.relativePath === "404.md") {
      return [["meta", { name: "robots", content: "noindex, nofollow" }]];
    }
    const canonicalUrl = toCanonical(pageData.relativePath);
    const title =
      pageData.frontmatter.title || pageData.title || siteData.title;
    const description = pageData.description || siteData.description;
    const isHome = pageData.relativePath === "index.md";
    const tutorialKey = Object.keys(TUTORIAL_NAMES).find((k) =>
      pageData.relativePath.startsWith(k),
    );

    head.push(["link", { rel: "canonical", href: canonicalUrl }]);
    head.push(["meta", { property: "og:title", content: title }]);
    head.push(["meta", { property: "og:url", content: canonicalUrl }]);
    head.push(["meta", { property: "og:description", content: description }]);
    head.push(["meta", { property: "og:image", content: LOGO_URL }]);

    if (isHome) {
      addJsonLd(head, {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": `${HOSTNAME}/#founder`,
        name: "殷建松",
        alternateName: "Jason Yin",
        jobTitle: "创始人 / 清华大学 x-lab 创业导师",
        description:
          "校园VC创始人，清华大学 x-lab 创业导师，《从零到英雄》作者，致力于推动大学生数字创业教育。专注 AI 创业与加密创投两大领域。",
        knowsAbout: [
          "数字创业",
          "AI 创业",
          "加密投资",
          "Vibe Coding",
          "创业教育",
        ],
        affiliation: {
          "@type": "EducationalOrganization",
          name: "清华大学 x-lab",
          url: "https://x-lab.tsinghua.edu.cn",
        },
        sameAs: [
          "https://www.xiaoyuzhoufm.com/podcast/621ef071dade2c0f9ef1a6ab",
          "https://book.douban.com/subject/26957489/",
          "https://mp.weixin.qq.com/s/xpOuwndxPF1dm3ZIVJOwxg",
          "https://mp.weixin.qq.com/s/DYmJnRrbrjqaKgHx7nWiSQ",
        ],
      });
      addJsonLd(head, {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        name: "校园VC",
        url: HOSTNAME,
        logo: LOGO_URL,
        description:
          "大学生创业教育平台，免费提供AI创业和加密创投系统课程，已培养900+毕业生",
        founder: { "@id": `${HOSTNAME}/#founder` },
        sameAs: [
          HOSTNAME,
          "https://www.xiaoyuzhoufm.com/podcast/621ef071dade2c0f9ef1a6ab",
          "https://mp.weixin.qq.com/s/xpOuwndxPF1dm3ZIVJOwxg",
          "https://mp.weixin.qq.com/s/DYmJnRrbrjqaKgHx7nWiSQ",
        ],
      });
      addJsonLd(head, {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteData.title,
        url: `${HOSTNAME}${BASE}`,
        description: siteData.description,
        inLanguage: "zh-CN",
      });
      addJsonLd(head, {
        "@context": "https://schema.org",
        "@type": "Course",
        "@id": `${HOSTNAME}/#course-crypto`,
        name: "加密创投教程",
        description:
          "面向大学生的加密货币与区块链教程，五章覆盖公链、实务安全、以太坊、链上金融与前沿创新。",
        provider: { "@type": "EducationalOrganization", name: "校园VC" },
        author: { "@id": `${HOSTNAME}/#founder` },
        inLanguage: "zh-CN",
        isAccessibleForFree: true,
        educationalLevel: "大学生",
        numberOfCredits: 5,
        url: `${HOSTNAME}${BASE}crypto-vc/start/chapter1-overview/`,
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: "P5L",
        },
      });
      addJsonLd(head, {
        "@context": "https://schema.org",
        "@type": "Course",
        "@id": `${HOSTNAME}/#course-digital`,
        name: "数字创业教程",
        description:
          "第十一期数创班公开教程，共五章：创业认知、AI 认知、产品实务、营销实务和资本实务。",
        provider: { "@type": "EducationalOrganization", name: "校园VC" },
        author: { "@id": `${HOSTNAME}/#founder` },
        inLanguage: "zh-CN",
        isAccessibleForFree: true,
        educationalLevel: "大学生",
        url: `${HOSTNAME}${BASE}digital-startup/`,
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
        },
      });
    }

    if (tutorialKey) {
      const tutorial = TUTORIAL_NAMES[tutorialKey];
      const crumbs = [
        { name: "首页", item: `${HOSTNAME}/` },
        { name: "教程站", item: `${HOSTNAME}${BASE}` },
        { name: tutorial.name, item: tutorial.url },
      ];
      crumbs.push({ name: title, item: canonicalUrl });
      addJsonLd(head, {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.name,
          item: c.item,
        })),
      });
    }

    const isCourseIndex =
      pageData.relativePath === "crypto-vc/index.md" ||
      pageData.relativePath === "digital-startup/index.md";
    if (isCourseIndex) {
      const isCrypto = pageData.relativePath === "crypto-vc/index.md";
      addJsonLd(head, {
        "@context": "https://schema.org",
        "@type": "Course",
        "@id": isCrypto
          ? `${HOSTNAME}/#course-crypto`
          : `${HOSTNAME}/#course-digital`,
        name: isCrypto ? "加密创投教程" : "数字创业教程",
        description: isCrypto
          ? "面向大学生的加密货币与区块链教程，五章覆盖公链、实务安全、以太坊、链上金融与前沿创新。"
          : "第十一期数创班公开教程，共五章：创业认知、AI 认知、产品实务、营销实务和资本实务。",
        provider: { "@type": "EducationalOrganization", name: "校园VC" },
        author: { "@id": `${HOSTNAME}/#founder` },
        inLanguage: "zh-CN",
        isAccessibleForFree: true,
        educationalLevel: "大学生",
        ...(isCrypto ? { numberOfCredits: 5 } : {}),
        url: isCrypto
          ? `${HOSTNAME}${BASE}crypto-vc/start/chapter1-overview/`
          : `${HOSTNAME}${BASE}digital-startup/`,
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          ...(isCrypto ? { courseWorkload: "P5L" } : {}),
        },
      });
    }

    if (tutorialKey && !isHome) {
      const courseId = TUTORIAL_NAMES[tutorialKey].courseId;
      const tags = pageData.frontmatter.tags as string[] | undefined;
      const datePublished = pageData.frontmatter.datePublished as
        | string
        | undefined;
      const dateModified = pageData.frontmatter.dateModified as
        | string
        | undefined;
      addJsonLd(head, {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        name: title,
        description,
        url: canonicalUrl,
        inLanguage: "zh-CN",
        learningResourceType: "lesson",
        educationalLevel: "大学生",
        isAccessibleForFree: true,
        isPartOf: { "@id": courseId },
        author: { "@id": `${HOSTNAME}/#founder` },
        publisher: {
          "@type": "Organization",
          name: "校园VC",
          logo: { "@type": "ImageObject", url: LOGO_URL },
        },
        ...(tags && tags.length > 0 ? { keywords: tags.join(", ") } : {}),
        ...(datePublished ? { datePublished } : {}),
        ...(dateModified ? { dateModified } : {}),
      });
    }

    return head;
  },

  themeConfig: {
    logo: "/campus-vc-logo.png",
    logoLink: "https://xiaoyuanvc.com",

    search: {
      provider: "local",
      options: {
        detailedView: true,
        miniSearch: {
          options: {
            tokenize: (text) => text.split(/[\s\-,.!?;:，。！？；：、]+/),
          },
        },
        translations: {
          button: {
            buttonText: "搜索文档",
            buttonAriaLabel: "搜索文档",
          },
          modal: {
            noResultsText: "无法找到相关结果",
            resetButtonTitle: "清除查询条件",
            footer: {
              selectText: "选择",
              navigateText: "切换",
              closeText: "关闭",
            },
          },
        },
      },
    },

    // 顶部导航已被自定义 Layout（theme/Layout.vue）替换为主站导航；
    // VitePress 默认 VPNav 通过 theme/style.css 隐藏。
    nav: [],

    sidebar: {
      "/crypto-vc/": [
        {
          text: "新版加密创投教程",
          collapsed: false,
          items: [
            {
              text: "教程总览",
              link: "/crypto-vc/",
            },
            {
              text: "第一章：公链与区块链基础",
              link: "/crypto-vc/start/chapter1-overview/",
            },
            {
              text: "第二章：实务、钱包与安全",
              link: "/crypto-vc/start/chapter2-overview/",
            },
            {
              text: "第三章：以太坊与二层网络",
              link: "/crypto-vc/advanced/chapter3-overview/",
            },
            {
              text: "第四章：稳定币、DeFi、RWA 与 NFT",
              link: "/crypto-vc/advanced/chapter4-overview/",
            },
            {
              text: "第五章：Perp DEX、预测市场与 Crypto AI",
              link: "/crypto-vc/advanced/chapter5-overview/",
            },
          ],
        },
      ],
      "/digital-startup/": [
        { text: "教程总览", link: "/digital-startup/" },
        { text: "第一章　创业认知", link: "/digital-startup/chapter-1" },
        { text: "第二章　AI 认知", link: "/digital-startup/chapter-2" },
        { text: "第三章　产品实务", link: "/digital-startup/chapter-3" },
        { text: "第四章　营销实务", link: "/digital-startup/chapter-4" },
        { text: "第五章　资本实务", link: "/digital-startup/chapter-5" },
      ],
    },
  },
});
