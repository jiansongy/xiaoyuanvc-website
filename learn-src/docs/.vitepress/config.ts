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
          "面向大学生的数字创业系统课程，涵盖创业认知、机会洞察、产品开发、营销增长、融资致胜五大模块，共5章34课。",
        provider: { "@type": "EducationalOrganization", name: "校园VC" },
        author: { "@id": `${HOSTNAME}/#founder` },
        inLanguage: "zh-CN",
        isAccessibleForFree: true,
        educationalLevel: "大学生",
        numberOfCredits: 34,
        url: `${HOSTNAME}${BASE}digital-startup/`,
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: "P34L",
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
          : "面向大学生的数字创业系统课程，涵盖创业认知、机会洞察、产品开发、营销增长、融资致胜五大模块，共5章34课。",
        provider: { "@type": "EducationalOrganization", name: "校园VC" },
        author: { "@id": `${HOSTNAME}/#founder` },
        inLanguage: "zh-CN",
        isAccessibleForFree: true,
        educationalLevel: "大学生",
        numberOfCredits: isCrypto ? 5 : 34,
        url: isCrypto
          ? `${HOSTNAME}${BASE}crypto-vc/start/chapter1-overview/`
          : `${HOSTNAME}${BASE}digital-startup/`,
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: isCrypto ? "P5L" : "P34L",
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
        {
          text: "第一章 数字创业认知",
          link: "/digital-startup/chapter-1",
          collapsed: true,
          items: [
            { text: "数创班的源起", link: "/digital-startup/chapter-1#数创班的源起" },
            { text: "数字创业的定义", link: "/digital-startup/chapter-1#数字创业的定义" },
            { text: "数创班的师生约定", link: "/digital-startup/chapter-1#数创班的师生约定" },
            { text: "做有手艺的创业者", link: "/digital-startup/chapter-1#做有手艺的创业者" },
            { text: "长期饭票来自于手艺", link: "/digital-startup/chapter-1#长期饭票来自于手艺" },
            { text: "如何学数字创业？", link: "/digital-startup/chapter-1#如何学数字创业" },
            { text: "人工智能带来脑力大爆发", link: "/digital-startup/chapter-1#人工智能带来脑力大爆发" },
            { text: "从聊天机器人到编程智能体", link: "/digital-startup/chapter-1#从聊天机器人到编程智能体" },
            { text: "对国内用户友好的编程智能体", link: "/digital-startup/chapter-1#对国内用户友好的编程智能体" },
            { text: "了解 AI 应用的全景图谱", link: "/digital-startup/chapter-1#了解-ai-应用的全景图谱" },
            { text: "太多新概念和术语怎么办？", link: "/digital-startup/chapter-1#太多新概念和术语怎么办" },
            { text: "结业证书和优秀学员证书", link: "/digital-startup/chapter-1#结业证书和优秀学员证书" },
          ],
        },
        {
          text: "第二章 数创机会洞察",
          link: "/digital-startup/chapter-2",
          collapsed: true,
          items: [
            { text: "第一节 行动胜于一切", link: "/digital-startup/chapter-2#第一节-行动胜于一切" },
            { text: "第二节 效果逻辑，五大原则", link: "/digital-startup/chapter-2#第二节-效果逻辑-五大原则" },
            { text: "第三节 精益创业，五个阶段", link: "/digital-startup/chapter-2#第三节-精益创业-五个阶段" },
            { text: "1、极简创业方法论", link: "/digital-startup/chapter-2#_1、极简创业方法论" },
            { text: "2、谷歌软件开发工具", link: "/digital-startup/chapter-2#_2、谷歌软件开发工具" },
            { text: "3、腾讯 CodeBuddy", link: "/digital-startup/chapter-2#_3、腾讯-codebuddy" },
            { text: "案例：课程笔记二手交易群", link: "/digital-startup/chapter-2#【案例-课程笔记二手交易群】" },
          ],
        },
        {
          text: "第三章 数字产品开发",
          link: "/digital-startup/chapter-3",
          collapsed: true,
          items: [
            { text: "创业是空白考卷", link: "/digital-startup/chapter-3#创业是空白考卷" },
            { text: "创业早期目标是 PMF", link: "/digital-startup/chapter-3#创业早期目标是-pmf" },
            { text: "妈妈测试 The Mom Test", link: "/digital-startup/chapter-3#妈妈测试-the-mom-test" },
            { text: "梁宁的产品思维", link: "/digital-startup/chapter-3#梁宁的产品思维" },
            { text: "产品经理面试题", link: "/digital-startup/chapter-3#产品经理面试题" },
            { text: "需求分析的Y模型", link: "/digital-startup/chapter-3#需求分析的y模型" },
            { text: "RICE 决策模型", link: "/digital-startup/chapter-3#rice-决策模型" },
            { text: "脑暴相当于\"别冲动装修\"", link: "/digital-startup/chapter-3#脑暴相当于-别冲动装修" },
            { text: "终端软件入门", link: "/digital-startup/chapter-3#终端软件-俗称-黑窗-入门" },
            { text: "Claude Code 接入智谱大脑", link: "/digital-startup/chapter-3#claude-code-接入智谱大脑" },
            { text: "备用方案之一：OpenCode", link: "/digital-startup/chapter-3#备用方案之一-opencode" },
            { text: "备用方案之二：CodeBuddy 的 CLI", link: "/digital-startup/chapter-3#备用方案之二-codebuddy-的-cli" },
          ],
        },
        {
          text: "第四章 营销增长实战",
          link: "/digital-startup/chapter-4",
          collapsed: true,
          items: [
            { text: "止疼药还是维生素", link: "/digital-startup/chapter-4#止疼药还是维生素" },
            { text: "从用户的挣扎时刻开始", link: "/digital-startup/chapter-4#从用户的挣扎时刻开始" },
            { text: "差异化 = 主动放弃一些人", link: "/digital-startup/chapter-4#差异化-主动放弃一些人" },
            { text: "品牌三问", link: "/digital-startup/chapter-4#品牌三问——一句话说清楚你是谁" },
            { text: "最简版 MVP 先跑起来", link: "/digital-startup/chapter-4#最简版-mvp-先跑起来" },
            { text: "真人发声 > 品牌账号", link: "/digital-startup/chapter-4#真人发声-品牌账号" },
            { text: "坚持发布 > 精品内容", link: "/digital-startup/chapter-4#坚持发布-精品内容" },
            { text: "用户主角法则", link: "/digital-startup/chapter-4#用户主角法则——你是向导-用户才是英雄" },
            { text: "问题故事 > 成功故事", link: "/digital-startup/chapter-4#问题故事-成功故事" },
            { text: "故事钩子", link: "/digital-startup/chapter-4#故事钩子——开头三句话决定生死" },
            { text: "打造个人品牌 4 步法", link: "/digital-startup/chapter-4#打造个人品牌-4-步法" },
            { text: "AARRR 简化版", link: "/digital-startup/chapter-4#aarrr-简化版——理解增长的全链路" },
            { text: "1000 真粉丝", link: "/digital-startup/chapter-4#_1000-真粉丝——不需要百万粉丝" },
            { text: "先从最活跃的 20 人开始", link: "/digital-startup/chapter-4#先从最活跃的-20-人开始" },
            { text: "Aha 时刻", link: "/digital-startup/chapter-4#aha-时刻——让用户尽快感受到价值" },
            { text: "福格行为模型", link: "/digital-startup/chapter-4#福格行为模型——让用户更容易做那件事" },
            { text: "找到分享元素", link: "/digital-startup/chapter-4#找到分享元素——让用户自发传播" },
          ],
        },
        {
          text: "第五章 融资致胜法则",
          link: "/digital-startup/chapter-5",
          collapsed: true,
          items: [
            { text: "风险投资是干什么的", link: "/digital-startup/chapter-5#风险投资是干什么的" },
            { text: "融资的三个早期阶段", link: "/digital-startup/chapter-5#融资的三个早期阶段" },
            { text: "投资股权而非债权", link: "/digital-startup/chapter-5#投资股权而非债权" },
            { text: "真相 1：融资是有代价的", link: "/digital-startup/chapter-5#真相-1-融资是有代价的" },
            { text: "真相 2：先找用户再找投资人", link: "/digital-startup/chapter-5#真相-2-先找用户-再找投资人" },
            { text: "抢答题", link: "/digital-startup/chapter-5#抢答题" },
            { text: "真相 1：大多数项目会失败", link: "/digital-startup/chapter-5#真相-1-大多数项目会失败-投资人知道这一点" },
            { text: "真相 2：早期最重要的是团队", link: "/digital-startup/chapter-5#真相-2-早期最重要的是团队-不是商业模式" },
            { text: "真相 3：一开始看起来很普通", link: "/digital-startup/chapter-5#真相-3-最终表现好的-往往一开始看起来很普通" },
            { text: "讲述逻辑", link: "/digital-startup/chapter-5#讲述逻辑" },
            { text: "融资叙事的技能", link: "/digital-startup/chapter-5#融资叙事的技能" },
            { text: "课堂练习（10 分钟）", link: "/digital-startup/chapter-5#课堂练习-10-分钟" },
            { text: "镜子游戏（标准 4 步）", link: "/digital-startup/chapter-5#镜子游戏-标准-4-步" },
            { text: "尖锐提问的例子", link: "/digital-startup/chapter-5#尖锐提问的例子" },
          ],
        },
      ],
    },
  },
});
