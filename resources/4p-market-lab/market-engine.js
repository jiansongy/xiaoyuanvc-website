const sum = (values) => Object.values(values).reduce((total, value) => total + value, 0);

const SEGMENTS = {
  exam: {
    baseUnits: 420,
    productFit: { focus: 1, balanced: 0.8, social: 0.55 },
    priceFit: { 6: 1, 8: 0.82, 10: 0.6 },
    placeFit: { vending: 0.5, convenience: 0.35, cafe: 0.15 },
    promotionFit: { sampling: 0.45, communities: 0.35, shortVideo: 0.2 },
  },
  health: {
    baseUnits: 480,
    productFit: { focus: 0.55, balanced: 0.9, social: 0.75 },
    priceFit: { 6: 0.95, 8: 0.85, 10: 0.65 },
    placeFit: { vending: 0.2, convenience: 0.5, cafe: 0.3 },
    promotionFit: { sampling: 0.4, communities: 0.4, shortVideo: 0.2 },
  },
  social: {
    baseUnits: 300,
    productFit: { focus: 0.65, balanced: 0.75, social: 1 },
    priceFit: { 6: 0.9, 8: 1, 10: 0.95 },
    placeFit: { vending: 0.15, convenience: 0.35, cafe: 0.5 },
    promotionFit: { sampling: 0.2, communities: 0.3, shortVideo: 0.5 },
  },
};

const TARGET_STRATEGIES = {
  exam: { product: "focus", price: 6, place: "vending", promotion: "sampling" },
  health: { product: "balanced", price: 8, place: "convenience", promotion: "communities" },
  social: { product: "social", price: 10, place: "cafe", promotion: "shortVideo" },
};

const PRODUCT_FACTORS = {
  focus: "强效提神配方",
  balanced: "均衡轻负担配方",
  social: "清爽社交配方",
};

const TARGET_FACTORS = {
  exam: "考试周人群的核心任务",
  health: "健康管理人群的日常需求",
  social: "社交尝新人群的消费场景",
};

const PRICE_MATCH_FACTORS = {
  exam: "6 元价格降低了考试周人群的尝试门槛",
  health: "8 元价格符合健康管理人群的日常预算",
  social: "10 元价格匹配社交尝新人群的溢价意愿",
};

const PLACE_LABELS = {
  vending: "自动售货机",
  convenience: "校园便利店",
  cafe: "校园咖啡店",
};

const PROMOTION_LABELS = {
  sampling: "试饮活动",
  communities: "学生社群合作",
  shortVideo: "校园短视频",
};

const weightedFit = (allocation, fit, budget) =>
  Object.entries(allocation).reduce((total, [key, value]) => total + (value / budget) * fit[key], 0);

const largestAllocation = (allocation) =>
  Object.entries(allocation).reduce((largest, entry) => (entry[1] > largest[1] ? entry : largest))[0];

export function evaluateMarket(decision) {
  if (
    !Object.hasOwn(SEGMENTS, decision.targetSegment) ||
    !["focus", "balanced", "social"].includes(decision.product) ||
    ![6, 8, 10].includes(decision.price)
  ) {
    throw new Error("决策包含场景之外的选项");
  }
  const allocations = [...Object.values(decision.place), ...Object.values(decision.promotion)];
  if (allocations.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error("预算不能为负数");
  }
  if (sum(decision.place) !== 40) {
    throw new Error("渠道预算必须正好分配 40 点");
  }
  if (sum(decision.promotion) !== 60) {
    throw new Error("推广预算必须正好分配 60 点");
  }

  const segmentUnits = Object.fromEntries(
    Object.entries(SEGMENTS).map(([segmentId, segment]) => {
      const productFit = segment.productFit[decision.product];
      const priceFit = segment.priceFit[decision.price];
      const placeReach = 0.55 + weightedFit(decision.place, segment.placeFit, 40) * 0.75;
      const awareness = 0.5 + weightedFit(decision.promotion, segment.promotionFit, 60) * 0.9;
      const targeting = segmentId === decision.targetSegment ? 1.12 : 0.94;
      const units = Math.round(segment.baseUnits * productFit * priceFit * placeReach * awareness * targeting);
      return [segmentId, units];
    }),
  );

  const unitsSold = sum(segmentUnits);
  const revenue = unitsSold * decision.price;
  const channelUnitCost =
    (decision.place.vending / 40) * 0.8 +
    (decision.place.convenience / 40) * 1.2 +
    (decision.place.cafe / 40) * 1.8;
  const totalCost = Math.round(unitsSold * 3.2 + unitsSold * channelUnitCost + 1000);
  const dominantPlace = largestAllocation(decision.place);
  const dominantPromotion = largestAllocation(decision.promotion);
  const target = TARGET_STRATEGIES[decision.targetSegment];
  const remainingInventory = Math.max(0, 800 - unitsSold);
  const inventoryRisk = remainingInventory > 250 ? "high" : remainingInventory > 100 ? "medium" : "low";

  const satisfactionPoints = Object.entries(segmentUnits).reduce((total, [segmentId, units]) => {
    const segment = SEGMENTS[segmentId];
    return total + units * (segment.productFit[decision.product] * 60 + segment.priceFit[decision.price] * 40);
  }, 0);

  const consistency = [
    decision.product === target.product,
    decision.price === target.price,
    dominantPlace === target.place,
    dominantPromotion === target.promotion,
  ].filter(Boolean).length * 25;

  return {
    unitsSold,
    marketShare: Math.round((unitsSold / (unitsSold + 1000)) * 100),
    revenue,
    totalCost,
    profit: revenue - totalCost,
    satisfaction: Math.round(satisfactionPoints / unitsSold),
    inventoryRisk,
    consistency,
    segmentUnits,
    factors: [
      `${PRODUCT_FACTORS[decision.product]}符合${TARGET_FACTORS[decision.targetSegment]}`,
      decision.price === target.price ? PRICE_MATCH_FACTORS[decision.targetSegment] : `${decision.price} 元价格改变了目标人群的购买意愿`,
      `${PLACE_LABELS[dominantPlace]}是本轮覆盖最强的渠道`,
      `${PROMOTION_LABELS[dominantPromotion]}是本轮触达最强的推广方式`,
      `预计剩余 ${remainingInventory} 罐，${inventoryRisk === "low" ? "库存压力较低" : "存在一定库存压力"}`,
    ],
    ruleVersion: "campus-tea-v1",
  };
}
