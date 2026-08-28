import { calculateUnitProductCost, evaluateMarket } from "./market-engine.js";
import { fetchWithTimeout } from "./http.js";

const STORAGE_KEY = "xyvc-4p-market-lab-v1.1";
const API_BASE = document.querySelector('meta[name="4p-api-base"]')?.content.replace(/\/$/, "") || "";
const STAGES = ["任务", "调研", "第一轮", "结果", "解释", "第二轮", "复盘"];

const ROLES = {
  customerExam: {
    label: "考试周学生",
    boundary: "只表达考试周场景中的需要、顾虑和购买习惯，不代表全部学生。",
    greeting: "我最近在准备考试，下午最容易困。你可以问我看重什么、预算大概多少、在哪里看到新品。",
  },
  customerHealth: {
    label: "健康型学生",
    boundary: "关注成分、负担和日常饮用，不会替团队评价完整营销方案。",
    greeting: "我会看配料和咖啡因，也关心日常预算。你可以问我什么产品特质值得多付一点。",
  },
  customerSocial: {
    label: "社交尝新人群",
    boundary: "关注口味、包装和分享场景，不提供市场规模或销量数字。",
    greeting: "新品如果有记忆点，我愿意和朋友一起试。你可以问我包装、价格和常看的校园内容。",
  },
  channel: {
    label: "校园渠道商",
    boundary: "只讨论渠道条件、周转和合作要求，不决定最终销量。",
    greeting: "我是校园便利店和售货机运营方。上架空间有限，我更在意周转速度和补货风险。",
  },
  director: {
    label: "营销总监",
    boundary: "只追问依据、矛盾和修改理由，不告诉你唯一正确答案。",
    greeting: "我会根据你们已经提交的决策和正式结果追问。先说说：哪一个结果最偏离预期？",
  },
};

const DEFAULT_DECISION = {
  targetSegment: "exam",
  product: { energy: "balanced", design: "standard", ingredients: "standard" },
  price: 8,
  place: { vending: 14, convenience: 16, cafe: 10 },
  promotion: {
    message: "energy",
    media: { sampling: 20, communities: 20, shortVideo: 20 },
  },
  expectation: "",
  revision: null,
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
}[char]));

function createInitialState() {
  const animals = ["海獭", "雨燕", "雪豹", "青鹭", "赤狐", "云雀"];
  const number = Math.floor(Math.random() * 900 + 100);
  return {
    version: 2,
    sessionId: crypto.randomUUID(),
    teamAlias: `${animals[Math.floor(Math.random() * animals.length)]}-${number}`,
    stage: 0,
    activeRole: "customerExam",
    visitedRoles: [],
    chats: Object.fromEntries(Object.keys(ROLES).map((role) => [role, []])),
    round1: clone(DEFAULT_DECISION),
    round2: clone(DEFAULT_DECISION),
    result1: null,
    result2: null,
    reflection: "",
    feedbackSubmitted: false,
    feedbackId: "",
    modeCounts: { ai: 0, fallback: 0 },
  };
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed?.version === 2 && parsed.sessionId) return parsed;
  } catch {}
  return createInitialState();
}

let state = loadState();

const workspace = document.querySelector("#workspace-panel");
const teamAlias = document.querySelector("#team-alias");
const progress = document.querySelector("#progress");
const roleTabs = document.querySelector("#role-tabs");
const roleBoundary = document.querySelector("#role-boundary");
const chatLog = document.querySelector("#chat-log");
const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const coachMode = document.querySelector("#coach-mode");

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setStage(stage) {
  state.stage = stage;
  if (stage >= 4) state.activeRole = "director";
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderProgress() {
  progress.innerHTML = STAGES.map((label, index) => `
    <span class="progress-step ${index === state.stage ? "is-current" : index < state.stage ? "is-done" : ""}" data-short="${index + 1}" ${index === state.stage ? 'aria-current="step"' : ""}>
      ${index + 1}. ${label}
    </span>
  `).join("");
}

function resultMarkup(result, roundLabel) {
  return `
    <span class="round-label">${roundLabel} · 规则 ${result.ruleVersion}</span>
    <div class="metric-grid">
      <div class="metric-card"><span>销量</span><strong>${result.unitsSold} 罐</strong></div>
      <div class="metric-card"><span>市场份额</span><strong>${result.marketShare}%</strong></div>
      <div class="metric-card"><span>收入</span><strong>¥${result.revenue}</strong></div>
      <div class="metric-card"><span>总成本</span><strong>¥${result.totalCost}</strong></div>
      <div class="metric-card ${result.profit >= 0 ? "is-positive" : "is-negative"}"><span>利润</span><strong>¥${result.profit}</strong></div>
      <div class="metric-card"><span>顾客满意度</span><strong>${result.satisfaction}</strong></div>
      <div class="metric-card"><span>4P 一致性</span><strong>${result.consistency}</strong></div>
      <div class="metric-card"><span>目标顾客支付意愿</span><strong>约 ¥${result.targetWtp}</strong></div>
      <div class="metric-card"><span>单位产品成本</span><strong>¥${result.unitProductCost}</strong></div>
      <div class="metric-card"><span>渠道覆盖</span><strong>${result.channelCoverage}%</strong></div>
      <div class="metric-card"><span>库存风险</span><strong>${({ low: "低", medium: "中", high: "高" })[result.inventoryRisk]}</strong></div>
    </div>
    <h3>这组结果是怎么发生的？</h3>
    <div class="causal-grid">${result.causalTrace.map((trace) => `
      <article class="causal-card is-${trace.impact}">
        <h4>${escapeHtml(trace.title)}</h4>
        <p>${escapeHtml(trace.detail)}</p>
      </article>`).join("")}
    </div>
    <section class="inconsistency-panel">
      <h3>最需要检查的两处不一致</h3>
      <ol>${result.inconsistencies.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
    </section>
  `;
}

function renderBrief() {
  const hasCode = Boolean(sessionStorage.getItem("xyvc-4p-code"));
  workspace.innerHTML = `
    <div class="stage-intro">
      <p class="eyebrow">STEP 1 · 统一市场任务</p>
      <h2>让一款新品在校园里活下来</h2>
      <p>你们有 800 罐首批库存，需要决定为谁升级哪些产品属性、定什么价格、传播什么价值、在哪里卖。没有随机事件，也没有隐藏骰子。</p>
    </div>
    <div class="scenario-grid">
      <article class="scenario-card"><h3>考试周学生 · 35%</h3><p>需要快速提神、购买方便，对价格比较敏感，也担心影响睡眠。</p></article>
      <article class="scenario-card"><h3>健康管理学生 · 40%</h3><p>关注无糖、成分透明和日常负担，便利店是主要购买场景。</p></article>
      <article class="scenario-card"><h3>社交尝新人群 · 25%</h3><p>在意包装、口味和朋友推荐，愿意为有记忆点的新品多付一点。</p></article>
      <article class="scenario-card"><h3>统一约束</h3><p>渠道预算 40 点、推广预算 60 点；基础成本 ¥3.2，产品升级会增加单位成本，首批库存 800 罐。</p></article>
    </div>
    <div class="callout"><strong>正式结果由固定规则计算。</strong> AI 角色只能提供有限信息和追问，不能改变销量、利润或评分。</div>
    <form class="experience-code" id="experience-code-form">
      <div class="field">
        <label for="experience-code">内部体验码</label>
        <div class="code-input-row">
          <input id="experience-code" type="password" maxlength="40" autocomplete="off" placeholder="请输入同事体验码" value="${hasCode ? "••••••" : ""}" />
          <button class="code-visibility" id="code-visibility" type="button" aria-pressed="false">显示</button>
        </div>
      </div>
      <button class="secondary-button" type="submit">${hasCode ? "更新体验码" : "验证体验码"}</button>
      <span id="code-status">${hasCode ? "本次会话已验证" : "请输入同事体验码后开始"}</span>
    </form>
    <div class="button-row"><button class="primary-button" id="start-research" type="button" ${hasCode ? "" : "disabled"}>开始市场调研</button></div>
  `;
  const codeInput = document.querySelector("#experience-code");
  const visibilityButton = document.querySelector("#code-visibility");
  visibilityButton.addEventListener("click", () => {
    const willShow = codeInput.type === "password";
    codeInput.type = willShow ? "text" : "password";
    visibilityButton.textContent = willShow ? "隐藏" : "显示";
    visibilityButton.setAttribute("aria-pressed", String(willShow));
  });
  document.querySelector("#experience-code-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = codeInput;
    const candidate = input.value === "••••••" ? sessionStorage.getItem("xyvc-4p-code") : input.value.trim();
    const status = document.querySelector("#code-status");
    if (!candidate) return;
    status.textContent = "正在验证…";
    try {
      const response = await fetchWithTimeout(`${API_BASE}/api/access`, {
        method: "POST",
        headers: { "X-Experience-Code": candidate },
      }, 8000);
      if (response.status === 401) {
        status.textContent = "体验码不正确。可点击“显示”检查输入后重试";
        sessionStorage.removeItem("xyvc-4p-code");
        document.querySelector("#start-research").disabled = true;
        return;
      }
      if (response.status === 429) {
        status.textContent = "尝试过于频繁，请稍后再试";
        return;
      }
      if (!response.ok) throw new Error(`access service returned ${response.status}`);
      sessionStorage.setItem("xyvc-4p-code", candidate);
      status.textContent = "验证成功，仅保存在本次浏览器会话";
      input.value = "••••••";
      document.querySelector("#start-research").disabled = false;
    } catch {
      sessionStorage.removeItem("xyvc-4p-code");
      status.textContent = "没有连接到验证服务，请检查网络后重试";
      document.querySelector("#start-research").disabled = true;
    }
  });
  document.querySelector("#start-research").addEventListener("click", () => setStage(1));
}

function renderResearch() {
  const customerDone = state.visitedRoles.some((role) => role.startsWith("customer"));
  const channelDone = state.visitedRoles.includes("channel");
  workspace.innerHTML = `
    <div class="stage-intro">
      <p class="eyebrow">STEP 2 · 角色调研</p>
      <h2>先听，再决定</h2>
      <p>至少访谈一位顾客和一位渠道商。角色只知道自己的真实处境，不会替你汇总市场答案。</p>
    </div>
    <div class="interview-status">
      <article class="status-card"><h3>${customerDone ? "✓" : "○"} 顾客访谈</h3><p>${customerDone ? "已获得一类顾客的直接反馈。" : "从右侧选择一位顾客并提出至少一个问题。"}</p></article>
      <article class="status-card"><h3>${channelDone ? "✓" : "○"} 渠道访谈</h3><p>${channelDone ? "已了解渠道方的合作条件。" : "询问校园渠道商上架、周转或资源条件。"}</p></article>
    </div>
    <div class="callout">建议问法：“什么属性值得你多付一点？”“你的预算大概在哪个范围？”“你通常在哪里看到和购买新品？”</div>
    <div class="button-row"><button class="primary-button" id="finish-research" type="button" ${customerDone && channelDone ? "" : "disabled"}>完成调研，进入第一轮</button></div>
  `;
  document.querySelector("#finish-research").addEventListener("click", () => setStage(2));
}

function decisionFormMarkup(round) {
  const decision = state[round];
  const isRound2 = round === "round2";
  const revision = decision.revision || { evidence: "", expectedMetric: "unitsSold", expectedDirection: "increase" };
  return `
    <form class="decision-form" id="decision-form" data-round="${round}">
      <div class="form-row">
        <div class="field"><label for="targetSegment">目标顾客</label><select id="targetSegment" name="targetSegment">
          <option value="exam" ${decision.targetSegment === "exam" ? "selected" : ""}>考试周学生</option>
          <option value="health" ${decision.targetSegment === "health" ? "selected" : ""}>健康管理学生</option>
          <option value="social" ${decision.targetSegment === "social" ? "selected" : ""}>社交尝新人群</option>
        </select></div>
        <div class="field"><label for="price">Price · 单价</label><select id="price" name="price">
          <option value="6" ${decision.price === 6 ? "selected" : ""}>¥6</option>
          <option value="8" ${decision.price === 8 ? "selected" : ""}>¥8</option>
          <option value="10" ${decision.price === 10 ? "selected" : ""}>¥10</option>
        </select></div>
        <div class="cost-preview"><span>当前单位产品成本</span><strong id="unit-cost">¥${calculateUnitProductCost(decision.product)}</strong><small>升级属性会增加成本，但对不同顾客创造的价值不同。</small></div>
      </div>

      <section class="allocation-group product-group">
        <div class="allocation-header"><h3>Product · 三项产品属性</h3><span class="budget-total">没有免费的升级</span></div>
        <div class="attribute-grid">
          <div class="field"><label for="energy">功能强度</label><select id="energy" name="energy">
            <option value="balanced" ${decision.product.energy === "balanced" ? "selected" : ""}>均衡提神 · 基础成本</option>
            <option value="strong" ${decision.product.energy === "strong" ? "selected" : ""}>强效提神 · 成本 +¥1.5</option>
          </select></div>
          <div class="field"><label for="design">包装设计</label><select id="design" name="design">
            <option value="standard" ${decision.product.design === "standard" ? "selected" : ""}>标准包装 · 基础成本</option>
            <option value="visual" ${decision.product.design === "visual" ? "selected" : ""}>高颜值包装 · 成本 +¥1.0</option>
          </select></div>
          <div class="field"><label for="ingredients">原料特质</label><select id="ingredients" name="ingredients">
            <option value="standard" ${decision.product.ingredients === "standard" ? "selected" : ""}>标准原料 · 基础成本</option>
            <option value="clean" ${decision.product.ingredients === "clean" ? "selected" : ""}>清洁环保原料 · 成本 +¥0.8</option>
          </select></div>
        </div>
      </section>

      <section class="allocation-group">
        <div class="allocation-header"><h3>Place · 渠道预算</h3><span class="budget-total" id="place-total">${Object.values(decision.place).reduce((a,b) => a+b, 0)} / 40</span></div>
        <div class="allocation-inputs">
          <div class="field"><label for="vending">自动售货机</label><input id="vending" name="vending" type="number" min="0" max="40" value="${decision.place.vending}" /></div>
          <div class="field"><label for="convenience">校园便利店</label><input id="convenience" name="convenience" type="number" min="0" max="40" value="${decision.place.convenience}" /></div>
          <div class="field"><label for="cafe">校园咖啡店</label><input id="cafe" name="cafe" type="number" min="0" max="40" value="${decision.place.cafe}" /></div>
        </div>
      </section>

      <section class="allocation-group">
        <div class="allocation-header"><h3>Promotion · 信息与媒体</h3><span class="budget-total" id="promotion-total">${Object.values(decision.promotion.media).reduce((a,b) => a+b, 0)} / 60</span></div>
        <div class="field message-field"><label for="message">你要让目标顾客记住什么？</label><select id="message" name="message">
          <option value="lowPrice" ${decision.promotion.message === "lowPrice" ? "selected" : ""}>价格实惠</option>
          <option value="energy" ${decision.promotion.message === "energy" ? "selected" : ""}>强效提神</option>
          <option value="design" ${decision.promotion.message === "design" ? "selected" : ""}>高颜值</option>
          <option value="ingredients" ${decision.promotion.message === "ingredients" ? "selected" : ""}>清洁环保</option>
        </select><small>传播信息既要符合顾客关注点，也要由真实产品配置或价格支持。</small></div>
        <div class="allocation-inputs">
          <div class="field"><label for="sampling">试饮活动</label><input id="sampling" name="sampling" type="number" min="0" max="60" value="${decision.promotion.media.sampling}" /></div>
          <div class="field"><label for="communities">学生社群合作</label><input id="communities" name="communities" type="number" min="0" max="60" value="${decision.promotion.media.communities}" /></div>
          <div class="field"><label for="shortVideo">校园短视频</label><input id="shortVideo" name="shortVideo" type="number" min="0" max="60" value="${decision.promotion.media.shortVideo}" /></div>
        </div>
      </section>

      ${isRound2 ? `
        <div class="revision-summary" id="revision-summary">正在检查你修改了哪些决策……</div>
        <div class="field"><label for="evidence">因为第一轮哪条证据？</label><textarea id="evidence" name="evidence" rows="3" minlength="12" required>${escapeHtml(revision.evidence)}</textarea><small>请引用支付意愿、因果解释、顾客反馈或正式指标。</small></div>
        <div class="form-row revision-prediction">
          <div class="field"><label for="expectedMetric">预计哪个指标改变？</label><select id="expectedMetric" name="expectedMetric">
            <option value="unitsSold" ${revision.expectedMetric === "unitsSold" ? "selected" : ""}>销量</option>
            <option value="profit" ${revision.expectedMetric === "profit" ? "selected" : ""}>利润</option>
            <option value="satisfaction" ${revision.expectedMetric === "satisfaction" ? "selected" : ""}>顾客满意度</option>
            <option value="consistency" ${revision.expectedMetric === "consistency" ? "selected" : ""}>4P 一致性</option>
            <option value="channelCoverage" ${revision.expectedMetric === "channelCoverage" ? "selected" : ""}>渠道覆盖</option>
          </select></div>
          <div class="field"><label for="expectedDirection">预计方向</label><select id="expectedDirection" name="expectedDirection">
            <option value="increase" ${revision.expectedDirection === "increase" ? "selected" : ""}>上升</option>
            <option value="decrease" ${revision.expectedDirection === "decrease" ? "selected" : ""}>下降</option>
          </select></div>
        </div>` : `
        <div class="field"><label for="expectation">结果预期：你认为这套策略会带来什么？</label><textarea id="expectation" name="expectation" rows="4" minlength="12" required>${escapeHtml(decision.expectation)}</textarea><small>至少 12 个字。必须先写判断，再查看结果。</small></div>`}
      <p class="form-error" id="decision-error" role="alert"></p>
      <div class="button-row"><button class="primary-button" type="submit">提交${isRound2 ? "第二轮修改" : "第一轮决策"}</button></div>
    </form>
  `;
}

function readDecisionForm(form, round) {
  const data = new FormData(form);
  return {
    targetSegment: data.get("targetSegment"),
    product: { energy: data.get("energy"), design: data.get("design"), ingredients: data.get("ingredients") },
    price: Number(data.get("price")),
    place: { vending: Number(data.get("vending")), convenience: Number(data.get("convenience")), cafe: Number(data.get("cafe")) },
    promotion: {
      message: data.get("message"),
      media: { sampling: Number(data.get("sampling")), communities: Number(data.get("communities")), shortVideo: Number(data.get("shortVideo")) },
    },
    expectation: round === "round1" ? String(data.get("expectation")).trim() : state.round1.expectation,
    revision: round === "round2" ? {
      evidence: String(data.get("evidence")).trim(),
      expectedMetric: data.get("expectedMetric"),
      expectedDirection: data.get("expectedDirection"),
    } : null,
  };
}

function changedDecisionGroups(before, after) {
  const groups = [];
  if (before.targetSegment !== after.targetSegment) groups.push("目标顾客");
  if (JSON.stringify(before.product) !== JSON.stringify(after.product)) groups.push("Product");
  if (before.price !== after.price) groups.push("Price");
  if (JSON.stringify(before.promotion) !== JSON.stringify(after.promotion)) groups.push("Promotion");
  if (JSON.stringify(before.place) !== JSON.stringify(after.place)) groups.push("Place");
  return groups;
}

function wireDecisionForm(round) {
  const form = document.querySelector("#decision-form");
  const placeNames = ["vending", "convenience", "cafe"];
  const promoNames = ["sampling", "communities", "shortVideo"];
  const updateTotals = () => {
    document.querySelector("#place-total").textContent = `${placeNames.reduce((total, name) => total + Number(form.elements[name].value), 0)} / 40`;
    document.querySelector("#promotion-total").textContent = `${promoNames.reduce((total, name) => total + Number(form.elements[name].value), 0)} / 60`;
  };
  const updateCost = () => {
    document.querySelector("#unit-cost").textContent = `¥${calculateUnitProductCost({
      energy: form.elements.energy.value,
      design: form.elements.design.value,
      ingredients: form.elements.ingredients.value,
    })}`;
  };
  const updateRevisionSummary = () => {
    if (round !== "round2") return;
    const groups = changedDecisionGroups(state.round1, readDecisionForm(form, round));
    const summary = document.querySelector("#revision-summary");
    summary.textContent = groups.length
      ? `你修改了 ${groups.length} 个决策组：${groups.join("、")}。最多可以修改 3 个。`
      : "尚未修改决策。第二轮至少修改 1 个、最多修改 3 个决策组。";
    summary.classList.toggle("is-warning", groups.length > 3);
  };
  [...placeNames, ...promoNames].forEach((name) => form.elements[name].addEventListener("input", updateTotals));
  ["energy", "design", "ingredients"].forEach((name) => form.elements[name].addEventListener("change", updateCost));
  [...form.elements].filter((element) => element.name).forEach((element) => element.addEventListener("change", updateRevisionSummary));
  [...form.querySelectorAll('input[type="number"]')].forEach((element) => element.addEventListener("input", updateRevisionSummary));
  updateRevisionSummary();
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const error = document.querySelector("#decision-error");
    const decision = readDecisionForm(form, round);
    if ((round === "round2" ? decision.revision.evidence : decision.expectation).length < 12) {
      error.textContent = "请先写下至少 12 个字的结果预期或第一轮证据。";
      return;
    }
    if (round === "round2") {
      const groups = changedDecisionGroups(state.round1, decision);
      if (!groups.length) {
        error.textContent = "第二轮至少需要修改一个 4P 决策。";
        return;
      }
      if (groups.length > 3) {
        error.textContent = "第二轮最多修改三个决策组，请保留最有证据支持的修改。";
        return;
      }
    }
    try {
      const result = evaluateMarket(decision);
      state[round] = decision;
      state[round === "round1" ? "result1" : "result2"] = result;
      saveState();
      setStage(round === "round1" ? 3 : 6);
    } catch (caught) {
      error.textContent = caught.message;
    }
  });
}

function renderRound1() {
  workspace.innerHTML = `<div class="stage-intro"><p class="eyebrow">STEP 3 · 第一轮决策</p><h2>把调研变成一套完整 4P</h2><p>四个 P 必须共同服务一个目标顾客。先写下预期，系统才会公布结果。</p></div>${decisionFormMarkup("round1")}`;
  wireDecisionForm("round1");
}

function renderResult1() {
  workspace.innerHTML = `<div class="stage-intro"><p class="eyebrow">STEP 4 · 市场结果</p><h2>结果与你的预期一样吗？</h2><p>这些数字来自固定规则，不是 AI 编写的故事。先观察偏差，再进入解释。</p></div>${resultMarkup(state.result1, "第一轮")}<div class="callout"><strong>你原来的预期：</strong>${escapeHtml(state.round1.expectation)}</div><div class="button-row"><button class="primary-button" id="explain-result" type="button">请营销总监追问</button></div>`;
  document.querySelector("#explain-result").addEventListener("click", () => setStage(4));
}

function renderReflection() {
  workspace.innerHTML = `
    <div class="stage-intro"><p class="eyebrow">STEP 5 · 解释偏差</p><h2>先解释，再修改</h2><p>营销总监不会替你找答案。请结合访谈和正式结果，说清楚一个最值得修改的判断。</p></div>
    ${resultMarkup(state.result1, "第一轮回看")}
    <form id="reflection-form" class="decision-form">
      <div class="field"><label for="reflection">哪一个判断与证据发生了冲突？</label><textarea id="reflection" rows="5" minlength="20" required>${escapeHtml(state.reflection)}</textarea><small>至少 20 个字，尽量引用一条顾客、渠道或经营结果证据。</small></div>
      <p class="form-error" id="reflection-error" role="alert"></p>
      <div class="button-row"><button class="primary-button" type="submit">保存解释，修改第二轮</button></div>
    </form>`;
  document.querySelector("#reflection-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const value = document.querySelector("#reflection").value.trim();
    if (value.length < 20) {
      document.querySelector("#reflection-error").textContent = "请用至少 20 个字解释结果偏差。";
      return;
    }
    state.reflection = value;
    state.round2 = {
      ...clone(state.round1),
      revision: { evidence: "", expectedMetric: "unitsSold", expectedDirection: "increase" },
    };
    saveState();
    setStage(5);
  });
}

function renderRound2() {
  workspace.innerHTML = `<div class="stage-intro"><p class="eyebrow">STEP 6 · 第二轮修改</p><h2>只改有证据支持的地方</h2><p>第二轮至少修改一个、最多修改三个决策组，并写明证据和预期影响。不要把所有选项一起重做。</p></div><div class="callout"><strong>你对第一轮的解释：</strong>${escapeHtml(state.reflection)}</div>${decisionFormMarkup("round2")}`;
  wireDecisionForm("round2");
}

function metricComparison(label, before, after, suffix = "") {
  return `<article class="comparison-card"><span>${label}</span><div class="comparison-values"><strong>${before}${suffix}</strong><span class="arrow">→</span><strong>${after}${suffix}</strong></div></article>`;
}

function renderComparison() {
  const metricLabels = {
    unitsSold: "销量",
    profit: "利润",
    satisfaction: "顾客满意度",
    consistency: "4P 一致性",
    channelCoverage: "渠道覆盖",
  };
  const revision = state.round2.revision;
  const before = state.result1[revision.expectedMetric];
  const after = state.result2[revision.expectedMetric];
  const actualDirection = after > before ? "increase" : after < before ? "decrease" : "same";
  const predictionMatched = actualDirection === revision.expectedDirection;
  const groups = changedDecisionGroups(state.round1, state.round2);
  workspace.innerHTML = `
    <div class="stage-intro"><p class="eyebrow">STEP 7 · 两轮复盘</p><h2>修改带来了什么？</h2><p>经营结果只是其中一部分。更重要的是：第二轮修改有没有依据，4P 是否更加一致。</p></div>
    <div class="comparison-grid">
      ${metricComparison("销量", state.result1.unitsSold, state.result2.unitsSold, " 罐")}
      ${metricComparison("利润", `¥${state.result1.profit}`, `¥${state.result2.profit}`)}
      ${metricComparison("满意度", state.result1.satisfaction, state.result2.satisfaction)}
      ${metricComparison("4P 一致性", state.result1.consistency, state.result2.consistency)}
    </div>
    <section class="revision-review ${predictionMatched ? "is-matched" : "is-unmatched"}">
      <h3>证据型修改检查</h3>
      <p><strong>修改项：</strong>${escapeHtml(groups.join("、"))}</p>
      <p><strong>第一轮证据：</strong>${escapeHtml(revision.evidence)}</p>
      <p><strong>原先预测：</strong>${metricLabels[revision.expectedMetric]}会${revision.expectedDirection === "increase" ? "上升" : "下降"}</p>
      <p><strong>实际变化：</strong>${metricLabels[revision.expectedMetric]}${actualDirection === "increase" ? "上升" : actualDirection === "decrease" ? "下降" : "没有变化"}。${predictionMatched ? "这次预测与结果方向一致。" : "这次预测与结果方向不同，请回看第二轮因果解释。"}</p>
    </section>
    ${resultMarkup(state.result2, "第二轮因果解释")}
    <h3>最后，请评价这次内部体验</h3>
    ${state.feedbackSubmitted ? `<div class="feedback-success"><h3>反馈已记录</h3><p>匿名反馈编号：${escapeHtml(state.feedbackId)}</p></div>` : `
      <form class="feedback-form" id="feedback-form">
        <div class="form-row">
          <div class="field"><label for="helpfulness">这次体验对理解 4P 的帮助</label><select id="helpfulness" name="helpfulness"><option value="5">5 · 很有帮助</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1 · 没帮助</option></select></div>
          <div class="field"><label for="ruleClarity">市场结果是否容易理解</label><select id="ruleClarity" name="ruleClarity"><option value="5">5 · 很清楚</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1 · 很困惑</option></select></div>
          <div class="field"><label for="boundaryClear">能否分清规则结果和 AI 反馈</label><select id="boundaryClear" name="boundaryClear"><option value="yes">能</option><option value="unsure">不确定</option><option value="no">不能</option></select></div>
        </div>
        <div class="field"><label for="confusion">最困惑或最卡的地方</label><textarea id="confusion" name="confusion" rows="3" maxlength="500" required></textarea></div>
        <div class="field"><label for="suggestion">你最希望我们改什么？</label><textarea id="suggestion" name="suggestion" rows="3" maxlength="500" required></textarea></div>
        <p class="form-error" id="feedback-error" role="alert"></p>
        <div class="button-row"><button class="primary-button" type="submit">提交匿名反馈</button></div>
      </form>`}
  `;
  document.querySelector("#feedback-form")?.addEventListener("submit", submitFeedback);
}

function renderWorkspace() {
  [renderBrief, renderResearch, renderRound1, renderResult1, renderReflection, renderRound2, renderComparison][state.stage]();
}

function allowedRoles() {
  return state.stage >= 4 ? ["director"] : ["customerExam", "customerHealth", "customerSocial", "channel"];
}

function renderCoach() {
  const allowed = allowedRoles();
  if (!allowed.includes(state.activeRole)) state.activeRole = allowed[0];
  roleTabs.innerHTML = allowed.map((role) => `<button class="role-tab ${state.activeRole === role ? "is-active" : ""}" type="button" role="tab" data-role="${role}" aria-selected="${state.activeRole === role}">${ROLES[role].label}</button>`).join("");
  roleTabs.querySelectorAll("[data-role]").forEach((button) => button.addEventListener("click", () => {
    state.activeRole = button.dataset.role;
    saveState();
    renderCoach();
  }));
  roleBoundary.textContent = ROLES[state.activeRole].boundary;
  const messages = state.chats[state.activeRole];
  chatLog.innerHTML = messages.length ? messages.map((message) => `
    <div class="message ${message.sender === "user" ? "is-user" : "is-role"}">
      <span class="message-meta">${message.sender === "user" ? "你们团队" : `${ROLES[state.activeRole].label} · ${message.mode === "ai" ? "AI" : "预设降级"}`}</span>${escapeHtml(message.text)}
    </div>`).join("") : `<div class="chat-empty"><strong>${ROLES[state.activeRole].label}</strong><br>${ROLES[state.activeRole].greeting}</div>`;
  chatLog.scrollTop = chatLog.scrollHeight;
  coachMode.textContent = state.modeCounts.ai ? "AI 已连接" : state.modeCounts.fallback ? "降级模式" : "待开始";
  chatInput.disabled = state.stage === 0 || state.stage === 2 || state.stage === 3 || state.stage === 5 || state.stage === 6;
  chatForm.querySelector("button").disabled = chatInput.disabled;
}

function fallbackReply(role, message) {
  const replies = {
    customerExam: "我最常在图书馆出来、赶下一节课时买。通常能接受 6 到 8 元；提神效果值得多付一点，但太贵或太强都会让我犹豫。我更常看班群和校园社群消息。",
    customerHealth: "无糖只是第一步，我还会看原料和咖啡因标识。日常饮料大约 7 到 9 元可以考虑；便利店能看清成分，学生社群里的详细介绍也比一句口号可信。",
    customerSocial: "包装有记忆点、适合和朋友分享时，我可以接受接近 10 元。校园短视频比较容易让我注意到新品，但产品本身不好看，只喊高颜值会让我失望。",
    channel: "我会先看周转。售货机适合即时需求，便利店能解释成分，咖啡店客单高但上架成本也高。首批别把库存全压在慢渠道。",
    director: `先别急着改所有数字。你们问的是“${message.slice(0, 40)}”。请指出一条正式结果，再说它支持或反驳了第一轮的哪一个假设。`,
  };
  return replies[role];
}

async function requestCoach(message) {
  const response = await fetchWithTimeout(`${API_BASE}/api/coach`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Experience-Code": sessionStorage.getItem("xyvc-4p-code") || "" },
    body: JSON.stringify({
      sessionId: state.sessionId,
      role: state.activeRole,
      stage: STAGES[state.stage],
      message,
      decision: state.stage >= 4 ? state.round1 : null,
      result: state.stage >= 4 ? state.result1 : null,
    }),
  }, 12000);
  if (!response.ok) throw new Error("coach unavailable");
  const payload = await response.json();
  if (typeof payload.reply !== "string" || !payload.reply.trim()) throw new Error("invalid coach response");
  return { reply: payload.reply.trim(), mode: payload.mode === "fallback" ? "fallback" : "ai" };
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;
  const role = state.activeRole;
  state.chats[role].push({ sender: "user", text: message });
  chatInput.value = "";
  saveState();
  renderCoach();
  let reply;
  let mode;
  try {
    const response = await requestCoach(message);
    reply = response.reply;
    mode = response.mode;
  } catch {
    reply = fallbackReply(role, message);
    mode = "fallback";
  }
  state.chats[role].push({ sender: "role", text: reply, mode });
  state.modeCounts[mode] += 1;
  if (!state.visitedRoles.includes(role)) state.visitedRoles.push(role);
  saveState();
  render();
});

async function submitFeedback(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const feedback = {
    sessionId: state.sessionId,
    helpfulness: Number(data.get("helpfulness")),
    ruleClarity: Number(data.get("ruleClarity")),
    boundaryClear: data.get("boundaryClear"),
    confusion: String(data.get("confusion")).trim(),
    suggestion: String(data.get("suggestion")).trim(),
    modeCounts: state.modeCounts,
  };
  if (!feedback.confusion || !feedback.suggestion) {
    document.querySelector("#feedback-error").textContent = "请填写最困惑的地方和改进建议。";
    return;
  }
  let feedbackId = `LOCAL-${Date.now().toString(36).toUpperCase()}`;
  try {
    const response = await fetchWithTimeout(`${API_BASE}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Experience-Code": sessionStorage.getItem("xyvc-4p-code") || "" },
      body: JSON.stringify(feedback),
    }, 8000);
    if (!response.ok) throw new Error("feedback unavailable");
    const payload = await response.json();
    feedbackId = payload.feedbackId || feedbackId;
  } catch {
    localStorage.setItem(`${STORAGE_KEY}-feedback`, JSON.stringify(feedback));
    document.querySelector("#feedback-error").textContent = "反馈尚未上传，已临时保存在本浏览器。请稍后点击提交重试。";
    return;
  }
  state.feedbackSubmitted = true;
  state.feedbackId = feedbackId;
  saveState();
  render();
}

document.querySelector("#reset-button").addEventListener("click", () => {
  if (!window.confirm("确定清空当前团队的全部体验记录并重新开始吗？")) return;
  state = createInitialState();
  saveState();
  render();
});

document.querySelectorAll("[data-mobile-panel]").forEach((button) => button.addEventListener("click", () => {
  const panel = button.dataset.mobilePanel;
  document.querySelectorAll("[data-mobile-panel]").forEach((tab) => {
    const active = tab === button;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  document.querySelector("#workspace-panel").classList.toggle("is-mobile-active", panel === "workspace");
  document.querySelector("#coach-panel").classList.toggle("is-mobile-active", panel === "coach");
}));

function render() {
  teamAlias.textContent = state.teamAlias;
  renderProgress();
  renderWorkspace();
  renderCoach();
}

saveState();
render();
