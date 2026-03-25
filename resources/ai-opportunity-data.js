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
          id: "monetization",
          title: "有粉丝但变现难",
          severity: "high",
          symptoms: [
            "广告收入波动大",
            "粉丝量涨但收入不涨",
            "不知道卖什么给粉丝",
          ],
          interviewQ: [
            "你现在的收入来源是什么？",
            "有多少粉丝主动问你买过东西？",
          ],
          solutions: [
            {
              id: "fan-to-private",
              title: "AI 粉丝转私域漏斗",
              desc: "自动识别高意向粉丝，引导到企微/社群，推送个性化产品",
              input: ["评论区互动数据", "私信关键词"],
              output: ["高意向粉丝名单", "自动引导话术", "私域标签分组"],
              stacks: ["Coze", "企业微信", "飞书多维表格"],
              difficulty: "低",
              antiPattern: '不要做"通用聊天机器人"，要做"精准变现路径"',
              modeNotes: {
                student: "先找 3 个万粉创作者免费试用，跑通 1 个案例",
                teacher: "适合内容营销课实训：粉丝画像→变现路径设计",
              },
            },
          ],
        },
        {
          id: "content-fatigue",
          title: "多平台分发重复劳动",
          severity: "medium",
          symptoms: [
            "同一内容要改 3-5 个平台格式",
            "排版/封面图反复调整",
            "发完还要手动追数据",
          ],
          interviewQ: ['每天花多少时间在"发内容"而不是"做内容"上？'],
          solutions: [
            {
              id: "multi-platform-bot",
              title: "AI 多平台一键分发助手",
              desc: "一次输入内容，自动适配各平台格式、字数、标签，定时发布",
              input: ["原始文案/视频", "平台规则模板"],
              output: ["适配后的多平台内容", "最佳发布时间建议"],
              stacks: ["Coze", "n8n", "飞书文档"],
              difficulty: "低",
              antiPattern:
                '不要试图做"全自动发布"（平台会封号），做"半自动适配"',
              modeNotes: {
                student: '先做"小红书→公众号→抖音"三平台适配 MVP',
                teacher: '可作为"内容运营自动化"课程案例',
              },
            },
          ],
        },
      ],
      validation: {
        target: "3-5 个万粉以上垂直创作者",
        day1: "在小红书/B站找到 10 个目标创作者，私信约访谈",
        day3: "完成 3 个访谈，确认最痛的是变现还是分发",
        day7: "用 Coze 搭建 MVP，让 1 个创作者实际使用 3 天",
        successSignal: '创作者愿意继续用，主动问"能不能加功能"',
        failSignal: '创作者觉得"我手动做也一样快"',
      },
    },

    mcn: {
      id: "mcn",
      name: "直播电商 / MCN 小团队",
      categoryId: "content",
      summary: "帮小型直播团队降低合规风险、提升复盘效率",
      tags: ["合规刚需", "数据驱动", "市场增长快"],
      feasibility: 4,
      painPoints: [
        {
          id: "compliance",
          title: "直播合规压力大",
          severity: "high",
          symptoms: ["不确定哪些话术违规", "被平台处罚过", "新主播不了解红线"],
          interviewQ: [
            "过去半年被平台警告或处罚过几次？",
            "团队有没有合规培训？",
          ],
          solutions: [
            {
              id: "compliance-checker",
              title: "AI 直播话术合规检测",
              desc: "实时或录播后扫描主播话术，标记违规风险词和敏感表达",
              input: ["直播录音/文字稿", "平台最新违规词库"],
              output: ["风险词高亮报告", "合规修改建议", "团队合规评分"],
              stacks: ["通义听悟(转录)", "DeepSeek API", "飞书多维表格"],
              difficulty: "中",
              antiPattern: '不要做实时打断（技术难度太高），先做"录播审查报告"',
              modeNotes: {
                student: "先收集 50 条真实违规案例建知识库，再做检测",
                teacher: '适合"数字营销合规"课程：法规解读+AI检测实操',
              },
            },
          ],
        },
        {
          id: "review-inefficiency",
          title: "直播复盘耗时且低效",
          severity: "medium",
          symptoms: [
            "人工复盘超 2 小时",
            "复盘结论难落地",
            "数据散落在多个后台",
          ],
          interviewQ: [
            "每场直播后复盘花多长时间？",
            "复盘结论对下一场有帮助吗？",
          ],
          solutions: [
            {
              id: "ai-review",
              title: "AI 直播复盘报告生成器",
              desc: "自动分析直播数据（观看、互动、转化），生成结构化复盘报告",
              input: ["直播数据导出", "历史场次数据"],
              output: ["关键指标对比", "高光/低谷时段", "下场改进建议"],
              stacks: ["通义听悟", "Dify", "飞书多维表格"],
              difficulty: "中",
              antiPattern: '不要只做"数据看板"，要输出"可执行的改进动作"',
              modeNotes: {
                student: "先手动帮 1 个团队做 3 场复盘报告，验证需求",
                teacher: "数据分析课+直播运营课联合实训案例",
              },
            },
          ],
        },
      ],
      validation: {
        target: "3 个 5 人以下直播小团队",
        day1: "在抖音/快手找本地直播团队，或通过学长学姐介绍",
        day3: "帮 1 个团队手动做 1 份合规审查报告，看反馈",
        day7: "用通义听悟+DeepSeek搭建半自动流程，跑 3 场",
        successSignal: "团队主动发来下一场录播让你审",
        failSignal: '觉得"我们自己看回放就行"',
      },
    },

    "xhs-seller": {
      id: "xhs-seller",
      name: "小红书知识 / 服务型卖家",
      categoryId: "content",
      summary: "帮小红书上卖服务的博主自动处理重复咨询",
      tags: ["私信痛点强", "转化率可测", "学生易接触"],
      feasibility: 5,
      painPoints: [
        {
          id: "dm-overload",
          title: "重复私信淹没，回不过来",
          severity: "high",
          symptoms: [
            '每天几十到几百条"多少钱"',
            "咨询高峰期漏回",
            "回复慢导致客户流失",
          ],
          interviewQ: [
            "每天花多少时间回私信？",
            "估计有多少咨询因为回复慢丢掉了？",
          ],
          solutions: [
            {
              id: "xhs-auto-reply",
              title: "AI 私信自动分类+半自动回复",
              desc: "自动识别咨询类型，高频问题秒回，复杂问题打标转人工",
              input: ["历史私信记录", "FAQ 知识库", "报价表"],
              output: ["自动回复模板", "客户意向分级", "待人工处理清单"],
              stacks: ["Coze", "小红书笔记评论区引导", "企业微信"],
              difficulty: "低",
              antiPattern:
                '不要做"完全自动回复"（容易答非所问），做"分类+模板+转人工"',
              modeNotes: {
                student: "找 3 个做塔罗/留学/心理咨询的小红书博主合作",
                teacher: "客户服务自动化课：从人工→半自动→智能化的演进",
              },
            },
          ],
        },
        {
          id: "conversion-blind",
          title: "咨询到成交靠经验，无数据",
          severity: "medium",
          symptoms: [
            "不知道哪个话术转化率高",
            "客单价凭感觉定",
            "不知道客户卡在哪一步",
          ],
          interviewQ: [
            "你知道从咨询到付费的转化率是多少吗？",
            "有没有统计过不同话术的效果？",
          ],
          solutions: [
            {
              id: "conversion-tracker",
              title: "AI 咨询转化追踪面板",
              desc: "记录每次咨询的阶段、结果、话术，生成转化漏斗分析",
              input: ["咨询记录", "成交/未成交标记"],
              output: ["转化漏斗图", "最佳话术排行", "流失节点分析"],
              stacks: ["飞书多维表格", "Coze", "DeepSeek API"],
              difficulty: "中",
              antiPattern: "初期不需要做得很精美，用飞书表格+AI公式就够了",
              modeNotes: {
                student: "先用飞书表格手动记录 30 条咨询数据，跑出第一版漏斗",
                teacher: "数据驱动运营课实训：构建最小数据分析管道",
              },
            },
          ],
        },
      ],
      validation: {
        target: "5 个小红书知识/服务型博主（塔罗、留学、穿搭顾问等）",
        day1: '在小红书搜索"接单""咨询"类博主，私信 20 个',
        day3: "收集 3 个博主的典型 FAQ，整理成知识库",
        day7: "搭建 Coze 自动回复 Bot，让 1 个博主实测 3 天",
        successSignal: '博主说"回复速度明显快了，少丢了好几个客户"',
        failSignal: '博主觉得"自动回复太机械，客户不喜欢"',
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
      summary: '帮 3-10 人代运营团队从"人堆活"变成"AI 杠杆"',
      tags: ["客户报告刚需", "ROI 可算", "内容产出重复"],
      feasibility: 3,
      painPoints: [
        {
          id: "client-report",
          title: "客户报告耗时 5-10 小时/周",
          severity: "high",
          symptoms: [
            "每周从 4+ 平台导数据",
            "手动做 PPT 或 Excel",
            "客户觉得不够及时",
          ],
          interviewQ: [
            "每周花多少时间做客户报告？",
            "报告模板是固定的还是每次重做？",
          ],
          solutions: [
            {
              id: "auto-report",
              title: "AI 客户报告自动生成",
              desc: "从各平台抓取数据，自动生成带洞察的周报/月报",
              input: ["各平台数据导出", "报告模板", "客户 KPI"],
              output: ["数据汇总", "趋势分析", "优化建议", "PPT/PDF 报告"],
              stacks: ["Dify 工作流", "飞书多维表格", "DeepSeek API"],
              difficulty: "中",
              antiPattern:
                '不要追求全自动（数据源接口变化快），做"半自动+人工审核"',
              modeNotes: {
                student: "先用飞书表格+AI公式做 1 个客户的报告模板",
                teacher: "数字营销课：数据分析→报告撰写→客户沟通",
              },
            },
          ],
        },
        {
          id: "creative-fatigue",
          title: "素材创意产出跟不上消耗",
          severity: "medium",
          symptoms: [
            "同一产品要做几十张图",
            "文案越写越重复",
            '客户要求"再换个风格"',
          ],
          interviewQ: ["一个月要产出多少张素材？", "创意灵感枯竭时怎么办？"],
          solutions: [
            {
              id: "creative-batch",
              title: "AI 素材批量生成流水线",
              desc: "输入产品信息和风格要求，批量生成图文/短视频脚本变体",
              input: ["产品图片", "品牌调性", "投放平台"],
              output: ["多风格文案变体", "封面图建议", "短视频分镜脚本"],
              stacks: ["即梦(图)", "DeepSeek(文)", "Coze 工作流"],
              difficulty: "低",
              antiPattern:
                '不要做"全自动出图"（质量不稳定），做"AI 初稿+人工精修"',
              modeNotes: {
                student: "帮 1 个客户批量生成 20 条小红书图文素材做 AB 测试",
                teacher: "广告创意课实训：AI辅助创意生产工作流",
              },
            },
          ],
        },
      ],
      validation: {
        target: "3 个 10 人以下的电商代运营团队",
        day1: "通过创业社/电商园区找小型代运营公司",
        day3: "帮 1 个团队做 1 份自动化周报，对比手工时间",
        day7: "搭建报告生成流程，跑通 2 个客户的数据",
        successSignal: '团队说"每周省了 5 小时"',
        failSignal: "数据源对接太复杂，MVP 做不出来",
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
              stacks: ["Coze", "即梦", "小红书发布"],
              difficulty: "低",
              antiPattern:
                '不要追求"高级文案"，商家需要的是"能发就行，比没有强"',
              modeNotes: {
                student: "帮校园周边 5 家店各生成 3 条小红书笔记，跟踪数据",
                teacher: "新媒体营销课：本地商家数字化推广实战",
              },
            },
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
      summary: "帮培训机构用 AI 提升续费率和教学效率",
      tags: ["学生最易访谈", "续费刚需", "学情数据化"],
      feasibility: 5,
      painPoints: [
        {
          id: "renewal-blind",
          title: "续费靠老师催，流失无预警",
          severity: "high",
          symptoms: ["学员快到期才发现", "不知道谁要流失", "催费话术不专业"],
          interviewQ: ["续费率是多少？", "学员流失前有什么征兆？"],
          solutions: [
            {
              id: "renewal-alert",
              title: "AI 续费预警+智能提醒",
              desc: "根据出勤、互动、课程进度预测流失风险，自动触发分层提醒",
              input: ["出勤记录", "课程进度", "续费到期日"],
              output: ["流失风险评分", "个性化续费话术", "自动提醒计划"],
              stacks: ["飞书多维表格", "Coze", "企业微信"],
              difficulty: "低",
              antiPattern:
                '不要直接"自动续费催单"（会引起反感），做"关怀式提醒"',
              modeNotes: {
                student: "帮 1 家机构统计近 3 个月出勤数据，找出流失规律",
                teacher: "教育管理课：学员生命周期分析+干预策略",
              },
            },
          ],
        },
        {
          id: "learning-tracking",
          title: "学情追踪靠老师手写笔记",
          severity: "medium",
          symptoms: [
            '家长问"孩子学得怎么样"答不上来',
            "老师换人学情丢失",
            "没有量化进步指标",
          ],
          interviewQ: [
            "怎么给家长反馈孩子的学习情况？",
            "有没有学情管理系统？",
          ],
          solutions: [
            {
              id: "learning-report",
              title: "AI 学情报告自动生成",
              desc: "老师输入简单评价，AI 生成结构化学情报告发给家长",
              input: ["老师评语关键词", "考试/练习成绩", "出勤记录"],
              output: ["个性化学情报告", "进步曲线图", "下阶段学习建议"],
              stacks: ["Coze", "飞书文档", "企业微信(推送)"],
              difficulty: "低",
              antiPattern: '报告要"看起来专业但输入很简单"，老师不会填复杂表格',
              modeNotes: {
                student: "帮 1 家机构的 1 个班做 1 个月学情报告试点",
                teacher: "教育技术课：AI辅助教学评估与反馈",
              },
            },
          ],
        },
      ],
      validation: {
        target: "3 家素质教育/兴趣班/成人培训机构",
        day1: "访问校园周边的钢琴/美术/编程培训机构",
        day3: "获取 1 家机构的出勤和续费数据，分析流失规律",
        day7: "设置续费预警规则，观察 1 周内是否成功唤回流失学员",
        successSignal: '机构说"这个月续费率比上个月高了"',
        failSignal: "数据太乱无法分析，或机构不愿意分享数据",
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
              stacks: ["DeepSeek API", "飞书文档"],
              difficulty: "低",
              antiPattern: '问题要接地气，不要生成"MBA教科书式"的通用问题',
              modeNotes: {
                student: "在校招季帮学校就业中心做面试准备工具",
                teacher: "组织行为学课：结构化面试设计+AI辅助",
              },
            },
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
