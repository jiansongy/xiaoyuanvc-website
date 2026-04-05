/**
 * 中国行业AI创业机会探索器 — 行业数据
 * 12 industries × 4 categories
 * Each industry: painPoints → solutions → stacks → validation
 */
window.AI_OPPORTUNITY_DATA = {
  version: 1,

  categories: [
    {
      id: "content",
      name: "内容与创作经济",
      desc: 'AI 替代"内容生产"环节',
      icon: "✏️",
      color: "#f97316",
      industryIds: ["creator", "mcn", "xhs-seller"],
    },
    {
      id: "ecommerce",
      name: "电商与贸易",
      desc: 'AI 替代"选品+客服"环节',
      icon: "🛒",
      color: "#10b981",
      industryIds: ["cross-border", "ecom-agency"],
    },
    {
      id: "local",
      name: "本地生活商家",
      desc: 'AI 替代"运营触达"环节',
      icon: "🏪",
      color: "#2563eb",
      industryIds: [
        "local-merchant",
        "home-service",
        "student-housing",
        "edu-training",
      ],
    },
    {
      id: "campus",
      name: "校园与职业服务",
      desc: 'AI 替代"管理流程"环节',
      icon: "🎓",
      color: "#8b5cf6",
      industryIds: ["campus-service", "hr-recruit", "study-abroad"],
    },
  ],

  industries: {
    /* ═══════════════════════════════════════════
       A · 内容与创作经济
       ═══════════════════════════════════════════ */
    creator: {
      id: "creator",
      name: "垂直创作者 / 自媒体",
      categoryId: "content",
      summary: '帮创作者从"靠感觉做内容"变成"用数据做生意"',
      tags: ["入门最低", "1周出Demo", "工具栈最简"],
      feasibility: 5,
      painPoints: [
        {
          id: "cold-start",
          title: "不知道做什么内容，无法稳定产出",
          severity: "high",
          symptoms: [
            "找不到适合自己的细分定位",
            "选题靠灵感，断档就停更",
            "一个人写+拍+剪太慢，发不起来",
          ],
          interviewQ: [
            "你尝试过做内容吗？卡在哪一步？",
            "如果有人帮你解决一个环节，你最希望是哪个？",
          ],
          solutions: [
            {
              id: "content-kickstart",
              title: "AI 选题+内容生产工作流",
              desc: "分析目标领域的爆款规律，自动生成选题日历、脚本大纲、封面文案",
              input: ["目标领域关键词", "竞品账号链接"],
              output: ["30天选题日历", "脚本模板", "封面图+标题建议"],
              stacks: ["Coze", "DeepSeek API", "即梦(封面)"],
              difficulty: "低",
              antiPattern:
                '不要做"全自动发布"，做"选题+初稿生成"，创作者自己把关质量',
              modeNotes: {
                student:
                  "找 3 个想做自媒体但还没开始的同学，免费帮他们规划第一周内容",
                teacher:
                  "内容创业课实训：从定位分析→选题策划→AI辅助生产的全流程",
              },
            },
          ],
          toolStack: [
            { name: "Coze", platform: "coze.cn", price: "免费", useCase: "搭建选题生成 AI 工作流" },
            { name: "DeepSeek API", platform: "deepseek.com", price: "低价", useCase: "生成脚本大纲与文案初稿" },
            { name: "即梦", platform: "jimeng.jianying.com", price: "免费/付费", useCase: "AI 生成封面图与配图" },
          ],
        },
        {
          id: "monetization",
          title: "有内容/粉丝但变现难",
          severity: "medium",
          symptoms: [
            "广告收入波动大，粉丝量涨但收入不涨",
            "不知道卖什么给粉丝",
            "多平台分发重复劳动，时间都花在发内容而不是做内容上",
          ],
          interviewQ: [
            "你现在的收入来源是什么？",
            "有多少粉丝主动问你买过东西？",
          ],
          solutions: [
            {
              id: "fan-to-private",
              title: "AI 粉丝变现+分发提效组合",
              desc: "自动识别高意向粉丝引导到私域，同时一键适配多平台内容格式",
              input: ["评论区互动数据", "原始文案/视频"],
              output: ["高意向粉丝名单", "私域引导话术", "多平台适配内容"],
              stacks: ["Coze", "企业微信", "n8n"],
              difficulty: "低",
              antiPattern:
                '不要做"通用聊天机器人"，要做"精准变现路径+省时分发"',
              modeNotes: {
                student: "先找 3 个千粉以上创作者免费试用，跑通 1 个案例",
                teacher: "适合内容营销课实训：粉丝画像→变现路径设计",
              },
            },
          ],
          toolStack: [
            { name: "Coze", platform: "coze.cn", price: "免费", useCase: "搭建粉丝引导私域工作流" },
            { name: "企业微信", platform: "work.weixin.qq.com", price: "免费", useCase: "私域客户沉淀与管理" },
            { name: "n8n", platform: "n8n.io", price: "免费/付费", useCase: "多平台内容一键分发" },
          ],
        },
      ],
      validation: {
        target: "3 个刚起步 + 3 个千粉以上的垂直创作者",
        day1: "在小红书/B站找 5 个目标创作者 + 身边 5 个想做自媒体的同学",
        day3: "完成 3 个访谈，确认冷启动和变现哪个更痛",
        day7: "用 Coze 搭建选题生成 MVP，让 1 个创作者实际使用 3 天",
        successSignal: '创作者愿意继续用，主动问"能不能加功能"',
        failSignal: '创作者觉得"我手动做也一样快"',
      },
    },

    mcn: {
      id: "mcn",
      name: "直播电商 / MCN 小团队",
      categoryId: "content",
      summary: "帮直播团队从冷启动到合规运营全链路提效",
      tags: ["合规刚需", "数据驱动", "市场增长快"],
      feasibility: 4,
      painPoints: [
        {
          id: "cold-start",
          title: "新团队冷启动，不知道怎么开有效直播",
          severity: "high",
          symptoms: [
            "不知道选什么品、怎么定价",
            "第一场直播没人看，不知道怎么引流",
            "话术不熟练，互动冷场",
          ],
          interviewQ: [
            "你们团队做过几场直播？最大的卡点是什么？",
            "如果有人帮你策划前 3 场直播，你愿意试吗？",
          ],
          solutions: [
            {
              id: "live-kickstart",
              title: "AI 直播策划+选品助手",
              desc: "分析目标品类的爆款直播间，自动生成选品建议、话术脚本、开播流程",
              input: ["目标品类", "竞品直播间链接"],
              output: ["选品推荐表", "开播话术脚本", "前3场排期计划"],
              stacks: ["DeepSeek API", "Coze", "飞书文档"],
              difficulty: "中",
              antiPattern:
                '不要追求"一场爆"，帮团队跑通"选品→开播→复盘"的最小循环',
              modeNotes: {
                student:
                  "找 3 个想做直播但还没开始的小团队，免费帮他们策划前 3 场",
                teacher: '直播运营课实训：从0到1的"首播策划"全流程',
              },
            },
          ],
          toolStack: [
            { name: "DeepSeek API", platform: "deepseek.com", price: "低价", useCase: "选品分析与话术脚本生成" },
            { name: "Coze", platform: "coze.cn", price: "免费", useCase: "搭建直播策划 AI 助手" },
            { name: "飞书文档", platform: "feishu.cn", price: "免费", useCase: "策划方案协作与存档" },
          ],
        },
        {
          id: "compliance-review",
          title: "直播合规压力大，复盘低效",
          severity: "medium",
          symptoms: [
            "不确定哪些话术违规，被平台处罚过",
            "人工复盘超 2 小时，结论难落地",
            "数据散落在多个后台，看不出规律",
          ],
          interviewQ: [
            "过去半年被平台警告或处罚过几次？",
            "每场直播后复盘花多长时间？",
          ],
          solutions: [
            {
              id: "compliance-checker",
              title: "AI 合规检测+自动复盘",
              desc: "录播后扫描话术标记违规风险，同时生成结构化复盘报告",
              input: ["直播录音/文字稿", "平台违规词库", "直播数据导出"],
              output: [
                "风险词高亮报告",
                "合规修改建议",
                "关键指标对比+改进建议",
              ],
              stacks: ["通义听悟(转录)", "DeepSeek API", "飞书多维表格"],
              difficulty: "中",
              antiPattern:
                '不要做实时打断（技术难度太高），先做"录播审查+复盘报告"二合一',
              modeNotes: {
                student: "先收集 50 条真实违规案例建知识库，帮 1 个团队做 3 场",
                teacher: '"数字营销合规"课程+数据分析课联合实训',
              },
            },
          ],
          toolStack: [
            { name: "通义听悟", platform: "tingwu.aliyun.com", price: "免费/付费", useCase: "直播录音自动转文字" },
            { name: "DeepSeek API", platform: "deepseek.com", price: "低价", useCase: "违规话术检测与标记" },
            { name: "飞书多维表格", platform: "feishu.cn", price: "免费", useCase: "复盘数据整理与报告" },
          ],
        },
      ],
      validation: {
        target: "3 个刚起步 + 3 个已在播的直播小团队",
        day1: "在抖音/快手找本地直播团队 + 学校里想做直播的同学",
        day3: "帮 1 个新团队策划首播方案，帮 1 个老团队做合规审查",
        day7: "用 Coze+通义听悟搭建半自动流程，各跑 1 场验证",
        successSignal: "团队主动发来下一场录播让你审，或约你策划下场",
        failSignal: '觉得"我们自己看回放就行"或"还不想开播"',
      },
    },

    "xhs-seller": {
      id: "xhs-seller",
      name: "小红书知识 / 服务型卖家",
      categoryId: "content",
      summary: "帮小红书上卖服务的人从起步获客到高效成交",
      tags: ["私信痛点强", "转化率可测", "学生易接触"],
      feasibility: 5,
      painPoints: [
        {
          id: "cold-start",
          title: "想在小红书卖服务，但不知道怎么起步获客",
          severity: "high",
          symptoms: [
            "发了笔记但没人咨询",
            "不知道怎么写能引来精准客户的内容",
            "同行都在做，不知道怎么差异化",
          ],
          interviewQ: [
            "你在小红书上发过几篇笔记？有人来咨询过吗？",
            "你觉得最难的是写内容还是转化客户？",
          ],
          solutions: [
            {
              id: "xhs-content-engine",
              title: "AI 获客内容策划助手",
              desc: "分析同类博主的爆款笔记，自动生成引流内容模板和发布计划",
              input: ["服务类型关键词", "竞品博主链接"],
              output: [
                "30天内容日历",
                "引流笔记模板(图文+标题+标签)",
                "评论区钩子话术",
              ],
              stacks: ["Coze", "DeepSeek API", "即梦(配图)"],
              difficulty: "低",
              antiPattern:
                '不要追求"篇篇爆款"，先跑通"发内容→有人问→成交1单"的最小闭环',
              modeNotes: {
                student:
                  "找 3 个想在小红书卖服务但还没起步的同学/博主，免费帮他们做内容规划",
                teacher: "新媒体营销课实训：从0到1的小红书获客全流程",
              },
            },
          ],
          toolStack: [
            { name: "Coze", platform: "coze.cn", price: "免费", useCase: "自动生成引流笔记内容" },
            { name: "DeepSeek API", platform: "deepseek.com", price: "低价", useCase: "爆款文案分析与生成" },
            { name: "即梦", platform: "jimeng.jianying.com", price: "免费/付费", useCase: "AI 生成笔记配图" },
          ],
        },
        {
          id: "dm-overload",
          title: "咨询量上来了，但回复不过来、转化靠感觉",
          severity: "medium",
          symptoms: [
            "重复问题每天回几十遍",
            "回复慢导致客户流失",
            "不知道哪个话术转化率高",
          ],
          interviewQ: [
            "每天花多少时间回私信？",
            "估计有多少咨询因为回复慢丢掉了？",
          ],
          solutions: [
            {
              id: "xhs-auto-reply",
              title: "AI 私信分类+转化追踪",
              desc: "高频问题自动回复，复杂问题转人工；同时记录咨询数据生成转化漏斗",
              input: ["历史私信记录", "FAQ 知识库", "报价表"],
              output: ["自动回复模板", "客户意向分级", "转化漏斗+最佳话术排行"],
              stacks: ["Coze", "飞书多维表格", "企业微信"],
              difficulty: "低",
              antiPattern:
                '不要做"完全自动回复"（容易答非所问），做"分类+模板+数据沉淀"',
              modeNotes: {
                student:
                  "找 3 个已有咨询量的博主（塔罗/留学/穿搭），免费帮他们搭建",
                teacher: "客户服务自动化课：从人工→半自动→数据驱动的演进",
              },
            },
          ],
          toolStack: [
            { name: "Coze", platform: "coze.cn", price: "免费", useCase: "私信分类辅助与模板回复建议" },
            { name: "飞书多维表格", platform: "feishu.cn", price: "免费", useCase: "咨询转化数据追踪" },
            { name: "企业微信", platform: "work.weixin.qq.com", price: "免费", useCase: "客户意向分级管理" },
          ],
        },
      ],
      validation: {
        target: "3 个想起步 + 3 个已有咨询量的小红书服务型博主",
        day1: '在小红书搜索"接单""咨询"类博主 + 找身边想做的同学',
        day3: "帮 1 个新博主做内容规划，帮 1 个老博主整理 FAQ",
        day7: "新博主发出前 3 篇引流笔记；老博主搭建 Coze 自动回复实测 3 天",
        successSignal: '新博主收到第一条咨询；老博主说"少丢了好几个客户"',
        failSignal: '新博主发了没人看；老博主觉得"自动回复太机械"',
      },
    },

    /* ═══════════════════════════════════════════
       B · 电商与贸易
       ═══════════════════════════════════════════ */
    "cross-border": {
      id: "cross-border",
      name: "跨境微型卖家（1-2 人团队）",
      categoryId: "ecommerce",
      summary: "帮宿舍级跨境小卖家用 AI 对抗大卖家的团队优势",
      tags: ["利润可测", "工具成熟", "义乌/广深优势"],
      feasibility: 4,
      painPoints: [
        {
          id: "product-selection",
          title: "选品靠经验，试错成本高",
          severity: "high",
          symptoms: [
            "选错品积压库存",
            "不知道什么在海外卖得好",
            "大卖家有数据工具，小卖家靠直觉",
          ],
          interviewQ: ["上一次选品失败亏了多少？", "你怎么决定卖什么？"],
          solutions: [
            {
              id: "ai-product-scout",
              title: "AI 选品分析助手",
              desc: "分析目标市场评论、趋势、竞品，输出选品建议和风险评估",
              input: ["目标市场关键词", "竞品链接", "1688 供应商数据"],
              output: ["选品评分卡", "竞品对比表", "利润空间估算"],
              stacks: ["DeepSeek API", "1688 AI选品", "飞书多维表格"],
              difficulty: "中",
              antiPattern: '不要追求"全自动选品"，做"辅助决策+数据支撑"',
              modeNotes: {
                student: "先帮 1 个卖家分析 3 个品类，用数据说服他选哪个",
                teacher: "国际贸易课实训：市场调研→数据分析→决策",
              },
            },
          ],
          toolStack: [
            { name: "DeepSeek API", platform: "deepseek.com", price: "低价", useCase: "竞品评论分析与选品报告" },
            { name: "1688 AI选品", platform: "1688.com", price: "免费", useCase: "供应商数据与货源匹配" },
            { name: "飞书多维表格", platform: "feishu.cn", price: "免费", useCase: "选品评分卡管理" },
          ],
        },
        {
          id: "listing-labor",
          title: "多语言 Listing 写作耗时",
          severity: "medium",
          symptoms: [
            "英文标题/描述靠翻译软件",
            "不了解当地买家搜索习惯",
            "SEO 关键词不会做",
          ],
          interviewQ: [
            "写一个产品 Listing 要多久？",
            "有没有因为 Listing 质量差影响销量？",
          ],
          solutions: [
            {
              id: "listing-gen",
              title: "AI Listing 批量生成器",
              desc: "输入产品信息和目标市场，自动生成本地化标题、描述、关键词",
              input: ["产品参数", "目标市场/语言", "竞品 Listing 参考"],
              output: ["SEO 优化标题", "多语言产品描述", "关键词列表"],
              stacks: ["DeepSeek API", "Coze 工作流", "飞书文档"],
              difficulty: "低",
              antiPattern:
                '不要只是翻译，要做"本地化改写"（语气、卖点、搜索习惯）',
              modeNotes: {
                student:
                  '做一个"输入中文产品信息→输出英语+西语+日语 Listing"的工具',
                teacher: "跨文化商务沟通课+AI 工具应用",
              },
            },
          ],
          toolStack: [
            { name: "DeepSeek API", platform: "deepseek.com", price: "低价", useCase: "多语言 Listing 本地化改写" },
            { name: "Coze", platform: "coze.cn", price: "免费", useCase: "批量 Listing 生成工作流" },
            { name: "飞书文档", platform: "feishu.cn", price: "免费", useCase: "Listing 模板存档与协作" },
          ],
        },
      ],
      validation: {
        target: "5 个做 TikTok Shop / Amazon / Shopee 的小卖家",
        day1: "在 1688 跨境圈或学校创业社找卖家",
        day3: "帮 1 个卖家做 3 个品的选品分析报告",
        day7: "搭建 Listing 生成工具，批量生成 10 个产品的多语言 Listing",
        successSignal: '卖家说"比我自己写的转化率高"或"省了我 2 天的工作"',
        failSignal: "生成的内容需要大量人工修改",
      },
    },

    "ecom-agency": {
      id: "ecom-agency",
      name: "电商代运营小团队",
      categoryId: "ecommerce",
      summary: "帮代运营团队从签下第一个客户到高效交付",
      tags: ["客户报告刚需", "ROI 可算", "内容产出重复"],
      feasibility: 3,
      painPoints: [
        {
          id: "cold-start",
          title: "没有案例，签不到第一个付费客户",
          severity: "high",
          symptoms: [
            "客户问'有什么成功案例'答不上来",
            "提案/方案写得慢，不够专业",
            "不知道怎么证明自己有能力",
          ],
          interviewQ: [
            "你们现在有几个付费客户？怎么签下来的？",
            "写一份投放方案要多久？",
          ],
          solutions: [
            {
              id: "proposal-gen",
              title: "AI 提案+案例包装助手",
              desc: "输入客户行业和目标，自动生成专业投放方案；用公开数据包装模拟案例",
              input: ["客户行业/产品", "投放预算", "竞品数据"],
              output: ["投放方案 PPT", "竞品分析报告", "模拟 ROI 预测"],
              stacks: ["DeepSeek API", "Coze", "飞书文档"],
              difficulty: "中",
              antiPattern:
                '不要编造虚假案例，用"行业公开数据+你的方法论"来建立信任',
              modeNotes: {
                student:
                  "先免费帮 1 个小品牌做 2 周投放，用真实数据当第一个案例",
                teacher: "数字营销课：从0到1搭建代运营业务的全流程",
              },
            },
          ],
          toolStack: [
            { name: "DeepSeek API", platform: "deepseek.com", price: "低价", useCase: "自动生成投放方案与竞品分析" },
            { name: "Coze", platform: "coze.cn", price: "免费", useCase: "方案模板生成与输出" },
            { name: "飞书文档", platform: "feishu.cn", price: "免费", useCase: "提案文档协作与发送" },
          ],
        },
        {
          id: "delivery-overload",
          title: "客户报告耗时，素材创意跟不上消耗",
          severity: "medium",
          symptoms: [
            "每周从 4+ 平台导数据做报告，耗时 5-10 小时",
            "同一产品要做几十张图，文案越写越重复",
            '客户要求"再换个风格"，创意枯竭',
          ],
          interviewQ: [
            "每周花多少时间做客户报告？",
            "一个月要产出多少张素材？",
          ],
          solutions: [
            {
              id: "delivery-automation",
              title: "AI 报告生成+素材批量流水线",
              desc: "自动生成带洞察的周报月报；批量生成多风格图文和短视频脚本变体",
              input: ["各平台数据导出", "产品图片", "品牌调性"],
              output: [
                "自动化周报/月报",
                "多风格文案变体",
                "封面图+短视频分镜",
              ],
              stacks: ["Dify 工作流", "即梦(图)", "DeepSeek(文)"],
              difficulty: "中",
              antiPattern:
                '不要追求全自动（数据源和品牌调性变化快），做"AI 初稿+人工审核"',
              modeNotes: {
                student:
                  "先用飞书表格+AI公式做 1 个客户的报告模板，同时批量生成 20 条素材",
                teacher: "广告创意课+数据分析课联合实训",
              },
            },
          ],
          toolStack: [
            { name: "Dify", platform: "cloud.dify.ai", price: "免费/付费", useCase: "自动化周报与月报生成" },
            { name: "即梦", platform: "jimeng.jianying.com", price: "免费/付费", useCase: "多风格素材批量生成" },
            { name: "DeepSeek API", platform: "deepseek.com", price: "低价", useCase: "文案多版本变体生成" },
          ],
        },
      ],
      validation: {
        target: "3 个刚起步 + 3 个已有客户的代运营小团队",
        day1: "通过创业社/电商园区找代运营团队 + 想做代运营的同学",
        day3: "帮 1 个新团队写投放方案，帮 1 个老团队做 1 份自动化周报",
        day7: "新团队用方案去谈客户；老团队跑通报告+素材自动化流程",
        successSignal: '新团队签下第一个客户；老团队说"每周省了 5 小时"',
        failSignal: "方案不够说服力，或数据源对接太复杂",
      },
    },

    /* ═══════════════════════════════════════════
       C · 本地生活商家
       ═══════════════════════════════════════════ */
    "local-merchant": {
      id: "local-merchant",
      name: "本地消费商家",
      categoryId: "local",
      summary: "帮美容/宠物/健身/茶饮/服饰店用 AI 做私域运营",
      tags: ["校园周边可访谈", "痛点普遍", "企微生态成熟"],
      feasibility: 4,
      painPoints: [
        {
          id: "repurchase-manual",
          title: "客户复购全靠老板记忆",
          severity: "high",
          symptoms: [
            "老客户流失没人管",
            "群发广告被屏蔽",
            "不知道哪些客户该重点维护",
          ],
          interviewQ: ["你怎么联系老客户？", "上次做促销活动有多少老客回来？"],
          solutions: [
            {
              id: "smart-crm",
              title: "AI 客户分层唤醒系统",
              desc: "按消费频次/金额自动分层，不同层级触发不同唤醒策略",
              input: ["客户消费记录", "企微好友列表"],
              output: ["客户分层标签", "个性化唤醒话术", "最佳触达时间"],
              stacks: ["企业微信", "Coze", "飞书多维表格"],
              difficulty: "低",
              antiPattern: '不要做"群发促销"（会被拉黑），做"精准个人化触达"',
              modeNotes: {
                student: "先帮 1 家店手动梳理 100 个客户数据，做出分层表",
                teacher: "CRM 课程实训：客户生命周期管理+AI自动化",
              },
            },
          ],
          toolStack: [
            { name: "企业微信", platform: "work.weixin.qq.com", price: "免费", useCase: "客户分层标签与触达管理" },
            { name: "Coze", platform: "coze.cn", price: "免费", useCase: "个性化唤醒话术自动生成" },
            { name: "飞书多维表格", platform: "feishu.cn", price: "免费", useCase: "客户消费数据分析" },
          ],
        },
        {
          id: "content-creation",
          title: "不会做线上内容/种草",
          severity: "medium",
          symptoms: [
            "知道要发小红书但不会写",
            "拍了照片不知道怎么配文",
            "没时间经营线上",
          ],
          interviewQ: ["现在做线上推广吗？", "最大的障碍是什么？"],
          solutions: [
            {
              id: "merchant-content",
              title: "AI 店铺种草内容生成",
              desc: "拍一张照片，AI 自动生成小红书/大众点评风格的种草文案",
              input: ["产品/环境照片", "店铺特色关键词"],
              output: ["小红书图文", "大众点评好评引导", "朋友圈文案"],
              stacks: ["Coze", "即梦", "通义千问"],
              difficulty: "低",
              antiPattern:
                '不要追求"高级文案"，商家需要的是"能发就行，比没有强"',
              modeNotes: {
                student: "帮校园周边 5 家店各生成 3 条小红书笔记，跟踪数据",
                teacher: "新媒体营销课：本地商家数字化推广实战",
              },
            },
          ],
          toolStack: [
            { name: "Coze", platform: "coze.cn", price: "免费", useCase: "一键生成种草文案" },
            { name: "即梦", platform: "jimeng.jianying.com", price: "免费/付费", useCase: "产品照片 AI 美化与配图" },
            { name: "通义千问", platform: "tongyi.aliyun.com", price: "免费", useCase: "文案优化与多平台适配" },
          ],
        },
      ],
      validation: {
        target: "5 家校园周边的消费类商家",
        day1: "走访校园周边商家，找到用企微管客户的店",
        day3: "帮 1 家店梳理客户数据，做出第一版分层表",
        day7: "设置 3 条自动唤醒规则（生日、30天未到店、会员到期），观察效果",
        successSignal: '店主说"有 3 个老客户真的回来了"',
        failSignal: '店主觉得"太麻烦了，我还是发朋友圈吧"',
      },
    },

    "home-service": {
      id: "home-service",
      name: "家政 / 本地上门服务",
      categoryId: "local",
      summary: "帮保洁/维修/搬家团队降低获客成本、提升调度效率",
      tags: ["碎片化严重", "调度痛点强", "获客成本高"],
      feasibility: 4,
      painPoints: [
        {
          id: "lead-cost",
          title: "依赖 58/美团获客，抽成太高",
          severity: "high",
          symptoms: [
            "平台抽成 15-30%",
            "获客成本持续上升",
            "客户用完就走，沉淀不下来",
          ],
          interviewQ: ["每个月在平台上花多少钱获客？", "有多少客户是回头客？"],
          solutions: [
            {
              id: "private-lead",
              title: "AI 私域获客+复购系统",
              desc: "服务完成后自动引导加企微，AI 定期推送保养提醒和优惠",
              input: ["服务记录", "客户联系方式"],
              output: ["自动加好友引导", "定期保养提醒", "复购优惠推送"],
              stacks: ["企业微信", "Coze", "飞书多维表格"],
              difficulty: "低",
              antiPattern: '不要做"取代平台"，做"服务后沉淀到私域"',
              modeNotes: {
                student: '先帮 1 家保洁公司设计"服务后扫码加微信"流程',
                teacher: "服务营销课：获客成本分析+私域搭建",
              },
            },
          ],
          toolStack: [
            { name: "企业微信", platform: "work.weixin.qq.com", price: "免费", useCase: "服务后客户私域沉淀" },
            { name: "Coze", platform: "coze.cn", price: "免费", useCase: "定期保养提醒自动推送" },
            { name: "飞书多维表格", platform: "feishu.cn", price: "免费", useCase: "客户服务记录与复购追踪" },
          ],
        },
        {
          id: "dispatch-chaos",
          title: "调度排班靠电话和微信群",
          severity: "medium",
          symptoms: [
            "师傅空跑或撞单",
            "客户约了时间没人来",
            "临时取消调度混乱",
          ],
          interviewQ: ["师傅的排班怎么管的？", "一个月有几次撞单或空跑？"],
          solutions: [
            {
              id: "smart-dispatch",
              title: "AI 智能调度助手",
              desc: "根据师傅位置、技能、空闲时段自动匹配订单",
              input: ["订单信息", "师傅位置/技能/空闲"],
              output: ["最优派单方案", "路线规划", "客户通知"],
              stacks: ["飞书多维表格", "Coze", "高德地图API"],
              difficulty: "中",
              antiPattern: "初期用飞书表格+简单规则就够，不需要做完整 SaaS",
              modeNotes: {
                student: "先用飞书表格做调度表，手动帮 1 家公司优化 1 周排班",
                teacher: "运营管理课：调度优化问题+AI辅助决策",
              },
            },
          ],
          toolStack: [
            { name: "飞书多维表格", platform: "feishu.cn", price: "免费", useCase: "师傅排班与订单管理" },
            { name: "Coze", platform: "coze.cn", price: "免费", useCase: "智能派单逻辑与客户通知" },
            { name: "高德地图API", platform: "lbs.amap.com", price: "免费/付费", useCase: "师傅位置与最优路线规划" },
          ],
        },
      ],
      validation: {
        target: "3 家本地家政/保洁/维修公司",
        day1: "在 58 同城找本地家政公司，电话约访",
        day3: "帮 1 家公司统计获客成本和复购率",
        day7: '设计"服务后加企微→自动保养提醒"流程并试跑',
        successSignal: "1 周内新增 20+ 企微好友，有 3 个复购",
        failSignal: "师傅不配合扫码流程，客户不愿加微信",
      },
    },

    "student-housing": {
      id: "student-housing",
      name: "学生住房 / 短租公寓",
      categoryId: "local",
      summary: "帮校园周边租房中介/公寓自动处理咨询和带看",
      tags: ["校园最近", "FAQ重复度高", "可快速验证"],
      feasibility: 5,
      painPoints: [
        {
          id: "faq-repeat",
          title: "租房咨询重复率极高",
          severity: "high",
          symptoms: [
            '"多少钱""有空调吗""能短租吗"反复回答',
            "高峰期漏回咨询",
            "同一问题每天回 50 次",
          ],
          interviewQ: [
            "每天花多少时间回复租房咨询？",
            "最常被问的 5 个问题是什么？",
          ],
          solutions: [
            {
              id: "housing-bot",
              title: "AI 租房咨询自动回复",
              desc: "房源知识库+FAQ自动回复，复杂问题转人工",
              input: ["房源列表（价格/面积/配置）", "FAQ 常见问题"],
              output: ["秒回常见问题", "自动推荐匹配房源", "带看预约引导"],
              stacks: ["Coze", "企业微信", "飞书多维表格"],
              difficulty: "低",
              antiPattern:
                '不要做"虚拟看房"（技术成本太高），先做"智能问答+预约"',
              modeNotes: {
                student: "找校园周边 3 家中介，免费帮他们搭建试用",
                teacher: "房地产经纪课：客户服务数字化转型",
              },
            },
          ],
          toolStack: [
            { name: "Coze", platform: "coze.cn", price: "免费", useCase: "房源 FAQ 智能问答机器人" },
            { name: "企业微信", platform: "work.weixin.qq.com", price: "免费", useCase: "租客咨询接待与跟进" },
            { name: "飞书多维表格", platform: "feishu.cn", price: "免费", useCase: "房源信息库管理" },
          ],
        },
        {
          id: "viewing-manual",
          title: "带看靠手动约，经常撞时间",
          severity: "medium",
          symptoms: ["微信约时间来回扯", "带看撞车", "客户放鸽子没提醒"],
          interviewQ: ["带看预约怎么管理的？", "一周有几次客户爽约？"],
          solutions: [
            {
              id: "viewing-scheduler",
              title: "AI 看房预约管理",
              desc: "自动收集看房意向，安排时间段，发送提醒，减少爽约",
              input: ["可看房时段", "客户意向"],
              output: ["自动排期", "看房前提醒", "爽约预警"],
              stacks: ["Coze", "企业微信", "飞书日历"],
              difficulty: "低",
              antiPattern: "用飞书日历+Coze就够了，不需要做独立App",
              modeNotes: {
                student: "在开学季（最忙的时候）帮中介试跑 1 周",
                teacher: "运营管理课：预约系统设计+排期优化",
              },
            },
          ],
          toolStack: [
            { name: "Coze", platform: "coze.cn", price: "免费", useCase: "看房预约与爽约提醒自动化" },
            { name: "企业微信", platform: "work.weixin.qq.com", price: "免费", useCase: "客户沟通与带看提醒" },
            { name: "飞书日历", platform: "feishu.cn", price: "免费", useCase: "带看时段可视化排期" },
          ],
        },
      ],
      validation: {
        target: "3-5 家校园周边租房中介或公寓管理",
        day1: "走访学校附近的租房中介/公寓前台",
        day3: "整理 1 家中介的 FAQ（至少 20 条）和房源表",
        day7: "搭建 Coze Bot + 企微接入，让中介实际使用 3 天",
        successSignal: '中介说"至少省了一半的重复回复时间"',
        failSignal: '中介觉得"Bot 回答不够准确，客户不满意"',
      },
    },

    "edu-training": {
      id: "edu-training",
      name: "教培机构（素质 / 兴趣 / 成人）",
      categoryId: "local",
      summary: "帮培训机构从招生获客到续费留存全链路提效",
      tags: ["学生最易访谈", "续费刚需", "学情数据化"],
      feasibility: 5,
      painPoints: [
        {
          id: "cold-start",
          title: "招生难，体验课转化率低",
          severity: "high",
          symptoms: [
            "花了钱投广告但来的人少",
            "体验课来了但不报名",
            "不知道怎么在小红书/朋友圈做招生内容",
          ],
          interviewQ: [
            "现在主要靠什么渠道招生？",
            "体验课到正式报名的转化率大概多少？",
          ],
          solutions: [
            {
              id: "enrollment-engine",
              title: "AI 招生内容+试听跟进助手",
              desc: "自动生成本地化招生内容（小红书/朋友圈/社群），体验课后自动跟进转化",
              input: ["课程特色", "目标学员画像", "校区周边信息"],
              output: ["招生图文模板", "体验课邀约话术", "课后自动跟进消息"],
              stacks: ["Coze", "企业微信", "即梦(海报)"],
              difficulty: "低",
              antiPattern: '不要只做线上投放，先把"体验课→报名"的转化闭环跑通',
              modeNotes: {
                student:
                  "帮 1 家机构设计体验课邀约+课后跟进流程，观察 2 周转化率",
                teacher: "教育营销课实训：从0到1的本地化招生获客全流程",
              },
            },
          ],
          toolStack: [
            { name: "Coze", platform: "coze.cn", price: "免费", useCase: "招生内容与跟进话术生成" },
            { name: "企业微信", platform: "work.weixin.qq.com", price: "免费", useCase: "体验课后自动跟进转化" },
            { name: "即梦", platform: "jimeng.jianying.com", price: "免费/付费", useCase: "招生海报 AI 设计" },
          ],
        },
        {
          id: "renewal-retention",
          title: "续费靠老师催，学员流失无预警",
          severity: "medium",
          symptoms: [
            "学员快到期才发现，不知道谁要流失",
            '家长问"孩子学得怎么样"答不上来',
            "老师换人学情丢失，没有量化进步指标",
          ],
          interviewQ: [
            "续费率是多少？学员流失前有什么征兆？",
            "怎么给家长反馈孩子的学习情况？",
          ],
          solutions: [
            {
              id: "retention-system",
              title: "AI 续费预警+学情报告",
              desc: "根据出勤和互动预测流失风险并自动提醒；同时为家长生成学情报告",
              input: ["出勤记录", "课程进度", "老师评语关键词"],
              output: ["流失风险评分+提醒计划", "个性化学情报告", "进步曲线图"],
              stacks: ["飞书多维表格", "Coze", "企业微信"],
              difficulty: "低",
              antiPattern:
                '不要"自动催单"（引起反感），做"学情反馈+关怀式续费提醒"',
              modeNotes: {
                student:
                  "帮 1 家机构统计 3 个月出勤数据+做 1 个班的学情报告试点",
                teacher: "教育管理课：学员生命周期分析+AI辅助教学评估",
              },
            },
          ],
          toolStack: [
            { name: "飞书多维表格", platform: "feishu.cn", price: "免费", useCase: "出勤与学情数据统计分析" },
            { name: "Coze", platform: "coze.cn", price: "免费", useCase: "个性化学情报告自动生成" },
            { name: "企业微信", platform: "work.weixin.qq.com", price: "免费", useCase: "续费预警与关怀消息推送" },
          ],
        },
      ],
      validation: {
        target: "3 个新开 + 3 个已有学员的培训机构",
        day1: "访问校园周边的钢琴/美术/编程培训机构",
        day3: "帮 1 个新机构设计招生内容，帮 1 个老机构分析出勤和流失数据",
        day7: "新机构发出招生内容观察咨询量；老机构设置续费预警跑 1 周",
        successSignal: '新机构收到咨询；老机构说"这个月续费率比上个月高了"',
        failSignal: "招生内容没效果，或机构不愿分享数据",
      },
    },

    /* ═══════════════════════════════════════════
       D · 校园与职业服务
       ═══════════════════════════════════════════ */
    "campus-service": {
      id: "campus-service",
      name: "校园周边服务",
      categoryId: "campus",
      summary: "帮打印店/二手交易/考研机构做数字化升级",
      tags: ["最容易起步", "付费意愿偏低", "适合练手"],
      feasibility: 5,
      painPoints: [
        {
          id: "manual-quote",
          title: "报价和接单全靠手动",
          severity: "high",
          symptoms: ["微信问价来回扯", "复杂订单算价格慢", "忙时漏单"],
          interviewQ: ["每天接多少单？", "算价格要多久？"],
          solutions: [
            {
              id: "auto-quote",
              title: "AI 自动报价+接单助手",
              desc: "客户发需求描述，自动计算价格并生成订单",
              input: ["价目表", "客户需求描述（文字/图片）"],
              output: ["自动报价", "订单确认", "排队提醒"],
              stacks: ["Coze", "企业微信", "飞书多维表格"],
              difficulty: "低",
              antiPattern:
                "从最简单的场景开始（如打印店），不要一上来做复杂系统",
              modeNotes: {
                student: "找学校里最忙的打印店，免费帮他做报价Bot",
                teacher: "创业入门课：最小可行产品从身边开始",
              },
            },
          ],
          toolStack: [
            { name: "Coze", platform: "coze.cn", price: "免费", useCase: "自动报价与订单确认 Bot" },
            { name: "企业微信", platform: "work.weixin.qq.com", price: "免费", useCase: "接单管理与排队通知" },
            { name: "飞书多维表格", platform: "feishu.cn", price: "免费", useCase: "订单记录与收款统计" },
          ],
        },
        {
          id: "no-crm",
          title: "没有客户管理和复购机制",
          severity: "low",
          symptoms: ["不知道谁是常客", "没有会员体系", "促销靠发传单"],
          interviewQ: ["知道你的回头客有多少吗？", "有没有做过会员卡？"],
          solutions: [
            {
              id: "campus-mini-crm",
              title: "极简校园商家 CRM",
              desc: "记录客户消费频次，自动发优惠券给高频客户",
              input: ["消费记录"],
              output: ["客户频次排行", "自动优惠触发"],
              stacks: ["飞书多维表格", "Coze"],
              difficulty: "低",
              antiPattern:
                "注意：校园商家付费意愿低，适合作为练手项目而非商业项目",
              modeNotes: {
                student:
                  "作为创业课第一个作业来做，重点是学会客户访谈和MVP构建",
                teacher: '强调"付费意愿验证"比"功能开发"更重要',
              },
            },
          ],
          toolStack: [
            { name: "飞书多维表格", platform: "feishu.cn", price: "免费", useCase: "客户消费频次统计与分析" },
            { name: "Coze", platform: "coze.cn", price: "免费", useCase: "自动优惠券发放触发" },
            { name: "企业微信", platform: "work.weixin.qq.com", price: "免费", useCase: "会员通知与活动推送" },
          ],
        },
      ],
      validation: {
        target: "校园内 3-5 家商家（打印店、文具店、奶茶店、考研机构）",
        day1: "直接去校园里走访，不需要约",
        day3: "帮 1 家打印店做自动报价Bot原型",
        day7: "让打印店老板用 3 天，记录省了多少时间",
        successSignal: "老板愿意继续用，介绍其他店主给你",
        failSignal: '老板觉得"微信语音说一下就行，不需要Bot"',
      },
    },

    "hr-recruit": {
      id: "hr-recruit",
      name: "招聘 / HR（初创和中小企业）",
      categoryId: "campus",
      summary: '帮中小企业 HR 从"手动筛简历"变成"AI 初筛+人工精选"',
      tags: ["数据量大", "效率提升明显", "工具门槛中等"],
      feasibility: 3,
      painPoints: [
        {
          id: "resume-overload",
          title: "简历太多筛不过来",
          severity: "high",
          symptoms: ["一个岗位收几百份简历", "初筛花 2-3 天", "好候选人被埋没"],
          interviewQ: ["一个岗位通常收多少简历？", "初筛标准是什么？"],
          solutions: [
            {
              id: "resume-screener",
              title: "AI 简历初筛+匹配评分",
              desc: "解析简历，按 JD 要求自动打分，输出 Top 20% 候选人名单",
              input: ["岗位 JD", "简历文件（批量）"],
              output: ["匹配评分排行", "关键技能匹配度", "建议面试名单"],
              stacks: ["Dify(知识库)", "DeepSeek API", "飞书多维表格"],
              difficulty: "中",
              antiPattern:
                '不要做"完全自动淘汰"（有歧视风险），做"辅助排序+人工确认"',
              modeNotes: {
                student: "先找 1 家初创公司，免费帮他们筛 100 份简历做对比",
                teacher: "人力资源管理课：AI在招聘中的应用与伦理讨论",
              },
            },
          ],
          toolStack: [
            { name: "Dify", platform: "cloud.dify.ai", price: "免费/付费", useCase: "简历解析与 JD 知识库搭建" },
            { name: "DeepSeek API", platform: "deepseek.com", price: "低价", useCase: "简历匹配度评分与排名" },
            { name: "飞书多维表格", platform: "feishu.cn", price: "免费", useCase: "候选人管理与面试流程追踪" },
          ],
        },
        {
          id: "interview-prep",
          title: "面试问题千篇一律",
          severity: "medium",
          symptoms: [
            "每个岗位问一样的问题",
            "面试官不知道针对简历问什么",
            "面试评估主观性强",
          ],
          interviewQ: [
            "面试问题是固定的还是按简历定制的？",
            "面试官有没有受过培训？",
          ],
          solutions: [
            {
              id: "interview-gen",
              title: "AI 定制面试问题生成",
              desc: "基于 JD + 候选人简历，自动生成针对性面试问题和评分标准",
              input: ["岗位 JD", "候选人简历"],
              output: ["定制面试问题", "预期回答要点", "评分量表"],
              stacks: ["DeepSeek API", "飞书文档", "讯飞星火"],
              difficulty: "低",
              antiPattern: '问题要接地气，不要生成"MBA教科书式"的通用问题',
              modeNotes: {
                student: "在校招季帮学校就业中心做面试准备工具",
                teacher: "组织行为学课：结构化面试设计+AI辅助",
              },
            },
          ],
          toolStack: [
            { name: "DeepSeek API", platform: "deepseek.com", price: "低价", useCase: "按简历生成定制面试问题" },
            { name: "飞书文档", platform: "feishu.cn", price: "免费", useCase: "面试评分表模板管理" },
            { name: "讯飞星火", platform: "xinghuo.xfyun.cn", price: "免费/付费", useCase: "面试问答模拟练习与评估" },
          ],
        },
      ],
      validation: {
        target: "3 家 50 人以下的初创/中小企业 HR",
        day1: "通过创业社/孵化器找正在招人的公司",
        day3: "拿到 1 个真实岗位的 JD + 50 份简历，手动+AI 对比初筛",
        day7: "搭建 Dify 知识库 + 简历解析流程，让 HR 实测",
        successSignal: 'HR 说"筛选时间从 2 天变成 2 小时"',
        failSignal: 'HR 担心"AI 筛掉了好候选人"',
      },
    },

    "study-abroad": {
      id: "study-abroad",
      name: "留学 / 签证 / 语培咨询",
      categoryId: "campus",
      summary: "帮留学中介自动处理重复咨询、生成个性化方案",
      tags: ["客单价高", "FAQ重复度高", "转化周期长"],
      feasibility: 4,
      painPoints: [
        {
          id: "consult-repeat",
          title: "咨询问题高度重复",
          severity: "high",
          symptoms: [
            '"XX大学要求GPA多少""雅思要考几分"反复回答',
            "顾问时间被基础咨询占满",
            "高价值客户得不到及时响应",
          ],
          interviewQ: [
            "顾问每天花多少时间回答基础问题？",
            "有没有统计过最常见的问题？",
          ],
          solutions: [
            {
              id: "study-faq-bot",
              title: "AI 留学咨询预筛+知识库",
              desc: "自动回答院校要求、申请流程等标准问题，复杂问题转顾问",
              input: ["院校数据库", "FAQ", "申请时间线"],
              output: ["秒回标准问题", "客户意向评级", "顾问对接建议"],
              stacks: ["Dify(知识库)", "企业微信", "飞书多维表格"],
              difficulty: "中",
              antiPattern:
                '不要替代顾问做"个性化方案"（需要经验），只做"标准信息查询"',
              modeNotes: {
                student: "帮 1 家小型留学机构整理 50 条院校 FAQ 建知识库",
                teacher: "教育产业课：留学市场分析+AI客服应用",
              },
            },
          ],
          toolStack: [
            { name: "Dify", platform: "cloud.dify.ai", price: "免费/付费", useCase: "院校信息知识库与问答" },
            { name: "企业微信", platform: "work.weixin.qq.com", price: "免费", useCase: "客户咨询接待与意向管理" },
            { name: "飞书多维表格", platform: "feishu.cn", price: "免费", useCase: "客户档案与跟进记录" },
          ],
        },
        {
          id: "plan-generation",
          title: "个性化方案靠手写，质量不一",
          severity: "medium",
          symptoms: [
            "每个学生的方案要写 1-2 小时",
            "不同顾问方案质量差异大",
            '家长觉得"不够个性化"',
          ],
          interviewQ: [
            "做一份留学方案要多久？",
            "方案模板是统一的还是各写各的？",
          ],
          solutions: [
            {
              id: "plan-gen",
              title: "AI 留学方案初稿生成",
              desc: "输入学生背景信息，自动生成院校推荐+申请时间线+准备建议",
              input: ["学生GPA/语言成绩/背景", "目标国家/专业"],
              output: ["院校推荐列表", "申请时间线", "个性化准备建议"],
              stacks: ["DeepSeek API", "飞书文档", "Dify(院校知识库)"],
              difficulty: "中",
              antiPattern:
                '标注"AI生成初稿，顾问审核修改"，不要让家长觉得方案是机器写的',
              modeNotes: {
                student: "找学校里的留学咨询社做合作，先做免费版攒口碑",
                teacher: "跨文化教育课：AI辅助教育规划+伦理边界",
              },
            },
          ],
          toolStack: [
            { name: "DeepSeek API", platform: "deepseek.com", price: "低价", useCase: "学生背景分析与院校推荐" },
            { name: "飞书文档", platform: "feishu.cn", price: "免费", useCase: "留学方案模板生成与存档" },
            { name: "Dify", platform: "cloud.dify.ai", price: "免费/付费", useCase: "院校数据库智能查询" },
          ],
        },
      ],
      validation: {
        target: "3 家小型留学/语培机构或独立顾问",
        day1: "在校园里找留学机构驻点人员或通过学长推荐",
        day3: "整理 1 家机构的院校数据和 FAQ，搭建知识库",
        day7: "让顾问用 AI 辅助回复 3 天，对比效率",
        successSignal: '顾问说"基础咨询回复速度翻倍，有更多时间做深度咨询"',
        failSignal: "知识库答案不够准确，顾问不信任",
      },
    },
  },
};
