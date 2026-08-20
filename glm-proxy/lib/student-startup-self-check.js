"use strict";

const ACTION_LIBRARY = require("../../src/data/action-library.json");

const {
  TOOL_ID_STUDENT_STARTUP_SELF_CHECK,
  appendHistory,
  buildToolWorkspace,
  createId,
  getLatestHistory,
  nowIso,
} = require("./data-store");
const { callStructuredGLM } = require("./glm");

const DIMENSIONS = [
  { key: "problem", label: "痛点真实度" },
  { key: "wedge", label: "初始突破口" },
  { key: "mvp", label: "快速验证力" },
  { key: "team", label: "团队-赛道匹配" },
  { key: "growth", label: "演进空间" },
];

const ACTION_LIBRARY_VERSION = 1;
const SCORING_DEADLINE_MS = 52000;
const MIN_RECALIBRATION_BUDGET_MS = 10000;
const ACTIONS_BY_ID = ACTION_LIBRARY.reduce(function (acc, item) {
  acc[item.actionId] = item;
  return acc;
}, {});
const ACTIONS_BY_DIMENSION = ACTION_LIBRARY.reduce(function (acc, item) {
  const key = item.dimension;
  if (!acc[key]) {
    acc[key] = [];
  }
  acc[key].push(item);
  return acc;
}, {});

const REASONING_SCHEMA_EXAMPLE = {
  dimensionScores: {
    problem: 7,
    wedge: 6,
    mvp: 5,
    team: 6,
    growth: 7,
  },
  dimensionRationales: {
    problem: "为什么是这个分，用一句到两句解释。",
    wedge: "为什么是这个分，用一句到两句解释。",
    mvp: "为什么是这个分，用一句到两句解释。",
    team: "为什么是这个分，用一句到两句解释。",
    growth: "为什么是这个分，用一句到两句解释。",
  },
  overallSummary:
    "先给一句总判断，再指出最大机会和最大风险，风格可严厉或温和，但评分必须客观。",
  strengths: ["优势 1", "优势 2"],
  risks: ["风险 1", "风险 2"],
  sectorLabel: "校园招聘",
};

function clampScore(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 5;
  }
  return Math.max(1, Math.min(10, Math.round(parsed)));
}

function normalizeFreeText(input) {
  return String(input || "")
    .trim()
    .replace(/\s+/g, " ");
}

function buildInputSnapshot(draftData) {
  const draft = draftData && typeof draftData === "object" ? draftData : {};
  return {
    product: normalizeFreeText(draft.product),
    audience: normalizeFreeText(draft.audience),
    model: normalizeFreeText(draft.model),
    stage: normalizeFreeText(draft.stage),
    team: normalizeFreeText(draft.team),
    validationPlan: normalizeFreeText(draft.validationPlan),
    mode: draft.mode === "roast" ? "roast" : "gentle",
  };
}

function hasAnyKeyword(text, keywords) {
  const normalizedText = String(text || "").toLowerCase();
  return keywords.some(function (keyword) {
    return normalizedText.includes(String(keyword).toLowerCase());
  });
}

function isSpecificEnough(text) {
  return normalizeFreeText(text).length >= 18;
}

function hasUserInterviewEvidence(snapshot) {
  return (
    ["已做用户访谈", "已做 MVP", "已有用户", "已有收入"].includes(snapshot.stage) ||
    hasAnyKeyword(snapshot.product + " " + snapshot.validationPlan, [
      "访谈",
      "采访",
      "调研",
      "问卷",
      "用户聊",
    ])
  );
}

function hasMvpEvidence(snapshot) {
  return (
    ["已做 MVP", "已有用户", "已有收入"].includes(snapshot.stage) ||
    hasAnyKeyword(snapshot.product + " " + snapshot.validationPlan, [
      "MVP",
      "原型",
      "demo",
      "小程序",
      "网站",
      "试用版",
      "测试版",
    ])
  );
}

function hasTimeBoundPlan(snapshot) {
  return (
    Boolean(snapshot.validationPlan) &&
    hasAnyKeyword(snapshot.validationPlan, [
      "本周",
      "这周",
      "7天",
      "一周",
      "两周",
      "本月",
      "月底前",
      "周内",
      "3天",
      "48小时",
    ]) &&
    hasAnyKeyword(snapshot.validationPlan, [
      "测试",
      "验证",
      "访谈",
      "上线",
      "招募",
      "试投放",
      "收集",
      "跑",
    ])
  );
}

function scoreTeamMatch(snapshot) {
  const teamText = snapshot.team.toLowerCase();
  const combined = (
    snapshot.product +
    " " +
    snapshot.audience +
    " " +
    snapshot.model
  ).toLowerCase();

  if (!teamText) {
    return false;
  }

  const directPairs = [
    ["计算机", ["软件", "平台", "ai", "工具", "系统", "小程序"]],
    ["编程", ["软件", "平台", "ai", "工具", "系统"]],
    ["设计", ["内容", "品牌", "社区", "消费", "产品"]],
    ["运营", ["社区", "增长", "招募", "电商", "平台"]],
    ["销售", ["to b", "企业", "saas", "招生", "招聘"]],
    ["教育", ["学习", "学生", "课程", "校园"]],
    ["医学", ["医疗", "健康", "诊疗"]],
    ["餐饮", ["餐饮", "外卖", "门店"]],
  ];

  return directPairs.some(function (pair) {
    return (
      teamText.includes(pair[0]) &&
      pair[1].some(function (keyword) {
        return combined.includes(keyword);
      })
    );
  });
}

function inferSectorLabel(snapshot) {
  const text = (
    snapshot.product +
    " " +
    snapshot.audience +
    " " +
    snapshot.model
  ).toLowerCase();

  const candidates = [
    ["校园招聘", ["兼职", "实习", "招聘", "求职", "就业"]],
    ["AI 工具", ["ai", "智能", "大模型", "自动化"]],
    ["教育", ["课程", "学习", "教育", "训练营", "老师"]],
    ["餐饮", ["餐饮", "奶茶", "咖啡", "外卖", "门店"]],
    ["校园生活", ["校园", "宿舍", "社团", "大学生"]],
    ["本地生活", ["本地", "社区", "门店", "周边"]],
    ["医疗健康", ["医疗", "健康", "诊所", "心理"]],
  ];

  const match = candidates.find(function (candidate) {
    return candidate[1].some(function (keyword) {
      return text.includes(keyword);
    });
  });

  if (match) {
    return match[0];
  }

  if (snapshot.audience) {
    return snapshot.audience.slice(0, 12);
  }

  return "你的目标行业";
}

function selectActionIdForDimension(dimensionKey, snapshot) {
  const audienceSpecific = isSpecificEnough(snapshot.audience);
  const modelSpecific = isSpecificEnough(snapshot.model);
  const productSpecific = isSpecificEnough(snapshot.product);
  const interviews = hasUserInterviewEvidence(snapshot);
  const mvp = hasMvpEvidence(snapshot);
  const timeBoundPlan = hasTimeBoundPlan(snapshot);
  const teamMatch = scoreTeamMatch(snapshot);
  const earlyStage = snapshot.stage === "只有想法" || snapshot.stage === "已做用户访谈";

  const dimensionStrategies = {
    problem: [
      function () {
        return interviews ? "" : "Action_001";
      },
      function () {
        return audienceSpecific ? "" : "Action_005";
      },
      function () {
        return modelSpecific ? "" : "Action_003";
      },
      function () {
        return productSpecific ? "Action_006" : "Action_007";
      },
      function () {
        return "Action_010";
      },
    ],
    wedge: [
      function () {
        return audienceSpecific ? "" : "Action_012";
      },
      function () {
        return modelSpecific ? "" : "Action_014";
      },
      function () {
        return snapshot.validationPlan ? "Action_013" : "Action_011";
      },
      function () {
        return "Action_018";
      },
      function () {
        return "Action_020";
      },
    ],
    mvp: [
      function () {
        return timeBoundPlan ? "" : "Action_021";
      },
      function () {
        return mvp ? "" : "Action_022";
      },
      function () {
        return interviews ? "Action_023" : "Action_026";
      },
      function () {
        return earlyStage ? "Action_024" : "Action_028";
      },
      function () {
        return "Action_030";
      },
    ],
    team: [
      function () {
        return snapshot.team ? "" : "Action_031";
      },
      function () {
        return teamMatch ? "" : "Action_034";
      },
      function () {
        return snapshot.team ? "Action_033" : "Action_032";
      },
      function () {
        return "Action_037";
      },
      function () {
        return "Action_039";
      },
    ],
    growth: [
      function () {
        return earlyStage ? "Action_041" : "Action_046";
      },
      function () {
        return modelSpecific ? "" : "Action_044";
      },
      function () {
        return hasAnyKeyword(snapshot.model + " " + snapshot.validationPlan, ["复购", "留存", "回访"])
          ? "Action_045"
          : "Action_042";
      },
      function () {
        return mvp ? "Action_049" : "Action_048";
      },
      function () {
        return "Action_050";
      },
    ],
  };

  const strategies = dimensionStrategies[dimensionKey] || [];
  for (let i = 0; i < strategies.length; i++) {
    const actionId = strategies[i]();
    if (actionId && ACTIONS_BY_ID[actionId]) {
      return actionId;
    }
  }

  const fallbackList = ACTIONS_BY_DIMENSION[dimensionKey] || [];
  return fallbackList.length ? fallbackList[0].actionId : "";
}

function fillActionTemplate(text, labels) {
  return String(text || "")
    .replace(/\{\{industry\}\}/g, labels.industry)
    .replace(/\{\{audience\}\}/g, labels.audience)
    .replace(/\{\{product\}\}/g, labels.product);
}

function buildHeuristicLayer(snapshot) {
  const interviews = hasUserInterviewEvidence(snapshot);
  const mvp = hasMvpEvidence(snapshot);
  const teamMatch = scoreTeamMatch(snapshot);
  const timeBoundPlan = hasTimeBoundPlan(snapshot);
  const audienceSpecific = isSpecificEnough(snapshot.audience);
  const modelSpecific = isSpecificEnough(snapshot.model);
  const productSpecific = isSpecificEnough(snapshot.product);

  const triggeredRules = [
    {
      key: "interviews",
      label: "已有真实用户访谈",
      hit: interviews,
      score: interviews ? 5 : 0,
    },
    {
      key: "mvp",
      label: "已有 MVP 原型",
      hit: mvp,
      score: mvp ? 5 : 0,
    },
    {
      key: "team_match",
      label: "核心成员背景与赛道匹配",
      hit: teamMatch,
      score: teamMatch ? 5 : 0,
    },
    {
      key: "time_bound_plan",
      label: "有明确时间边界的测试计划",
      hit: timeBoundPlan,
      score: timeBoundPlan ? 5 : 0,
    },
  ];

  const dimensionScores = {
    problem: clampScore(3 + (interviews ? 4 : 0) + (productSpecific ? 1 : 0)),
    wedge: clampScore(
      3 + (audienceSpecific ? 3 : 0) + (modelSpecific ? 2 : 0),
    ),
    mvp: clampScore(3 + (mvp ? 4 : 0) + (timeBoundPlan ? 3 : 0)),
    team: clampScore(3 + (snapshot.team ? 2 : 0) + (teamMatch ? 4 : 0)),
    growth: clampScore(
      3 +
        (modelSpecific ? 2 : 0) +
        (audienceSpecific ? 1 : 0) +
        (snapshot.stage === "已有用户" || snapshot.stage === "已有收入" ? 2 : 0),
    ),
  };

  const totalScore = triggeredRules.reduce(function (sum, rule) {
    return sum + rule.score;
  }, 0);

  return {
    score: totalScore,
    maxScore: 20,
    triggeredRules: triggeredRules,
    dimensionScores: dimensionScores,
  };
}

function buildReasoningMessages(snapshot, mode) {
  const styleInstruction =
    mode === "roast"
      ? "你是犀利但专业的早期 VC。你可以尖锐，但不能让风格影响评分。"
      : "你是温和但诚实的创业导师。你可以鼓励，但不能让风格影响评分。";

  const systemPrompt = [
    styleInstruction,
    "你在做学生创业自检的 AI 专家评分层。",
    "任务要求：",
    "1. 评分只针对项目本身，不受说话风格影响。",
    "2. 五个维度都要打 1-10 分，1-3 表示基础极弱，4-6 表示方向存在明显缺口，7-8 表示有验证基础，9-10 仅给证据极强的项目。",
    "3. 输出必须是 JSON 对象，字段结构严格对齐示例。",
    "4. 解释必须具体，指出证据与缺口，避免空话。",
    "5. `sectorLabel` 用 2-8 个汉字概括赛道。",
  ].join("\n");

  const userPrompt = [
    "评分锚点示例（优）:",
    JSON.stringify({
      dimensionScores: {
        problem: 9,
        wedge: 8,
        mvp: 8,
        team: 8,
        growth: 8,
      },
      dimensionRationales: {
        problem: "已经做过多轮用户访谈，痛点不是主观臆测。",
        wedge: "第一批用户清晰，可直接从校园社群切入。",
        mvp: "本周内可执行的验证动作明确，成本可控。",
        team: "团队技能和赛道要求基本匹配。",
        growth: "先校园后校外的扩展路径合理。",
      },
      overallSummary: "方向成立，但仍需继续验证付费意愿。",
      strengths: ["真实需求信号强", "切入口清楚"],
      risks: ["仍需验证规模化付费"],
      sectorLabel: "校园工具",
    }),
    "评分锚点示例（中）:",
    JSON.stringify({
      dimensionScores: {
        problem: 6,
        wedge: 5,
        mvp: 4,
        team: 5,
        growth: 6,
      },
      dimensionRationales: {
        problem: "痛点描述有一定直觉，但真实用户证据不足。",
        wedge: "目标用户比较泛，第一批人群还不够聚焦。",
        mvp: "有尝试想法，但验证计划不够具体。",
        team: "团队有部分相关能力，但关键能力还缺。",
        growth: "长期空间存在，但早期路径还模糊。",
      },
      overallSummary: "方向不差，但目前更像概念，不像能马上验证的项目。",
      strengths: ["题目有想象空间"],
      risks: ["验证动作不具体", "起步人群不聚焦"],
      sectorLabel: "教育",
    }),
    "评分锚点示例（差）:",
    JSON.stringify({
      dimensionScores: {
        problem: 3,
        wedge: 3,
        mvp: 2,
        team: 3,
        growth: 4,
      },
      dimensionRationales: {
        problem: "更像创始人的主观想象，没有真实需求证据。",
        wedge: "第一批用户是谁并不清楚。",
        mvp: "没有明确验证计划，也没有可快速试错的方案。",
        team: "团队优势与项目要求几乎没有对应。",
        growth: "扩展空间停留在空泛想象。",
      },
      overallSummary: "现在不应该急着做产品，先回到问题验证。",
      strengths: ["有个人兴趣驱动"],
      risks: ["需求证据缺失", "执行路径空白"],
      sectorLabel: "泛工具",
    }),
    "必须输出的 JSON 结构示例：",
    JSON.stringify(REASONING_SCHEMA_EXAMPLE),
    "当前项目输入：",
    JSON.stringify(snapshot, null, 2),
  ].join("\n\n");

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

function normalizeReasoningResult(parsed, snapshot) {
  const source = parsed && typeof parsed === "object" ? parsed : {};
  const scores =
    source.dimensionScores && typeof source.dimensionScores === "object"
      ? source.dimensionScores
      : {};
  const rationales =
    source.dimensionRationales && typeof source.dimensionRationales === "object"
      ? source.dimensionRationales
      : {};

  const dimensionScores = DIMENSIONS.reduce(function (acc, dim) {
    acc[dim.key] = clampScore(scores[dim.key]);
    return acc;
  }, {});

  const dimensionRationales = DIMENSIONS.reduce(function (acc, dim) {
    acc[dim.key] = normalizeFreeText(rationales[dim.key]);
    return acc;
  }, {});

  return {
    dimensionScores: dimensionScores,
    dimensionRationales: dimensionRationales,
    overallSummary: normalizeFreeText(source.overallSummary),
    strengths: Array.isArray(source.strengths)
      ? source.strengths.map(normalizeFreeText).filter(Boolean).slice(0, 3)
      : [],
    risks: Array.isArray(source.risks)
      ? source.risks.map(normalizeFreeText).filter(Boolean).slice(0, 3)
      : [],
    sectorLabel: normalizeFreeText(source.sectorLabel) || inferSectorLabel(snapshot),
  };
}

function combineDimensionScores(heuristicScores, reasoningScores) {
  return DIMENSIONS.reduce(function (acc, dim) {
    acc[dim.key] = clampScore(
      heuristicScores[dim.key] * 0.4 + reasoningScores[dim.key] * 0.6,
    );
    return acc;
  }, {});
}

function getTotalScore(scores) {
  return DIMENSIONS.reduce(function (sum, dim) {
    return sum + clampScore(scores[dim.key]);
  }, 0);
}

function getTier(totalScore) {
  if (totalScore >= 40) {
    return "独角兽预备";
  }
  if (totalScore >= 30) {
    return "潜力股";
  }
  if (totalScore >= 20) {
    return "拉面盈利级";
  }
  return "回炉重造";
}

function canonicalizeSnapshot(snapshot) {
  return [
    snapshot.product,
    snapshot.audience,
    snapshot.model,
    snapshot.stage,
    snapshot.team,
    snapshot.validationPlan,
  ]
    .join("\n")
    .toLowerCase();
}

function tokenize(text) {
  return Array.from(new Set(text.split(/[^a-z0-9\u4e00-\u9fa5]+/i).filter(Boolean)));
}

function calculateInputSimilarity(currentSnapshot, previousSnapshot) {
  const currentTokens = tokenize(canonicalizeSnapshot(currentSnapshot));
  const previousTokens = tokenize(canonicalizeSnapshot(previousSnapshot));

  if (!currentTokens.length && !previousTokens.length) {
    return 1;
  }

  const previousSet = new Set(previousTokens);
  let overlap = 0;

  currentTokens.forEach(function (token) {
    if (previousSet.has(token)) {
      overlap++;
    }
  });

  return (2 * overlap) / (currentTokens.length + previousTokens.length);
}

function isExactSnapshotMatch(currentSnapshot, previousSnapshot) {
  return canonicalizeSnapshot(currentSnapshot) === canonicalizeSnapshot(previousSnapshot);
}

function alignReasoningScoresToFinal(heuristicScores, reasoningScores, targetFinalScores) {
  return DIMENSIONS.reduce(function (acc, dim) {
    const heuristicScore = clampScore(heuristicScores[dim.key]);
    const reasoningScore = clampScore(reasoningScores[dim.key]);
    const targetFinalScore = clampScore(targetFinalScores[dim.key]);

    let bestScore = reasoningScore;
    let bestDistance = Infinity;

    for (let candidate = 1; candidate <= 10; candidate++) {
      const combined = clampScore(heuristicScore * 0.4 + candidate * 0.6);
      if (combined !== targetFinalScore) {
        continue;
      }

      const distance = Math.abs(candidate - reasoningScore);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestScore = candidate;
      }
    }

    acc[dim.key] = bestScore;
    return acc;
  }, {});
}

async function maybeRecalibrateWithHistory(options) {
  const latestHistory = options.latestHistory;
  if (!latestHistory || !latestHistory.outputSnapshot) {
    return {
      recalibrated: false,
      reusedPreviousScores: false,
      inputSimilarity: 0,
      comparedVersionId: null,
      reasoning: options.reasoning,
      finalDimensionScores: options.finalDimensionScores,
    };
  }

  const previousInput = buildInputSnapshot(latestHistory.inputSnapshot);
  const similarity = calculateInputSimilarity(options.snapshot, previousInput);
  const exactMatch = isExactSnapshotMatch(options.snapshot, previousInput);
  const previousScores =
    latestHistory.outputSnapshot.finalDimensionScores ||
    latestHistory.outputSnapshot.scoring ||
    null;

  if (!previousScores) {
    return {
      recalibrated: false,
      reusedPreviousScores: false,
      inputSimilarity: similarity,
      comparedVersionId: latestHistory.versionId,
      reasoning: options.reasoning,
      finalDimensionScores: options.finalDimensionScores,
    };
  }

  if (exactMatch) {
    return {
      recalibrated: false,
      reusedPreviousScores: true,
      inputSimilarity: similarity,
      comparedVersionId: latestHistory.versionId,
      reasoning: Object.assign({}, options.reasoning, {
        dimensionScores: alignReasoningScoresToFinal(
          options.heuristicScores,
          options.reasoning.dimensionScores,
          previousScores,
        ),
      }),
      finalDimensionScores: previousScores,
    };
  }

  const previousTotal = getTotalScore(previousScores);
  const currentTotal = getTotalScore(options.finalDimensionScores);

  if (similarity < 0.88 || Math.abs(previousTotal - currentTotal) <= 5) {
    return {
      recalibrated: false,
      reusedPreviousScores: false,
      inputSimilarity: similarity,
      comparedVersionId: latestHistory.versionId,
      reasoning: options.reasoning,
      finalDimensionScores: options.finalDimensionScores,
    };
  }

  if (options.deadlineAt - Date.now() < MIN_RECALIBRATION_BUDGET_MS) {
    return {
      recalibrated: false,
      reusedPreviousScores: false,
      inputSimilarity: similarity,
      comparedVersionId: latestHistory.versionId,
      reasoning: options.reasoning,
      finalDimensionScores: options.finalDimensionScores,
    };
  }

  const recalibrationMessages = [
    {
      role: "system",
      content:
        "你在做同一项目的评分稳定性复核。若输入改动极小，分数不应跳变。请输出与之前相同 JSON 结构，必要时微调，但不能无依据大幅波动。",
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          currentInput: options.snapshot,
          previousInput: previousInput,
          previousFinalScores: previousScores,
          currentInitialReasoning: options.reasoning,
        },
        null,
        2,
      ),
    },
  ];

  const recalibrated = await callStructuredGLM({
    deadlineAt: options.deadlineAt,
    messages: recalibrationMessages,
    temperature: 0.1,
  });
  const recalibratedReasoning = normalizeReasoningResult(
    recalibrated.parsed,
    options.snapshot,
  );

  return {
    recalibrated: true,
    reusedPreviousScores: false,
    inputSimilarity: similarity,
    comparedVersionId: latestHistory.versionId,
    reasoning: recalibratedReasoning,
    finalDimensionScores: combineDimensionScores(
      options.heuristicScores,
      recalibratedReasoning.dimensionScores,
    ),
  };
}

function buildActions(finalDimensionScores, sectorLabel, snapshot) {
  const labels = {
    industry: sectorLabel || inferSectorLabel(snapshot),
    audience: snapshot.audience || "目标用户",
    product: snapshot.product || "当前方案",
  };

  return DIMENSIONS.map(function (dim) {
    const actionId = selectActionIdForDimension(dim.key, snapshot);
    return {
      key: dim.key,
      score: finalDimensionScores[dim.key],
      template: ACTIONS_BY_ID[actionId],
      label: dim.label,
    };
  })
    .filter(function (item) {
      return item.score < 6 && item.template;
    })
    .sort(function (a, b) {
      return a.score - b.score;
    })
    .slice(0, 3)
    .map(function (item, index) {
      return {
        actionId: item.template.actionId,
        toolId: TOOL_ID_STUDENT_STARTUP_SELF_CHECK,
        status: "待办",
        customNote: "",
        title: fillActionTemplate(item.template.title, labels),
        brief: fillActionTemplate(item.template.brief, labels),
        dimension: item.key,
        priority: index + 1,
        libraryVersion: ACTION_LIBRARY_VERSION,
      };
    });
}

function buildManualChecklist(snapshot, heuristicLayer) {
  const sectorLabel = inferSectorLabel(snapshot);
  const checklist = [];

  if (!hasUserInterviewEvidence(snapshot)) {
    checklist.push({
      title: "先补 5-10 个真实用户访谈",
      brief:
        "现在最缺的不是继续想功能，而是补到第一手证据。优先找真正会遇到这个问题的人，确认他们现在怎么解决、为什么现有方案不够好。",
    });
  }

  if (!isSpecificEnough(snapshot.audience) || !isSpecificEnough(snapshot.model)) {
    checklist.push({
      title: "把第一批用户和收费方式写具体",
      brief:
        "不要只写“大学生”或“以后再收费”。先写清楚第一批最容易触达的用户是谁，以及你准备先用什么方式验证他们愿不愿意留下联系方式或付费。",
    });
  }

  if (!hasTimeBoundPlan(snapshot)) {
    checklist.push({
      title: "写一份 7 天内能执行的验证计划",
      brief:
        "把本周要做的动作、样本数量和判断标准写出来，例如访谈多少人、上线什么最小页面、看到什么信号算继续做。",
    });
  }

  if (!hasMvpEvidence(snapshot)) {
    checklist.push({
      title: "做一个最小验证载体",
      brief:
        "不一定要完整产品。对 " +
        sectorLabel +
        " 这个方向，先用表单、落地页、Demo 或手动服务把关键假设跑起来。",
    });
  }

  if (!scoreTeamMatch(snapshot) || !snapshot.team) {
    checklist.push({
      title: "梳理当前团队缺口",
      brief:
        "把现有能力、缺失能力和下一位关键合作者画像列出来，避免项目推进到一半才发现核心环节没人能做。",
      });
  }

  if (!checklist.length) {
    checklist.push(
      {
        title: "把最大风险改成可验证问题",
        brief:
          "不要继续抽象讨论，直接把当前最不确定的一点改写成一句可验证假设，并给出本周验证动作。",
      },
      {
        title: "优先验证真实使用意愿",
        brief:
          "先拿到用户愿意停下来、愿意留下联系方式或愿意继续试用的信号，再考虑把方案做大。",
      },
      {
        title: "记录本轮输入和结果差异",
        brief:
          "把这次改了什么、分数为什么变化、下次准备补什么证据写下来，避免反复凭感觉迭代。",
      },
    );
  }

  return checklist.slice(0, 3);
}

function buildAnalysisMarkdown(result) {
  const rationaleLines = DIMENSIONS.map(function (dim) {
    return (
      "### " +
      dim.label +
      "\n" +
      (result.reasoningLayer.dimensionRationales[dim.key] ||
        "当前输入不足以支撑更高判断。")
    );
  }).join("\n\n");

  const strengths = result.reasoningLayer.strengths.length
    ? result.reasoningLayer.strengths.map(function (item) {
        return "- " + item;
      }).join("\n")
    : "- 暂无明显强信号，先把问题验证做扎实。";

  const risks = result.reasoningLayer.risks.length
    ? result.reasoningLayer.risks.map(function (item) {
        return "- " + item;
      }).join("\n")
    : "- 当前最大的风险是证据不足。";

  const nextActions = result.actions.length
    ? result.actions
        .map(function (action) {
          return (
            action.priority +
            ". **" +
            action.title +
            "**： " +
            action.brief
          );
        })
        .join("\n")
    : "1. 继续积累一手验证证据，把目前最高分的维度做成更强的正反馈。";

  const manualChecklist = Array.isArray(result.manualChecklist) && result.manualChecklist.length
    ? result.manualChecklist
        .map(function (item, index) {
          return index + 1 + ". **" + item.title + "**： " + item.brief;
        })
        .join("\n")
    : "";

  const degradationNote =
    result.gracefulDegradation &&
    result.gracefulDegradation.stage === "compact_advice"
      ? "## 当前模式\n这次主模型响应较慢，系统已自动切到快速模型，为你先生成了一份精简建议。内容可用于继续推进，但仍建议你后续再看一次完整版判断。\n"
      : result.gracefulDegradation &&
          result.gracefulDegradation.stage === "manual_checklist"
        ? "## 当前模式\n这次 AI 完整分析没有成功返回，系统先给你一份手动评估清单。内容已保存，不会丢失，你可以先按下面的动作继续推进。\n"
        : "";

  return [
    degradationNote,
    "## 整体评价",
    result.reasoningLayer.overallSummary || "这个方向还需要更多一手验证，先别急着自我说服。",
    "",
    "## 五维解释",
    rationaleLines,
    "",
    "## 当前最强信号",
    strengths,
    "",
    "## 当前最大风险",
    risks,
    "",
    "## 本周优先动作",
    nextActions,
    manualChecklist ? "\n## 手动评估清单\n" + manualChecklist : "",
  ].join("\n");
}

function buildOutputSnapshot(result) {
  return {
    generatedAt: nowIso(),
    totalScore: result.totalScore,
    tier: result.tier,
    finalDimensionScores: result.finalDimensionScores,
    heuristicLayer: result.heuristicLayer,
    reasoningLayer: result.reasoningLayer,
    actions: result.actions,
    actionLibraryVersion: ACTION_LIBRARY_VERSION,
    manualChecklist: result.manualChecklist || [],
    gracefulDegradation: result.gracefulDegradation || null,
    analysisMarkdown: result.analysisMarkdown,
    consistencyCheck: result.consistencyCheck,
  };
}

function buildFallbackResult(snapshot, heuristicLayer, latestHistory) {
  const finalDimensionScores = heuristicLayer.dimensionScores;
  const totalScore = getTotalScore(finalDimensionScores);
  const sectorLabel = inferSectorLabel(snapshot);
  const actions = buildActions(finalDimensionScores, sectorLabel, snapshot);
  const manualChecklist = buildManualChecklist(snapshot, heuristicLayer);
  const reasoningLayer = {
    dimensionScores: finalDimensionScores,
    dimensionRationales: DIMENSIONS.reduce(function (acc, dim) {
      acc[dim.key] = "AI 评分暂时不可用，先按规则层给出保守判断。";
      return acc;
    }, {}),
    overallSummary:
      "AI 专家评分暂时不可用，这次结果按确定性规则层生成。它适合拿来做本周行动清单，不建议当成最终结论。",
    strengths: heuristicLayer.triggeredRules
      .filter(function (rule) {
        return rule.hit;
      })
      .map(function (rule) {
        return rule.label;
      }),
    risks: heuristicLayer.triggeredRules
      .filter(function (rule) {
        return !rule.hit;
      })
      .map(function (rule) {
        return "缺少：" + rule.label;
      }),
    sectorLabel: sectorLabel,
  };

  const result = {
    totalScore: totalScore,
    tier: getTier(totalScore),
    finalDimensionScores: finalDimensionScores,
    heuristicLayer: heuristicLayer,
    reasoningLayer: reasoningLayer,
    actions: actions,
    manualChecklist: manualChecklist,
    gracefulDegradation: {
      stage: "manual_checklist",
      autoRetried: true,
      usedFallbackModel: false,
    },
    analysisMarkdown: "",
    consistencyCheck: {
      recalibrated: false,
      comparedVersionId: latestHistory ? latestHistory.versionId : null,
      inputSimilarity: 0,
      fallback: true,
      reusedPreviousScores: false,
    },
  };

  result.analysisMarkdown = buildAnalysisMarkdown(result);
  return result;
}

async function scoreStudentStartupSelfCheck(payload) {
  const deadlineAt = Date.now() + SCORING_DEADLINE_MS;
  const workspace = buildToolWorkspace(
    Object.assign({}, payload, {
      toolId: TOOL_ID_STUDENT_STARTUP_SELF_CHECK,
    }),
  );
  const latestHistory = getLatestHistory(workspace.toolHistory);
  const snapshot = buildInputSnapshot(workspace.toolState.draftData);
  const heuristicLayer = buildHeuristicLayer(snapshot);

  if (!snapshot.product || snapshot.product.length < 20) {
    throw new Error("产品描述至少需要 20 个字");
  }

  let result;
  try {
    const reasoningResponse = await callStructuredGLM({
      deadlineAt: deadlineAt,
      messages: buildReasoningMessages(snapshot, snapshot.mode),
      temperature: 0.2,
    });

    let reasoningLayer = normalizeReasoningResult(reasoningResponse.parsed, snapshot);
    let finalDimensionScores = combineDimensionScores(
      heuristicLayer.dimensionScores,
      reasoningLayer.dimensionScores,
    );

    const recalibration = await maybeRecalibrateWithHistory({
      deadlineAt: deadlineAt,
      latestHistory: latestHistory,
      snapshot: snapshot,
      heuristicScores: heuristicLayer.dimensionScores,
      finalDimensionScores: finalDimensionScores,
      reasoning: reasoningLayer,
    });

    if (recalibration.recalibrated || recalibration.reusedPreviousScores) {
      reasoningLayer = recalibration.reasoning;
      finalDimensionScores = recalibration.finalDimensionScores;
    }

    const totalScore = getTotalScore(finalDimensionScores);
    const sectorLabel = reasoningLayer.sectorLabel || inferSectorLabel(snapshot);
    const actions = buildActions(finalDimensionScores, sectorLabel, snapshot);

    result = {
      totalScore: totalScore,
      tier: getTier(totalScore),
      finalDimensionScores: finalDimensionScores,
      heuristicLayer: heuristicLayer,
      reasoningLayer: reasoningLayer,
      actions: actions,
      manualChecklist: [],
      gracefulDegradation: {
        stage: reasoningResponse.usedFallbackModel ? "compact_advice" : "full_analysis",
        autoRetried: Boolean(reasoningResponse.retriedPrimary),
        usedFallbackModel: Boolean(reasoningResponse.usedFallbackModel),
      },
      consistencyCheck: {
        recalibrated: recalibration.recalibrated,
        reusedPreviousScores: recalibration.reusedPreviousScores,
        comparedVersionId: recalibration.comparedVersionId,
        inputSimilarity: recalibration.inputSimilarity,
        fallback: false,
      },
    };
    result.analysisMarkdown = buildAnalysisMarkdown(result);
  } catch (err) {
    result = buildFallbackResult(snapshot, heuristicLayer, latestHistory);
    result.fallbackReason = err.message;
  }

  const historyEntry = {
    versionId: createId("ver"),
    inputSnapshot: snapshot,
    outputSnapshot: buildOutputSnapshot(result),
    isShared: false,
    createdAt: nowIso(),
  };

  const toolHistory = appendHistory(workspace.toolHistory, historyEntry, 20);

  return {
    ok: true,
    toolId: TOOL_ID_STUDENT_STARTUP_SELF_CHECK,
    userProfile: workspace.userProfile,
    toolState: workspace.toolState,
    toolHistory: toolHistory,
    historyEntry: historyEntry,
    scoring: result,
    outputSnapshot: historyEntry.outputSnapshot,
  };
}

module.exports = {
  ACTION_LIBRARY,
  ACTION_LIBRARY_VERSION,
  DIMENSIONS,
  TOOL_ID_STUDENT_STARTUP_SELF_CHECK,
  buildActions,
  buildHeuristicLayer,
  buildInputSnapshot,
  buildManualChecklist,
  calculateInputSimilarity,
  combineDimensionScores,
  alignReasoningScoresToFinal,
  getTier,
  getTotalScore,
  inferSectorLabel,
  isExactSnapshotMatch,
  selectActionIdForDimension,
  scoreStudentStartupSelfCheck,
};
