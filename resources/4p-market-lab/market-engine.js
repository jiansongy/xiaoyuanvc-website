const sum = (values) => Object.values(values).reduce((total, value) => total + value, 0);
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
const round1 = (value) => Math.round(value * 10) / 10;

const SEGMENTS = {
  exam: {
    label: "备考中学生",
    baseUnits: 460,
    baseWtp: 6.3,
    priceSensitivity: 0.17,
    preferredAttribute: "energy",
    attributeUtility: { energy: 2.2, design: 0.4, ingredients: 0.5 },
    placeFit: { vending: 1, convenience: 0.72, cafe: 0.35 },
    mediaFit: { sampling: 0.78, communities: 1, shortVideo: 0.4 },
    messageFit: { lowPrice: 1, energy: 1, design: 0.35, ingredients: 0.45 },
  },
  health: {
    label: "健康管理学生",
    baseUnits: 500,
    baseWtp: 7,
    priceSensitivity: 0.13,
    preferredAttribute: "ingredients",
    attributeUtility: { energy: 0.2, design: 0.6, ingredients: 2.3 },
    placeFit: { vending: 0.45, convenience: 1, cafe: 0.68 },
    mediaFit: { sampling: 0.8, communities: 1, shortVideo: 0.45 },
    messageFit: { lowPrice: 0.55, energy: 0.45, design: 0.5, ingredients: 1 },
  },
  social: {
    label: "社交尝新人群",
    baseUnits: 340,
    baseWtp: 7.6,
    priceSensitivity: 0.1,
    preferredAttribute: "design",
    attributeUtility: { energy: 0.6, design: 2.2, ingredients: 1 },
    placeFit: { vending: 0.38, convenience: 0.65, cafe: 1 },
    mediaFit: { sampling: 0.62, communities: 0.65, shortVideo: 1 },
    messageFit: { lowPrice: 0.45, energy: 0.5, design: 1, ingredients: 0.7 },
  },
};

const ATTRIBUTE_DEFINITIONS = {
  energy: { upgradedValue: "strong", cost: 1.5, label: "强效提神" },
  design: { upgradedValue: "visual", cost: 1, label: "高颜值包装" },
  ingredients: { upgradedValue: "clean", cost: 0.8, label: "清洁环保原料" },
};

const PRODUCT_VALUES = {
  energy: ["balanced", "strong"],
  design: ["standard", "visual"],
  ingredients: ["standard", "clean"],
};

const MESSAGE_LABELS = {
  lowPrice: "价格实惠",
  energy: "强效提神",
  design: "高颜值",
  ingredients: "清洁环保",
};

const PLACE_LABELS = {
  vending: "自动售货机",
  convenience: "校园便利店",
  cafe: "校园咖啡店",
};

const MEDIA_LABELS = {
  sampling: "试饮活动",
  communities: "学生社群",
  shortVideo: "校园短视频",
};

const weightedFit = (allocation, fit, budget) =>
  Object.entries(allocation).reduce((total, [key, value]) => total + (value / budget) * fit[key], 0);

const weightedDiminishingFit = (allocation, fit, budget) => {
  const weightedEntries = Object.entries(allocation).map(([key, value]) => ({
    fit: fit[key],
    weight: Math.sqrt(value / budget),
  }));
  const totalWeight = weightedEntries.reduce((total, entry) => total + entry.weight, 0);
  return totalWeight
    ? weightedEntries.reduce((total, entry) => total + entry.fit * entry.weight, 0) / totalWeight
    : 0;
};

const largestAllocation = (allocation) =>
  Object.entries(allocation).reduce((largest, entry) => (entry[1] > largest[1] ? entry : largest))[0];

const hasExactKeys = (object, expectedKeys) =>
  object &&
  Object.keys(object).length === expectedKeys.length &&
  expectedKeys.every((key) => Object.hasOwn(object, key));

function capSegmentUnits(rawSegmentUnits, inventory) {
  const rawUnits = sum(rawSegmentUnits);
  if (rawUnits <= inventory) return rawSegmentUnits;
  const scaled = Object.entries(rawSegmentUnits).map(([segmentId, units]) => {
    const exact = units * inventory / rawUnits;
    return { segmentId, units: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  let remaining = inventory - scaled.reduce((total, entry) => total + entry.units, 0);
  scaled.sort((left, right) => right.remainder - left.remainder);
  for (let index = 0; index < remaining; index += 1) scaled[index].units += 1;
  return Object.fromEntries(scaled.map(({ segmentId, units }) => [segmentId, units]));
}

const isUpgraded = (product, attribute) =>
  product[attribute] === ATTRIBUTE_DEFINITIONS[attribute].upgradedValue;

export function calculateUnitProductCost(product) {
  return round1(3.2 + Object.keys(ATTRIBUTE_DEFINITIONS).reduce(
    (cost, attribute) => cost + (isUpgraded(product, attribute) ? ATTRIBUTE_DEFINITIONS[attribute].cost : 0),
    0,
  ));
}

function calculateWtp(segment, product) {
  return round1(segment.baseWtp + Object.keys(ATTRIBUTE_DEFINITIONS).reduce(
    (value, attribute) => value + (isUpgraded(product, attribute) ? segment.attributeUtility[attribute] : 0),
    0,
  ));
}

function calculatePriceAcceptance(segment, wtp, price) {
  const gap = wtp - price;
  return gap >= 0
    ? clamp(0.74 + gap * 0.07, 0.74, 1)
    : clamp(0.74 + gap * segment.priceSensitivity, 0.2, 0.74);
}

function calculateClaimSupport(decision, targetWtp) {
  if (decision.promotion.message === "lowPrice") {
    if (decision.price <= targetWtp - 1) return 1;
    if (decision.price <= targetWtp) return 0.68;
    return 0.35;
  }
  return isUpgraded(decision.product, decision.promotion.message) ? 1 : 0.35;
}

function impactFor(score) {
  if (score >= 80) return "positive";
  if (score >= 60) return "mixed";
  return "negative";
}

function validateDecision(decision) {
  if (!Object.hasOwn(SEGMENTS, decision.targetSegment) || ![6, 8, 10].includes(decision.price)) {
    throw new Error("决策包含场景之外的选项");
  }
  if (!hasExactKeys(decision.product, ["energy", "design", "ingredients"]) || Object.entries(PRODUCT_VALUES).some(
    ([attribute, values]) => !values.includes(decision.product[attribute]),
  )) {
    throw new Error("决策包含场景之外的产品属性");
  }
  if (!hasExactKeys(decision.place, ["vending", "convenience", "cafe"])) {
    throw new Error("决策包含场景之外的渠道方案");
  }
  if (
    !hasExactKeys(decision.promotion, ["message", "media"]) ||
    !["lowPrice", "energy", "design", "ingredients"].includes(decision.promotion.message) ||
    !hasExactKeys(decision.promotion.media, ["sampling", "communities", "shortVideo"])
  ) {
    throw new Error("决策包含场景之外的传播方案");
  }
  const allocations = [...Object.values(decision.place), ...Object.values(decision.promotion.media)];
  if (allocations.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error("预算不能为负数");
  }
  if (sum(decision.place) !== 40) {
    throw new Error("渠道预算必须正好分配 40 点");
  }
  if (sum(decision.promotion.media) !== 60) {
    throw new Error("推广预算必须正好分配 60 点");
  }
}

export function evaluateMarket(decision) {
  validateDecision(decision);

  const target = SEGMENTS[decision.targetSegment];
  const targetWtp = calculateWtp(target, decision.product);
  const claimSupport = calculateClaimSupport(decision, targetWtp);
  const dominantPlace = largestAllocation(decision.place);
  const dominantMedia = largestAllocation(decision.promotion.media);
  const unitProductCost = calculateUnitProductCost(decision.product);
  const diagnostics = {};

  const rawSegmentUnits = Object.fromEntries(Object.entries(SEGMENTS).map(([segmentId, segment]) => {
    const willingnessToPay = calculateWtp(segment, decision.product);
    const priceAcceptance = calculatePriceAcceptance(segment, willingnessToPay, decision.price);
    const mediaReach = weightedDiminishingFit(decision.promotion.media, segment.mediaFit, 60);
    const messageMatch = segment.messageFit[decision.promotion.message];
    const promotionMatch = messageMatch * claimSupport;
    const awareness = 0.48 + 0.5 * mediaReach * promotionMatch;
    const placeMatch = weightedFit(decision.place, segment.placeFit, 40);
    const availability = 0.58 + 0.42 * placeMatch;
    const targeting = segmentId === decision.targetSegment ? 1.12 : 0.94;
    diagnostics[segmentId] = {
      willingnessToPay,
      mediaReach,
      promotionMatch,
      availability,
      placeMatch,
    };
    return [segmentId, Math.round(segment.baseUnits * priceAcceptance * awareness * availability * targeting)];
  }));

  const segmentUnits = capSegmentUnits(rawSegmentUnits, 800);
  const unitsSold = sum(segmentUnits);
  const revenue = unitsSold * decision.price;
  const channelUnitCost =
    (decision.place.vending / 40) * 0.8 +
    (decision.place.convenience / 40) * 1.2 +
    (decision.place.cafe / 40) * 1.8;
  const totalCost = Math.round(unitsSold * (unitProductCost + channelUnitCost) + 1000);
  const remainingInventory = Math.max(0, 800 - unitsSold);
  const inventoryRisk = remainingInventory > 250 ? "high" : remainingInventory > 100 ? "medium" : "low";

  const satisfactionPoints = Object.entries(segmentUnits).reduce((total, [segmentId, units]) => {
    const gap = diagnostics[segmentId].willingnessToPay - decision.price;
    return total + units * clamp(Math.round(62 + gap * 6), 35, 95);
  }, 0);

  const targetDiagnostics = diagnostics[decision.targetSegment];
  const productAlignment = isUpgraded(decision.product, target.preferredAttribute) ? 100 : 55;
  const priceAlignment = clamp(Math.round(100 - Math.abs((targetWtp - decision.price) - 0.5) * 16), 35, 100);
  const promotionAlignment = Math.round(100 * targetDiagnostics.mediaReach * targetDiagnostics.promotionMatch);
  const placeAlignment = Math.round(100 * targetDiagnostics.placeMatch);
  const consistencyParts = {
    product: productAlignment,
    price: priceAlignment,
    promotion: promotionAlignment,
    place: placeAlignment,
  };
  const consistency = Math.round(sum(consistencyParts) / 4);

  const upgrades = Object.entries(ATTRIBUTE_DEFINITIONS)
    .filter(([attribute]) => isUpgraded(decision.product, attribute))
    .map(([, definition]) => definition.label);
  const attributeValue = round1(targetWtp - target.baseWtp);
  const productDetail = upgrades.length
    ? `${upgrades.join("、")}让${target.label}的感知价值增加约 ${attributeValue} 元，同时将单位产品成本提高到 ${unitProductCost} 元。`
    : `基础配置把单位产品成本控制在 ${unitProductCost} 元，但没有通过属性升级提高${target.label}的感知价值。`;
  const priceGap = round1(targetWtp - decision.price);
  const priceDetail = priceGap >= 0
    ? `${decision.price} 元售价低于${target.label}约 ${targetWtp} 元的支付意愿，购买门槛较低，但仍需关注价值获取和利润。`
    : `${decision.price} 元售价高于${target.label}约 ${targetWtp} 元的支付意愿，价格接受度因此下降。`;
  const promotionDetail = `${MESSAGE_LABELS[decision.promotion.message]}信息通过${MEDIA_LABELS[dominantMedia]}重点传播；顾客关注、产品兑现和媒体覆盖的综合匹配为 ${promotionAlignment}/100。`;
  const placeDetail = `${PLACE_LABELS[dominantPlace]}获得最多渠道投入；对${target.label}的渠道覆盖匹配为 ${placeAlignment}/100。`;

  const causalTrace = [
    { dimension: "product", title: "Product · 产品价值与成本", detail: productDetail, impact: impactFor(productAlignment) },
    { dimension: "price", title: "Price · 支付意愿与定价", detail: priceDetail, impact: impactFor(priceAlignment) },
    { dimension: "promotion", title: "Promotion · 信息与媒体", detail: promotionDetail, impact: impactFor(promotionAlignment) },
    { dimension: "place", title: "Place · 购买便利", detail: placeDetail, impact: impactFor(placeAlignment) },
  ];
  const traceByDimension = Object.fromEntries(causalTrace.map((trace) => [trace.dimension, trace]));
  const inconsistencies = Object.entries(consistencyParts)
    .sort((left, right) => left[1] - right[1])
    .slice(0, 2)
    .map(([dimension, score]) => `${traceByDimension[dimension].title}（${score}/100）：${traceByDimension[dimension].detail}`);

  return {
    unitsSold,
    marketShare: Math.round((unitsSold / (unitsSold + 1000)) * 100),
    revenue,
    totalCost,
    profit: revenue - totalCost,
    unitProductCost,
    targetWtp,
    satisfaction: unitsSold ? Math.round(satisfactionPoints / unitsSold) : 0,
    channelCoverage: Math.round(targetDiagnostics.availability * 100),
    inventoryRisk,
    consistency,
    segmentUnits,
    causalTrace,
    inconsistencies,
    ruleVersion: "campus-tea-v1.1",
  };
}
