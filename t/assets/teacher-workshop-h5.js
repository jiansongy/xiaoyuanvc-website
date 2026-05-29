"use strict";

const STEP_NAMES = ["", "认知", "洞察", "开发", "增长", "融资"];
const STEP_TASKS = {
  1: "读完 ch1，写一句话说清你的 OPC 方向。",
  2: "找出 3 个能被现实验证的痛点。",
  3: "把想法做出最小可看的样子，去做一次「妈妈测试」。",
  4: "把它推到第一个真实用户面前。",
  5: "完成一次 5 分钟模拟路演。",
};
const STEP_GOALS = {
  1: ["搞清楚自己要做什么", "写出你的 OPC 方向和价值主张", "读完 ch1 + 答对 1 个理解题"],
  2: ["找到真实痛点", "提交 3 个可验证痛点", "每个痛点写清：对象 · 场景 · 现有替代方案"],
  3: ["做出能给人看的东西", "把想法做成可展示的数字资产", "必须上传「妈妈测试」真实聊天截图"],
  4: ["找到第一批真实用户", "不靠群发，靠一对一打动一个人", "必须上传社群入群记录或真实触达截图"],
  5: ["把价值讲给愿意下注的人", "完成一次 5 分钟模拟路演", "提交路演评分或评委反馈"],
};
const STEPS_REQUIRE_EVIDENCE = new Set([3, 4]);
const GLM_ENDPOINT = "https://api.xiaoyuanvc.com/api/glm-proxy";
const GLM_TIMEOUT_MS = 12000;
const TEXT_MIN = 30;
const TEXT_MAX = 1000;
const RED_LINE = /项目一定可行|建议直接融资|自动评分通过|无需老师参与|绝对成功|稳赚不赔|包过|包融资/;
const LS_KEY = "xyvc:t:state:v1";

const TEACHERS = {
  demo: {
    teacherSlug: "demo",
    teacherName: "示例老师",
    schoolName: "示例大学",
    courseName: "数字创业实战",
    currentStep: 3,
    welcomeText: "欢迎来到本节课的 AI 一诊环节。",
    cases: ["示例案例：校园二手书循环平台"],
  },
  wangming: {
    teacherSlug: "wangming",
    teacherName: "王明",
    schoolName: "某高校",
    courseName: "数字创业实战",
    currentStep: 3,
    welcomeText: "今天我们走到「开发关」，请把你已经做的最小验证带过来。",
    cases: [],
  },
};

const FALLBACK_BY_STEP = {
  1: {
    schemaVersion: 1,
    source: "fallback",
    diagnosis: "你的方向已经有初步轮廓，但还需要把一句话价值主张写得更清楚。",
    evidenceReading: "基于你输入的关键词看，你正在梳理想做什么，但目标用户、具体场景和替代方案还需要再收窄。",
    improvements: [
      "把方向改写成面向谁、在什么场景、解决什么麻烦的一句话",
      "列出用户现在不用你方案时会怎么解决这个问题",
      "删掉泛泛的大词，只保留能被同学听懂的具体表达",
    ],
    nextActions: [
      "今天写出 3 个 OPC 版本并找同学复述给你听",
      "选一个最容易验证的校园场景进入下一步访谈",
    ],
    reminder: "AI 没有替老师判断方向是否成立，请带着这句话去听老师课堂点评。",
  },
  2: {
    schemaVersion: 1,
    source: "fallback",
    diagnosis: "你已经开始找痛点，但还需要把痛点写成可验证的现实证据。",
    evidenceReading: "基于你输入的关键词看，你可能混合了自己的判断和用户原话，下一步要把对象、场景、替代方案拆开。",
    improvements: [
      "每个痛点都写清楚用户是谁，而不是只写学生或年轻人",
      "把用户原话单独摘出来，避免只留下自己的总结",
      "补上用户现在怎么凑合解决，以及为什么不满意",
    ],
    nextActions: [
      "本周找 3 位目标用户各聊 15 分钟并记录原话",
      "把访谈结果整理成对象、场景、替代方案三列",
    ],
    reminder: "AI 只能帮你检查表达结构，真实痛点仍要靠课堂讨论和实地证据确认。",
  },
  3: {
    schemaVersion: 1,
    source: "fallback",
    diagnosis: "你已经在动手做产品了，方向值得继续打磨。",
    evidenceReading: "基于你输入的关键词看，你正在搭一个面向校园场景的 MVP，但还没有把第一批真实用户的反馈固化到产品决策里。",
    improvements: [
      "把我以为用户需要改成用户上周和我说的一手原话",
      "选 5 个真实用户跑通从注册到核心动作的最短路径",
      "把上线后 7 天内最可能被用户卡住的 3 个点提前列出来",
    ],
    nextActions: [
      "本周约 3 位校内目标用户做 20 分钟可用性测试",
      "把测试笔记写成一份 1 页用户决策日志",
    ],
    reminder: "AI 没有看到你的真实产品截图，以上是基于你输入文字的修改建议，请结合老师指导判断。",
  },
  4: {
    schemaVersion: 1,
    source: "fallback",
    diagnosis: "你已经进入增长验证，但还需要证明触达不是一次性热闹。",
    evidenceReading: "基于你输入的关键词看，你有触达用户的动作，但还需要区分真实兴趣、礼貌回复和可持续使用。",
    improvements: [
      "把触达截图和用户后续动作分开记录，避免只看点赞或回复",
      "明确第一个用户为什么愿意试，而不是只记录你发给了谁",
      "补一个用户从看到消息到完成核心动作的完整路径",
    ],
    nextActions: [
      "今天一对一邀请 5 位目标用户完成同一个核心动作",
      "记录每个人卡住的位置和是否愿意推荐给同学",
    ],
    reminder: "AI 不能替你判断增长质量，关键仍是老师和真实用户对证据的共同判断。",
  },
  5: {
    schemaVersion: 1,
    source: "fallback",
    diagnosis: "你的路演已经有素材基础，但还需要把价值、证据和请求讲得更集中。",
    evidenceReading: "基于你输入的关键词看，你可能已经有项目叙述，但听众需要更快知道你验证了什么、还缺什么、下一步要什么支持。",
    improvements: [
      "开场 30 秒先讲清用户痛点和你已经验证过的证据",
      "把产品功能压缩成一条核心价值，不要堆所有想法",
      "结尾提出一个明确请求，比如试用、反馈或资源连接",
    ],
    nextActions: [
      "把 5 分钟稿压成问题、证据、方案、请求四段",
      "找 2 位同学模拟路演并记录他们没听懂的问题",
    ],
    reminder: "AI 只能帮你打磨表达，最终评价以老师和评委反馈为准。",
  },
};

const SYSTEM_PROMPT = `你是校园VC 数字创业课的助教，给一名大学生学员的本周作业做一诊。
输出严格 JSON，字段：diagnosis, evidenceReading, improvements (3 项), nextActions (2 项), reminder。
要求：
- 口吻像负责任的助教，不替老师下结论。
- 禁止承诺"一定可行""直接融资""自动评分通过""无需老师参与"等。
- 不假装看过学生的图片，只基于学生输入的文字。
- 中文，简体。`;

const activeObjectUrls = new Set();
const app = document.getElementById("app");
const resetButton = document.getElementById("reset-btn");
const state = {
  teacher: null,
  isPreview: false,
  demoBanner: false,
  hasEvidence: false,
  evidenceMeta: { fileCount: 0, totalBytes: 0 },
  degraded: false,
  submitted: false,
  ai: null,
  fallbackReason: "",
};

function create(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) setText(el, text);
  return el;
}

function setText(el, value) {
  el.textContent = String(value ?? "");
}

function append(parent, children) {
  for (const child of children) {
    if (child) parent.appendChild(child);
  }
}

function parseRoute() {
  const match = location.pathname.match(/^\/t\/([a-z0-9-]{2,32})\/?$/i);
  const params = new URLSearchParams(location.search);
  return {
    slug: match ? match[1].toLowerCase() : null,
    isPreview: params.get("preview") === "1",
    isExplicitDemo: params.get("demo") === "1",
  };
}

function resolveTeacher({ slug, isExplicitDemo }) {
  if (!slug) return { found: false, teacher: null };
  if (TEACHERS[slug]) return { found: true, teacher: TEACHERS[slug], demoBanner: false };
  if (isExplicitDemo) return { found: true, teacher: TEACHERS.demo, demoBanner: true };
  return { found: false, teacher: null };
}

function renderNotFound() {
  app.className = "app-shell";
  app.replaceChildren();
  const box = create("section", "not-found");
  const title = create("h1", "", "未找到此课程链接");
  const text = create("p", "", "请联系你的老师确认二维码，或重新扫描课堂提供的学生入口。");
  append(box, [title, text]);
  app.appendChild(box);
}

function render(teacher, options) {
  state.teacher = teacher;
  state.isPreview = Boolean(options.isPreview);
  state.demoBanner = Boolean(options.demoBanner);
  state.hasEvidence = false;
  state.evidenceMeta = { fileCount: 0, totalBytes: 0 };
  state.degraded = false;
  state.submitted = false;
  state.ai = null;
  state.fallbackReason = "";

  app.className = `app-shell${state.isPreview ? " has-preview" : ""}`;
  app.replaceChildren();
  if (state.isPreview) app.appendChild(renderPreviewBanner());
  if (state.demoBanner) app.appendChild(create("div", "demo-banner", "演示老师数据 · 仅用于内部预览"));
  app.appendChild(renderTopbar());
  const container = create("div", "container");
  append(container, [
    renderHero(),
    renderPath(),
    renderSubmit(),
    renderResult(),
    renderFooterActions(),
  ]);
  app.appendChild(container);
}

function renderPreviewBanner() {
  const banner = create("div", "preview-banner");
  const text = create("span", "", "老师预览模式 · 仅你自测");
  const ban = create("span", "preview-ban", "禁止分享给学生");
  append(banner, [text, ban]);
  return banner;
}

function renderTopbar() {
  const topbar = create("header", "topbar");
  const dot = create("div", "brand-dot", "VC");
  const copy = create("div", "topbar-copy");
  const title = create("strong", "", "校园VC 数创助教");
  const desc = create("span", "", "学生扫码即用 · 不注册");
  append(copy, [title, desc]);
  const button = create("button", "button button-soft", "复制链接");
  button.type = "button";
  button.addEventListener("click", () => copyText(studentUrl(state.teacher), "已复制学生链接，预览参数已移除。"));
  append(topbar, [dot, copy, button]);
  return topbar;
}

function renderHero() {
  const section = create("section");
  section.id = "hero";
  const id = create("div", "hero-id");
  const avatar = create("div", "avatar", surname(state.teacher.teacherName));
  avatar.setAttribute("aria-label", `${state.teacher.teacherName}老师头像`);
  const logo = create("div", "school-logo", state.teacher.schoolName.slice(0, 1));
  logo.setAttribute("aria-label", state.teacher.schoolName);
  const copy = create("div");
  const eyebrow = create("div", "eyebrow", `${state.teacher.schoolName} · ${state.teacher.courseName}`);
  const h1 = create("h1", "", `${state.teacher.teacherName}老师的数创助教`);
  const pill = create("span", "pill", "数创助教 · 指导教师");
  append(copy, [eyebrow, h1, pill]);
  append(id, [avatar, logo, copy]);

  const task = create("div", "task-card");
  append(task, [
    create("div", "label", "今天的任务"),
    create("h2", "", `第 ${state.teacher.currentStep} 步 · ${STEP_NAMES[state.teacher.currentStep]}`),
    create("p", "", STEP_TASKS[state.teacher.currentStep]),
  ]);

  const actions = create("div", "button-row");
  const start = create("button", "button button-primary", "开始本关任务");
  start.type = "button";
  start.addEventListener("click", () => scrollToId("submit"));
  const path = create("button", "button button-secondary", "查看五步路径");
  path.type = "button";
  path.addEventListener("click", () => scrollToId("path"));
  append(actions, [start, path]);

  append(section, [
    id,
    task,
    actions,
    create("p", "quote", `AI 一诊 / 陪练，不是最终建议。最终评价以${state.teacher.teacherName}老师课堂点评为准。`),
    create("p", "soft-tip", state.teacher.welcomeText || "建议先把前两步证据补齐，再进入当前关卡。"),
  ]);
  return section;
}

function renderPath() {
  const section = create("section");
  section.id = "path";
  const head = create("div", "section-head");
  append(head, [create("h2", "", "五步路径"), create("span", "", "行动地图")]);
  const list = create("div", "path-list");
  list.id = "path-list";
  append(section, [head, list]);
  updatePath(list);
  return section;
}

function updatePath(list = document.getElementById("path-list")) {
  if (!list) return;
  list.replaceChildren();
  for (let step = 1; step <= 5; step += 1) {
    const done = state.submitted && step === state.teacher.currentStep;
    const active = !state.submitted && step === state.teacher.currentStep && (state.hasEvidence || state.degraded);
    const card = create("article", `step-card${done ? " done" : ""}${active ? " active" : ""}`);
    const top = create("div", "step-top");
    const badge = create("span", `badge${done ? " done" : ""}${active ? " active" : ""}`, done ? "AI 已一诊" : active ? "进行中" : "未开始");
    append(top, [
      create("div", "step-no", String(step)),
      create("div", "step-title", `${step}. ${STEP_NAMES[step]}：${STEP_GOALS[step][0]}`),
      badge,
    ]);
    const desc = create("p", "step-desc", STEP_GOALS[step][1]);
    const gate = create("div", "gate");
    gate.appendChild(create("strong", "", "硬卡点："));
    gate.appendChild(document.createTextNode(STEP_GOALS[step][2]));
    append(card, [top, desc, gate]);
    list.appendChild(card);
  }
}

function renderSubmit() {
  const section = create("section");
  section.id = "submit";
  const head = create("div", "section-head");
  append(head, [create("h2", "", "提交你的进展"), create("span", "", "AI 一诊")]);

  const helpPanel = create("div", "panel");
  append(helpPanel, [create("span", "step-pill", `第 ${state.teacher.currentStep} 步 · ${STEP_NAMES[state.teacher.currentStep]}`), create("h2", "", "妈妈测试进展")]);
  const details = create("details", "help-card");
  details.open = true;
  details.appendChild(create("summary", "", "妈妈测试 3 步走"));
  const ol = create("ol");
  ["找一个最不会拒绝你的人：亲戚、好朋友、室友。", "让他试 5 分钟，你不引导、不解释、不辩护。", "听他怎么说。「我不会用」是金句，「挺好的」是危险信号。"].forEach((item) => ol.appendChild(create("li", "", item)));
  details.appendChild(ol);
  helpPanel.appendChild(details);

  const textPanel = create("div", "panel");
  const nickLabel = create("label", "", "学生昵称（可选）");
  nickLabel.setAttribute("for", "nickname");
  const nickInput = create("input");
  nickInput.type = "text";
  nickInput.id = "nickname";
  nickInput.maxLength = 20;
  nickInput.placeholder = "匿名同学";
  const label = create("label", "", "你做了什么？给谁看了？");
  label.setAttribute("for", "progress-text");
  const textarea = create("textarea");
  textarea.id = "progress-text";
  textarea.maxLength = TEXT_MAX;
  textarea.placeholder = "描述你做了什么 + 给谁看了。别忘了上传聊天截图。";
  const hint = create("div", "hint warn");
  hint.id = "text-hint";
  append(textPanel, [nickLabel, nickInput, label, textarea, hint]);

  const evidencePanel = state.isPreview ? renderPreviewSkip() : renderEvidenceUpload();
  const submitButton = create("button", "button button-primary", state.isPreview ? "让 AI 看一下（预览态）" : "让 AI 看一下");
  submitButton.id = "submit-button";
  submitButton.type = "button";
  submitButton.addEventListener("click", () => handleSubmit(false));
  const cta = create("div", "button-row");
  cta.appendChild(submitButton);

  textarea.addEventListener("input", updateTextHint);
  append(section, [head, helpPanel, textPanel, evidencePanel, cta, renderGateDialog()]);
  requestAnimationFrame(updateTextHint);
  return section;
}

function renderEvidenceUpload() {
  const panel = create("div", "panel");
  const label = create("label", "", "上传真实证据 · 必填");
  label.setAttribute("for", "evidence-file");
  const zone = create("label", "upload-zone");
  zone.id = "upload-zone";
  const input = create("input");
  input.id = "evidence-file";
  input.type = "file";
  input.accept = "image/*";
  const strong = create("strong", "", "点击选择 · 拍照 / 从相册");
  const copy = create("span", "", "截图里至少能看出：对方是谁、你问了什么、对方真实回答了什么");
  const fileName = create("span", "file-name");
  fileName.id = "file-name";
  append(zone, [input, strong, copy, fileName]);
  input.addEventListener("change", () => {
    const files = Array.from(input.files || []);
    state.hasEvidence = files.length > 0;
    state.evidenceMeta = {
      fileCount: Math.min(files.length, 3),
      totalBytes: files.reduce((sum, file) => sum + file.size, 0),
    };
    zone.classList.toggle("uploaded", state.hasEvidence);
    setText(fileName, state.hasEvidence ? `${files[0].name} · 已上传 · 一诊后立即删除` : "");
    updatePath();
  });
  append(panel, [label, zone, create("p", "privacy", "我们不存证据原图，AI 阅后即焚。证据只用于这次一诊。")]);
  return panel;
}

function renderPreviewSkip() {
  const panel = create("div", "panel preview-skip");
  const strong = create("strong", "", "已跳过：上传真实证据");
  const text = create("p", "", "学生看到这里时，必须上传聊天截图才能继续。你现在可以直接提交，体验 AI 一诊的输出节奏。");
  append(panel, [strong, text]);
  return panel;
}

function renderGateDialog() {
  const backdrop = create("div", "dialog-backdrop");
  backdrop.id = "gate-dialog";
  backdrop.setAttribute("aria-hidden", "true");
  const sheet = create("div", "sheet");
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "true");
  sheet.setAttribute("aria-labelledby", "gate-title");
  const title = create("h2", "", "缺一张证据图——这一步必须看到真实用户的反应");
  title.id = "gate-title";
  const text = create("p", "", "没有截图时，我只能帮你改访谈问题，不能判断这个痛点是不是真的。");
  const row = create("div", "button-row");
  const upload = create("button", "button button-primary", "上传证据再继续");
  upload.type = "button";
  upload.addEventListener("click", () => {
    setGateDialog(false);
    document.getElementById("evidence-file")?.click();
  });
  const downgrade = create("button", "button button-secondary", "我只想改访谈问题");
  downgrade.type = "button";
  downgrade.addEventListener("click", () => {
    setGateDialog(false);
    handleSubmit(true);
  });
  append(row, [upload, downgrade]);
  append(sheet, [title, text, row]);
  backdrop.appendChild(sheet);
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) setGateDialog(false);
  });
  return backdrop;
}

function setGateDialog(open) {
  const dialog = document.getElementById("gate-dialog");
  if (!dialog) return;
  dialog.classList.toggle("show", open);
  dialog.setAttribute("aria-hidden", String(!open));
  if (open) dialog.querySelector("button")?.focus();
}

function renderResult() {
  const section = create("section");
  section.id = "result";
  section.hidden = true;
  return section;
}

function renderResultContent() {
  const section = document.getElementById("result");
  if (!section) return;
  section.replaceChildren();
  section.hidden = false;
  if (state.ai?.source === "fallback") {
    section.appendChild(create("div", "fallback-banner", "本次使用演示一诊。AI 仅做参考，不替代老师判断。"));
  }
  section.appendChild(create("div", "notice", `下面是 AI 一诊。关键判断请拿这张卡去找${state.teacher.teacherName}老师课堂点评，再走下一步。`));
  const card = create("div", "result-card");
  append(card, [create("span", "step-pill", "AI 一诊结果"), renderResultBlocks(), renderCopyCard(), renderFeedback()]);
  section.appendChild(card);
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderResultBlocks() {
  const wrap = create("div", "result-list");
  const ai = state.ai;
  const blocks = [
    ["一句话判断", ai.diagnosis],
    ["基于输入的解读", ai.evidenceReading],
    ["改进建议", ai.improvements],
    ["本周可做", ai.nextActions],
    ["提醒", ai.reminder],
  ];
  blocks.forEach(([title, value]) => {
    const block = create("article", "result-block");
    block.appendChild(create("h3", "", title));
    if (Array.isArray(value)) {
      const ul = create("ul");
      value.forEach((item) => ul.appendChild(create("li", "", item)));
      block.appendChild(ul);
    } else {
      block.appendChild(create("p", "", value));
    }
    wrap.appendChild(block);
  });
  return wrap;
}

function renderCopyCard() {
  const wrap = create("div", "copy-card");
  append(wrap, [create("strong", "", "一诊摘要"), create("p", "", state.ai.diagnosis)]);
  const button = create("button", "button button-primary", `复制摘要发给${state.teacher.teacherName}老师`);
  button.type = "button";
  button.addEventListener("click", () => {
    const text = buildSummary({
      teacher: state.teacher,
      step: state.teacher.currentStep,
      nickname: document.getElementById("nickname")?.value.trim(),
      ai: state.ai,
    });
    copyText(text, "摘要已复制，可粘到微信或班级群。");
  });
  const row = create("div", "button-row");
  row.appendChild(button);
  wrap.appendChild(row);
  return wrap;
}

function renderFeedback() {
  const wrap = create("div", "feedback-row");
  const helpful = create("button", "button", "有帮助");
  helpful.type = "button";
  helpful.addEventListener("click", () => setText(helpful, "已记录"));
  const flag = create("button", "button", "想让老师点评");
  flag.type = "button";
  flag.addEventListener("click", () => showToast("已记录为 AI 可能误判点。"));
  append(wrap, [helpful, flag]);
  return wrap;
}

function renderFooterActions() {
  const footer = create("div", "footer-actions");
  const reset = create("button", "button button-secondary", "清除本机数据并重新开始");
  reset.type = "button";
  reset.addEventListener("click", resetLocalState);
  footer.appendChild(reset);
  return footer;
}

function updateTextHint() {
  const hint = document.getElementById("text-hint");
  if (!hint) return;
  const len = submissionText().length;
  hint.replaceChildren();
  if (len >= TEXT_MIN) {
    hint.className = "hint ok";
    append(hint, [create("strong", "", "✓"), create("span", "", "够清楚了，继续。")]);
  } else {
    hint.className = "hint warn";
    append(hint, [create("strong", "", "!"), create("span", "", "写得再具体一点，AI 才能给出有用的反馈。少于 30 字时它只能给套话。")]);
  }
}

async function handleSubmit(degraded) {
  const text = submissionText();
  if (text.length < TEXT_MIN) {
    showToast("写满 30 字后再让 AI 一诊。");
    document.getElementById("progress-text")?.focus();
    return;
  }
  const step = state.teacher.currentStep;
  if (!state.isPreview && STEPS_REQUIRE_EVIDENCE.has(step) && !state.hasEvidence && !degraded) {
    setGateDialog(true);
    return;
  }

  state.degraded = Boolean(degraded);
  const submission = buildSubmission();
  console.debug("StudentSubmission", submission);
  setLoading(true);
  const result = degraded ? { ok: false, reason: "schema" } : await callGLM(submission);
  setLoading(false);
  if (result.ok) {
    state.ai = result.data;
    state.fallbackReason = "";
  } else {
    state.ai = { ...FALLBACK_BY_STEP[step], source: "fallback" };
    state.fallbackReason = result.reason;
  }
  state.submitted = true;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ schemaVersion: 1, step, ts: Date.now() }));
  } catch {}
  updatePath();
  renderResultContent();
}

function buildSubmission() {
  const step = state.teacher.currentStep;
  return {
    schemaVersion: 1,
    teacherSlug: state.teacher.teacherSlug,
    step,
    stepName: STEP_NAMES[step],
    text: submissionText().slice(0, TEXT_MAX),
    hasEvidence: state.isPreview ? false : state.hasEvidence,
    evidenceMeta: state.evidenceMeta,
    degraded: state.degraded,
    preview: state.isPreview,
    ts: Date.now(),
  };
}

function submissionText() {
  return (document.getElementById("progress-text")?.value || "").trim().replace(/\s+/g, " ");
}

async function callGLM(submission) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), GLM_TIMEOUT_MS);
  try {
    const res = await fetch(GLM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        stream: false,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(submission) },
        ],
      }),
    });
    if (!res.ok) return { ok: false, reason: "network" };
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content ?? "";
    let parsed;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return { ok: false, reason: "schema" };
    }
    const checked = validateAIDiagnosis(parsed);
    if (!checked.ok) return checked;
    if (containsRedLine(checked.data)) return { ok: false, reason: "redline" };
    return { ok: true, data: { ...checked.data, source: "llm", schemaVersion: 1 } };
  } catch (err) {
    return { ok: false, reason: err?.name === "AbortError" ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
  }
}

function buildUserPrompt(s) {
  return JSON.stringify({
    teacher: s.teacherSlug,
    step: s.step,
    stepName: s.stepName,
    text: s.text,
    hasEvidence: s.hasEvidence,
    degraded: s.degraded,
    preview: s.preview,
  });
}

function validateAIDiagnosis(value) {
  if (!value || typeof value !== "object") return { ok: false, reason: "schema" };
  const data = {
    schemaVersion: 1,
    source: value.source === "fallback" ? "fallback" : "llm",
    diagnosis: stringIn(value.diagnosis, 30, 120),
    evidenceReading: stringIn(value.evidenceReading, 60, 200),
    improvements: arrayIn(value.improvements, 3, 20, 80),
    nextActions: arrayIn(value.nextActions, 2, 20, 80),
    reminder: stringIn(value.reminder, 30, 120),
  };
  if (!data.diagnosis || !data.evidenceReading || !data.improvements || !data.nextActions || !data.reminder) {
    return { ok: false, reason: "schema" };
  }
  return { ok: true, data };
}

function stringIn(value, min, max) {
  if (typeof value !== "string") return "";
  const text = value.trim();
  return text.length >= min && text.length <= max ? text : "";
}

function arrayIn(value, count, min, max) {
  if (!Array.isArray(value) || value.length !== count) return null;
  const out = value.map((item) => stringIn(item, min, max));
  return out.every(Boolean) ? out : null;
}

function containsRedLine(parsed) {
  const joined = [
    parsed.diagnosis,
    parsed.evidenceReading,
    ...(parsed.improvements || []),
    ...(parsed.nextActions || []),
    parsed.reminder,
  ].join(" ");
  return RED_LINE.test(joined);
}

function buildSummary({ teacher, step, nickname, ai }) {
  const date = new Date().toISOString().slice(0, 10);
  return [
    "【校园VC 数创助教 · 一诊摘要】",
    `学校：${teacher.schoolName}`,
    `课程：${teacher.courseName}`,
    `老师：${teacher.teacherName}`,
    `关卡：第${step}关 ${STEP_NAMES[step]}`,
    `学生昵称：${nickname || "匿名同学"}`,
    `日期：${date}`,
    "",
    `一句话判断：${ai.diagnosis}`,
    `基于输入的解读：${ai.evidenceReading}`,
    "改进建议：",
    ...ai.improvements.map((item) => `- ${item}`),
    "本周可做：",
    ...ai.nextActions.map((item) => `- ${item}`),
    `提醒：${ai.reminder}`,
    "",
    "——AI 仅做参考，不替代老师判断",
    `链接：https://xiaoyuanvc.com/t/${teacher.teacherSlug}`,
  ].join("\n");
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    showToast(ok ? successMessage : "复制失败，请手动选择摘要。");
    return ok;
  }
}

function studentUrl(teacher) {
  return `https://xiaoyuanvc.com/t/${teacher.teacherSlug}`;
}

function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = create("div", "toast");
    toast.id = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }
  setText(toast, message);
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function setLoading(loading) {
  const button = document.getElementById("submit-button");
  if (!button) return;
  button.disabled = loading;
  setText(button, loading ? "AI 正在一诊..." : state.isPreview ? "让 AI 看一下（预览态）" : "让 AI 看一下");
}

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function surname(name) {
  return String(name || "师").slice(0, 1);
}

function previewImage(file) {
  const url = URL.createObjectURL(file);
  activeObjectUrls.add(url);
  return url;
}

function revokeAllObjectUrls() {
  for (const url of activeObjectUrls) URL.revokeObjectURL(url);
  activeObjectUrls.clear();
}

function resetLocalState() {
  revokeAllObjectUrls();
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
  location.reload();
}

resetButton?.addEventListener("click", resetLocalState);

function init() {
  const route = parseRoute();
  const { found, teacher, demoBanner } = resolveTeacher(route);
  if (!found) {
    renderNotFound();
    return;
  }
  render(teacher, { isPreview: route.isPreview, demoBanner });
}

init();
