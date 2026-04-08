(function () {
  "use strict";

  var DATA = window.AI_OPPORTUNITY_DATA;
  if (!DATA) return;

  var TOOL_ID = "ai-opportunity";
  var STEP_LABELS = ["选择方向", "选择行业", "分析痛点", "AI 解法", "验证计划"];
  var LS_KEY = "ai-opp-state";
  var contextSyncState = null;

  /* ── State ── */
  var state = {
    mode: "student",
    step: 1,
    categoryId: null,
    industryId: null,
    painPointId: null,
    bookmarks: [],
    contextDismissed: false,
    selectedHistoryVersionId: "",
  };

  /* ── Helpers ── */
  function esc(s) {
    if (!s) return "";
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function getCategory(id) {
    return DATA.categories.find(function (c) {
      return c.id === id;
    });
  }

  function getIndustry(id) {
    return DATA.industries[id];
  }

  function getPainPoint(industryId, painId) {
    var ind = getIndustry(industryId);
    if (!ind) return null;
    return ind.painPoints.find(function (p) {
      return p.id === painId;
    });
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getToolHistory() {
    if (!window.XYVCUnifiedDataManager) return [];
    return window.XYVCUnifiedDataManager.getToolHistory(TOOL_ID) || [];
  }

  function trackEvent(eventName, payload) {
    if (window.XYVCUnifiedDataManager) {
      window.XYVCUnifiedDataManager.track(TOOL_ID, eventName, payload || {});
    } else if (typeof gtag === "function") {
      gtag("event", eventName, payload || {});
    }
  }

  function inferCategoryFromContext(text) {
    var source = String(text || "").toLowerCase();
    if (!source) return "";
    if (
      /内容|创作|自媒体|小红书|直播|mcn|剪辑|博主/.test(source)
    ) {
      return "content";
    }
    if (/电商|跨境|卖货|店铺|选品|客服|贸易/.test(source)) {
      return "ecommerce";
    }
    if (/校园|学生|招聘|留学|求职|课程|学校/.test(source)) {
      return "campus";
    }
    if (/本地|门店|商家|家政|短租|培训|餐饮/.test(source)) {
      return "local";
    }
    return "";
  }

  function buildCurrentOpportunitySummary() {
    var category = getCategory(state.categoryId);
    var industry = getIndustry(state.industryId);
    var pain = getPainPoint(state.industryId, state.painPointId);
    var summary = {
      category: category ? category.name : "",
      industry: industry ? industry.name : "",
      painPoint: pain ? pain.title : "",
      oneLiner: "",
    };

    if (industry && pain) {
      summary.oneLiner =
        "在" + industry.name + "里，优先解决「" + pain.title + "」这个痛点。";
    } else if (industry) {
      summary.oneLiner = "正在探索「" + industry.name + "」相关的 AI 创业机会。";
    }

    return summary;
  }

  function syncSharedContext() {
    if (!window.XYVCUnifiedDataManager) return;
    var summary = buildCurrentOpportunitySummary();
    if (!summary.oneLiner) return;

    window.XYVCUnifiedDataManager.writeContext(TOOL_ID, {
      projectContext: {
        track: summary.category,
        stage: "机会探索",
        oneLiner: summary.oneLiner,
      },
    });
  }

  function detectContextSyncState() {
    if (!window.XYVCToolContext) {
      contextSyncState = null;
      return;
    }

    var context = window.XYVCToolContext.read();
    if (
      !window.XYVCToolContext.hasProjectContext(context) ||
      context.sourceToolId === TOOL_ID ||
      state.contextDismissed
    ) {
      contextSyncState = null;
      return;
    }

    var sourceText =
      (context.projectContext && context.projectContext.oneLiner) ||
      (context.projectContext && context.projectContext.track) ||
      "";
    var recommendedCategory = inferCategoryFromContext(
      [context.projectContext.track, context.projectContext.oneLiner].join(" "),
    );

    contextSyncState = {
      sourceToolId: context.sourceToolId,
      sourceLabel: window.XYVCToolContext.getLabel(context.sourceToolId),
      oneLiner: sourceText,
      stage:
        context.projectContext && context.projectContext.stage
          ? context.projectContext.stage
          : "",
      track:
        context.projectContext && context.projectContext.track
          ? context.projectContext.track
          : "",
      recommendedCategory: recommendedCategory,
    };
  }

  function renderContextSyncCard() {
    var card = document.getElementById("contextSyncCard");
    if (!card) return;

    if (!contextSyncState) {
      card.style.display = "none";
      card.innerHTML = "";
      return;
    }

    var meta = [];
    if (contextSyncState.track) meta.push("已有赛道：" + contextSyncState.track);
    if (contextSyncState.stage) meta.push("阶段：" + contextSyncState.stage);

    var actionText = contextSyncState.recommendedCategory
      ? "按这个背景推荐方向"
      : "带着这个背景继续探索";

    card.style.display = "";
    card.innerHTML =
      '<div class="context-card">' +
      '<div class="context-card__title">已从「' +
      esc(contextSyncState.sourceLabel) +
      "」带入项目背景</div>" +
      '<div class="context-card__desc">这样你在看机会时，不会脱离自己当前正在做的项目。</div>' +
      (meta.length
        ? '<div class="context-card__meta">' + esc(meta.join(" · ")) + "</div>"
        : "") +
      '<div class="context-card__preview">' +
      esc(contextSyncState.oneLiner) +
      "</div>" +
      '<div class="context-card__actions">' +
      '<button class="context-card__btn context-card__btn--primary" data-action="apply-context">' +
      esc(actionText) +
      "</button>" +
      '<button class="context-card__btn context-card__btn--ghost" data-action="dismiss-context">先不带入</button>' +
      "</div>" +
      "</div>";
  }

  /* ── State Management ── */
  function setState(patch) {
    for (var k in patch) {
      if (patch.hasOwnProperty(k)) state[k] = patch[k];
    }
    syncHash();
    saveLocal();
    render();
  }

  function syncHash() {
    var parts = ["mode=" + state.mode, "step=" + state.step];
    if (state.categoryId) parts.push("cat=" + state.categoryId);
    if (state.industryId) parts.push("ind=" + state.industryId);
    if (state.painPointId) parts.push("pain=" + state.painPointId);
    history.replaceState(null, "", "#" + parts.join("&"));
  }

  function parseHash() {
    var h = location.hash.slice(1);
    if (!h) return;
    var params = {};
    h.split("&").forEach(function (pair) {
      var kv = pair.split("=");
      if (kv.length === 2) params[kv[0]] = decodeURIComponent(kv[1]);
    });
    if (params.mode) state.mode = params.mode;
    if (params.step) state.step = parseInt(params.step, 10) || 1;
    if (params.cat) state.categoryId = params.cat;
    if (params.ind) state.industryId = params.ind;
    if (params.pain) state.painPointId = params.pain;
  }

  function saveLocal() {
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          mode: state.mode,
          step: state.step,
          categoryId: state.categoryId,
          industryId: state.industryId,
          painPointId: state.painPointId,
          bookmarks: state.bookmarks,
          contextDismissed: state.contextDismissed,
          selectedHistoryVersionId: state.selectedHistoryVersionId,
        }),
      );
    } catch (e) {
      /* quota */
    }
  }

  function loadLocal() {
    try {
      var d = JSON.parse(localStorage.getItem(LS_KEY));
      if (!d || typeof d !== "object") return;
      if (d.mode) state.mode = d.mode;
      if (d.step) state.step = parseInt(d.step, 10) || 1;
      if (d.categoryId) state.categoryId = d.categoryId;
      if (d.industryId) state.industryId = d.industryId;
      if (d.painPointId) state.painPointId = d.painPointId;
      if (d.bookmarks) state.bookmarks = d.bookmarks;
      state.contextDismissed = Boolean(d.contextDismissed);
      state.selectedHistoryVersionId = d.selectedHistoryVersionId || "";
    } catch (e) {
      /* corrupt */
    }
  }

  function buildSerializableState() {
    return {
      mode: state.mode,
      step: 5,
      categoryId: state.categoryId,
      industryId: state.industryId,
      painPointId: state.painPointId,
      bookmarks: clone(state.bookmarks || []),
    };
  }

  function applySerializableState(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return;
    state.mode = snapshot.mode || state.mode;
    state.categoryId = snapshot.categoryId || null;
    state.industryId = snapshot.industryId || null;
    state.painPointId = snapshot.painPointId || null;
    state.bookmarks = Array.isArray(snapshot.bookmarks)
      ? snapshot.bookmarks
      : state.bookmarks;
    state.step = 5;
    syncHash();
    saveLocal();
    render();
  }

  function buildOpportunityOutputSnapshot() {
    var summary = buildCurrentOpportunitySummary();
    var industry = getIndustry(state.industryId);
    var pain = getPainPoint(state.industryId, state.painPointId);
    return {
      summary: summary,
      validation: industry ? clone(industry.validation || {}) : {},
      tools:
        pain && Array.isArray(pain.solutions)
          ? pain.solutions.map(function (solution) {
              return {
                title: solution.title,
                stacks: clone(solution.stacks || []),
              };
            })
          : [],
      generatedAt: new Date().toISOString(),
    };
  }

  function ensureValidationHistorySaved() {
    if (!window.XYVCUnifiedDataManager) return;
    if (state.selectedHistoryVersionId) return;
    if (!state.industryId || !state.painPointId) return;
    var history = window.XYVCUnifiedDataManager.appendToolHistory(
      TOOL_ID,
      {
        versionId: "ver_" + Date.now().toString(36),
        inputSnapshot: buildSerializableState(),
        outputSnapshot: buildOpportunityOutputSnapshot(),
        createdAt: new Date().toISOString(),
        isShared: false,
      },
      20,
    );
    state.selectedHistoryVersionId = history[0] ? history[0].versionId : "";
    saveLocal();
    trackEvent("history_saved", {
      history_count: history.length,
      industry_id: state.industryId || "",
    });
  }

  function buildNextToolSectionHtml() {
    var cards = [
      {
        href: "./ai-ready-check.html",
        title: "去 AI 员工面试，把执行动作落到真实工具",
        desc: "如果这个机会你已经想试，下一步应该拆出最耗时的工作环节，看看先让哪些 AI 员工上岗。",
        bg: "#eff6ff",
        border: "#bfdbfe",
        color: "#1d4ed8",
      },
    ];

    if (state.mode === "student") {
      cards.push({
        href: "./rate-your-idea.html",
        title: "去学生创业自检，判断这个方向是否站得住",
        desc: "你已经看到一个明确痛点，下一步要验证它是不是值得投入，而不是只停在“感觉不错”。",
        bg: "#f0fdf4",
        border: "#bbf7d0",
        color: "#166534",
      });
    } else {
      cards.push({
        href: "./find-your-idea.html",
        title: "去发现你的创业想法，把更多方向收敛成切口",
        desc: "如果你在课堂或项目里想继续扩展方向，可以把今天看到的痛点带过去，再做一轮聚焦。",
        bg: "#f5f3ff",
        border: "#ddd6fe",
        color: "#6d28d9",
      });
    }

    return (
      '<div class="validation-card__section">' +
      '<div class="validation-card__label">下一步推荐</div>' +
      cards
        .map(function (card) {
          return (
            '<a href="' +
            card.href +
            '" style="display:block;text-decoration:none;background:' +
            card.bg +
            ";border:1px solid " +
            card.border +
            ";border-radius:14px;padding:14px 16px;margin-top:10px;color:" +
            card.color +
            '">' +
            '<strong style="display:block;font-size:14px;margin-bottom:6px">' +
            esc(card.title) +
            "</strong>" +
            '<span style="font-size:13px;line-height:1.7;color:' +
            card.color +
            '">' +
            esc(card.desc) +
            "</span></a>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function buildHistorySectionHtml() {
    var history = getToolHistory().slice(0, 5);
    if (!history.length) {
      return (
        '<div class="validation-card__section">' +
        '<div class="validation-card__label">历史版本</div>' +
        '<div style="font-size:13px;color:#64748b">当前还没有历史版本。进入验证计划后会自动保存。</div>' +
        "</div>"
      );
    }

    return (
      '<div class="validation-card__section">' +
      '<div class="validation-card__label">历史版本</div>' +
      history
        .map(function (entry, index) {
          var summary = entry.outputSnapshot && entry.outputSnapshot.summary;
          var title =
            (summary && summary.oneLiner) || "AI 创业机会探索结果";
          var isActive = entry.versionId === state.selectedHistoryVersionId;
          return (
            '<div style="border:1px solid ' +
            (isActive ? "#bfdbfe" : "#e2e8f0") +
            ";border-radius:12px;padding:12px 14px;margin-top:10px;background:" +
            (isActive ? "#eff6ff" : "#ffffff") +
            '">' +
            '<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">' +
            '<div>' +
            '<div style="font-size:13px;font-weight:700;color:#0f172a">版本 ' +
            (history.length - index) +
            "</div>" +
            '<div style="font-size:12px;color:#64748b;margin-top:4px">' +
            esc(new Date(entry.createdAt).toLocaleString("zh-CN")) +
            "</div>" +
            "</div>" +
            '<button class="btn btn-outline" data-action="open-history" data-id="' +
            esc(entry.versionId) +
            '" style="margin:0;padding:6px 10px">打开</button>' +
            "</div>" +
            '<div style="font-size:13px;line-height:1.7;color:#334155;margin-top:10px">' +
            esc(title) +
            "</div></div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  /* ── Render Orchestrator ── */
  function render() {
    detectContextSyncState();
    renderStepper();
    renderModeToggle();
    renderFooter();
    renderBookmarks();
    renderContextSyncCard();

    for (var i = 1; i <= 5; i++) {
      var el = document.getElementById("step" + i);
      if (el) el.classList.toggle("is-active", i === state.step);
    }

    if (state.step === 1) renderCategories();
    if (state.step === 2) renderIndustries();
    if (state.step === 3) renderPainPoints();
    if (state.step === 4) renderSolutions();
    if (state.step === 5) renderValidation();

    window.scrollTo({ top: 0, behavior: "smooth" });

    // GA4 event
    trackEvent("tool_step_view", {
      tool_name: "ai_opportunity",
      step: state.step,
      mode: state.mode,
      category: state.categoryId || "",
      industry: state.industryId || "",
    });
  }

  /* ── Stepper ── */
  function renderStepper() {
    var dots = document.querySelectorAll(".stepper__dot");
    var lines = document.querySelectorAll(".stepper__line");
    var label = document.getElementById("stepLabel");

    dots.forEach(function (dot, i) {
      var s = i + 1;
      dot.classList.toggle("is-active", s === state.step);
      dot.classList.toggle("is-done", s < state.step);
      dot.textContent = s < state.step ? "\u2713" : s;
    });

    lines.forEach(function (line, i) {
      line.classList.toggle("is-done", i + 1 < state.step);
    });

    if (label) label.textContent = STEP_LABELS[state.step - 1] || "";
  }

  /* ── Mode Toggle ── */
  function renderModeToggle() {
    document.querySelectorAll(".mode-toggle__btn").forEach(function (btn) {
      var isActive = btn.getAttribute("data-mode") === state.mode;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-checked", isActive ? "true" : "false");
    });
  }

  /* ── Footer ── */
  function renderFooter() {
    var prev = document.querySelector(".btn-prev");
    var next = document.querySelector(".btn-next");
    var reset = document.querySelector(".btn-reset");
    var bm = document.querySelector(".btn-bookmark");

    if (prev) prev.style.display = state.step > 1 ? "" : "none";
    if (reset) reset.style.display = hasResettableProgress() ? "" : "none";

    if (next) {
      if (state.step === 5) {
        next.textContent = "重新探索";
        next.disabled = false;
      } else {
        next.textContent = "下一步";
        next.disabled = !canAdvance();
      }
    }

    if (bm) {
      var saved =
        state.industryId && state.bookmarks.indexOf(state.industryId) !== -1;
      bm.classList.toggle("is-saved", saved);
      bm.innerHTML = saved ? "&#9733;" : "&#9734;";
    }
  }

  function hasResettableProgress() {
    return Boolean(
      state.step > 1 ||
      state.categoryId ||
      state.industryId ||
      state.painPointId ||
      state.selectedHistoryVersionId,
    );
  }

  function canAdvance() {
    if (state.step === 1) return !!state.categoryId;
    if (state.step === 2) return !!state.industryId;
    if (state.step === 3) return !!state.painPointId;
    if (state.step === 4) return true;
    return false;
  }

  /* ── Step 1: Categories ── */
  function renderCategories() {
    var grid = document.getElementById("categoryGrid");
    if (!grid) return;

    grid.innerHTML = DATA.categories
      .map(function (cat) {
        var active = cat.id === state.categoryId;
        return (
          '<button class="category-card' +
          (active ? " is-active" : "") +
          '" ' +
          'data-action="select-category" data-id="' +
          esc(cat.id) +
          '">' +
          '<div class="category-card__icon">' +
          cat.icon +
          "</div>" +
          '<div class="category-card__name">' +
          esc(cat.name) +
          "</div>" +
          '<div class="category-card__desc">' +
          esc(cat.desc) +
          "</div>" +
          '<div class="category-card__count">' +
          cat.industryIds.length +
          " 个行业</div>" +
          "</button>"
        );
      })
      .join("");
  }

  /* ── Step 2: Industries ── */
  function renderIndustries() {
    var list = document.getElementById("industryList");
    var desc = document.getElementById("step2Desc");
    var cat = getCategory(state.categoryId);
    if (!list || !cat) return;

    if (desc) desc.textContent = cat.name + " — 选一个你最想了解的行业";

    list.innerHTML = cat.industryIds
      .map(function (iid) {
        var ind = getIndustry(iid);
        if (!ind) return "";
        var active = iid === state.industryId;
        var stars = "";
        for (var s = 1; s <= 5; s++) {
          stars +=
            '<span class="star' +
            (s <= ind.feasibility ? " is-filled" : "") +
            '">&#9733;</span>';
        }
        return (
          '<button class="industry-card' +
          (active ? " is-active" : "") +
          '" ' +
          'data-action="select-industry" data-id="' +
          esc(iid) +
          '">' +
          '<div class="industry-card__header">' +
          '<span class="industry-card__name">' +
          esc(ind.name) +
          "</span>" +
          '<span class="industry-card__stars" title="学生可行性">' +
          stars +
          "</span>" +
          "</div>" +
          '<div class="industry-card__summary">' +
          esc(ind.summary) +
          "</div>" +
          '<div class="industry-card__tags">' +
          ind.tags
            .map(function (t) {
              return '<span class="tag">' + esc(t) + "</span>";
            })
            .join("") +
          "</div>" +
          "</button>"
        );
      })
      .join("");
  }

  /* ── Step 3: Pain Points ── */
  function renderPainPoints() {
    var list = document.getElementById("painList");
    var desc = document.getElementById("step3Desc");
    var ind = getIndustry(state.industryId);
    if (!list || !ind) return;

    if (desc) desc.textContent = ind.name + " — 选一个你最想解决的痛点";

    list.innerHTML = ind.painPoints
      .map(function (pp) {
        var active = pp.id === state.painPointId;
        var symptomsHtml = pp.symptoms
          .map(function (s) {
            return "<li>" + esc(s) + "</li>";
          })
          .join("");

        var interviewHtml = "";
        if (pp.interviewQ && pp.interviewQ.length) {
          interviewHtml =
            '<div class="pain-card__interview">' +
            "<strong>访谈问题</strong>" +
            pp.interviewQ
              .map(function (q) {
                return esc(q);
              })
              .join("<br>") +
            "</div>";
        }

        return (
          '<button class="pain-card' +
          (active ? " is-active" : "") +
          '" ' +
          'data-action="select-pain" data-id="' +
          esc(pp.id) +
          '">' +
          '<div class="pain-card__header">' +
          '<span class="pain-card__severity ' +
          pp.severity +
          '">' +
          esc(pp.severity) +
          "</span>" +
          '<span class="pain-card__title">' +
          esc(pp.title) +
          "</span>" +
          "</div>" +
          '<ul class="pain-card__symptoms">' +
          symptomsHtml +
          "</ul>" +
          interviewHtml +
          "</button>"
        );
      })
      .join("");
  }

  /* ── Step 4: Solutions ── */
  function renderSolutions() {
    var list = document.getElementById("solutionList");
    var desc = document.getElementById("step4Desc");
    var pp = getPainPoint(state.industryId, state.painPointId);
    if (!list || !pp) return;

    if (desc) desc.textContent = "针对「" + pp.title + "」的 AI 解决方案";

    list.innerHTML = pp.solutions
      .map(function (sol, idx) {
        var modeNote = sol.modeNotes ? sol.modeNotes[state.mode] : "";

        var stacksHtml = sol.stacks
          .map(function (s) {
            return '<span class="stack-chip">' + esc(s) + "</span>";
          })
          .join("");

        var flowHtml = "";
        if (sol.input && sol.output) {
          flowHtml =
            '<div class="solution-card__flow">' +
            '<div class="flow-box"><div class="flow-box__label">输入</div><div class="flow-box__content">' +
            sol.input.slice(0, 2).map(esc).join("、") +
            "</div></div>" +
            '<div class="flow-arrow">&rarr;</div>' +
            '<div class="flow-box"><div class="flow-box__label">AI 处理</div><div class="flow-box__content">' +
            esc(sol.title) +
            "</div></div>" +
            '<div class="flow-arrow">&rarr;</div>' +
            '<div class="flow-box"><div class="flow-box__label">输出</div><div class="flow-box__content">' +
            sol.output.slice(0, 2).map(esc).join("、") +
            "</div></div>" +
            "</div>";
        }

        return (
          '<div class="solution-card' +
          (idx === 0 ? " is-open" : "") +
          '">' +
          '<div class="solution-card__header" data-action="toggle-solution" data-idx="' +
          idx +
          '">' +
          '<span class="solution-card__title">' +
          esc(sol.title) +
          "</span>" +
          '<span class="solution-card__arrow">&#9660;</span>' +
          "</div>" +
          '<div class="solution-card__body">' +
          '<p class="solution-card__desc">' +
          esc(sol.desc) +
          "</p>" +
          flowHtml +
          '<div style="margin-bottom:8px;font-size:12px;font-weight:600;color:#64748b">中国可用工具</div>' +
          '<div class="solution-card__stacks">' +
          stacksHtml +
          "</div>" +
          (sol.antiPattern
            ? '<div class="solution-card__anti"><strong>&#9888; 避坑：</strong>' +
              esc(sol.antiPattern) +
              "</div>"
            : "") +
          (modeNote
            ? '<div class="solution-card__mode"><strong>' +
              (state.mode === "student" ? "学生建议：" : "教师建议：") +
              "</strong>" +
              esc(modeNote) +
              "</div>"
            : "") +
          "</div></div>"
        );
      })
      .join("");
  }

  /* ── Tool Stack ── */
  function renderToolStack(toolStack) {
    if (!toolStack || !toolStack.length) return '';
    var cards = toolStack.map(function(tool) {
      return (
        '<div class="tool-stack-card">' +
          '<div class="tool-stack-card__header">' +
            '<span class="tool-stack-card__name">' + esc(tool.name) + '</span>' +
            '<span class="tool-stack-card__price">' + esc(tool.price) + '</span>' +
          '</div>' +
          '<div class="tool-stack-card__platform">' + esc(tool.platform) + '</div>' +
          '<div class="tool-stack-card__use">' + esc(tool.useCase) + '</div>' +
        '</div>'
      );
    }).join('');
    return (
      '<div class="validation-card__section tool-stack-section">' +
        '<div class="validation-card__label">推荐工具栈</div>' +
        '<div class="tool-stack-grid">' + cards + '</div>' +
      '</div>'
    );
  }

  /* ── Step 5: Validation ── */
  function renderValidation() {
    var container = document.getElementById("validationContent");
    var ind = getIndustry(state.industryId);
    if (!container || !ind || !ind.validation) return;
    ensureValidationHistorySaved();

    var v = ind.validation;
    var pp = getPainPoint(state.industryId, state.painPointId);
    var timelineHtml = "";
    if (v.day1)
      timelineHtml +=
        '<div class="timeline-item"><span class="timeline-item__day">Day 1</span><span class="timeline-item__text">' +
        esc(v.day1) +
        "</span></div>";
    if (v.day3)
      timelineHtml +=
        '<div class="timeline-item"><span class="timeline-item__day">Day 3</span><span class="timeline-item__text">' +
        esc(v.day3) +
        "</span></div>";
    if (v.day7)
      timelineHtml +=
        '<div class="timeline-item"><span class="timeline-item__day">Day 7</span><span class="timeline-item__text">' +
        esc(v.day7) +
        "</span></div>";

    container.innerHTML =
      '<div class="validation-card">' +
      '<div class="validation-card__section">' +
      '<div class="validation-card__label">目标用户</div>' +
      '<div class="validation-card__text">' +
      esc(v.target) +
      "</div>" +
      "</div>" +
      '<div class="validation-card__section">' +
      '<div class="validation-card__label">7 天行动计划</div>' +
      '<div class="validation-timeline">' +
      timelineHtml +
      "</div>" +
      "</div>" +
      '<div class="validation-card__section">' +
      '<div class="signal-row">' +
      '<div class="signal-box success"><strong>&#10004; 成功信号</strong>' +
      esc(v.successSignal) +
      "</div>" +
      '<div class="signal-box fail"><strong>&#10008; 失败信号</strong>' +
      esc(v.failSignal) +
      "</div>" +
      "</div>" +
      "</div>" +
      renderToolStack(pp && pp.toolStack ? pp.toolStack : []) +
      '<div class="validation-card__section">' +
      '<div class="validation-card__label">保存与分享</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
      '<button class="btn btn-prev" data-action="save-history" style="display:inline-flex">保存版本</button>' +
      '<button class="btn btn-share" data-action="share" style="display:inline-flex;width:auto;height:auto;padding:10px 14px;border-radius:12px">复制分享链接</button>' +
      "</div>" +
      "</div>" +
      buildNextToolSectionHtml() +
      buildHistorySectionHtml() +
      "</div>";

    syncSharedContext();
  }

  /* ── Bookmarks ── */
  function renderBookmarks() {
    var bar = document.getElementById("bookmarkBar");
    var list = document.getElementById("bookmarkList");
    if (!bar || !list) return;

    if (state.bookmarks.length === 0) {
      bar.style.display = "none";
      return;
    }

    bar.style.display = "";
    list.innerHTML = state.bookmarks
      .map(function (bid) {
        var ind = getIndustry(bid);
        if (!ind) return "";
        return (
          '<button class="bookmark-chip" data-action="jump-bookmark" data-id="' +
          esc(bid) +
          '">' +
          esc(ind.name) +
          '<span class="bookmark-chip__remove" data-action="remove-bookmark" data-id="' +
          esc(bid) +
          '">&times;</span>' +
          "</button>"
        );
      })
      .join("");
  }

  /* ── Event Delegation ── */
  document.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-action]");
    if (!trigger) return;

    var action = trigger.getAttribute("data-action");
    var id = trigger.getAttribute("data-id");

    switch (action) {
      case "apply-context":
        if (contextSyncState && contextSyncState.recommendedCategory) {
          setState({
            categoryId: contextSyncState.recommendedCategory,
            industryId: null,
            painPointId: null,
            step: 2,
            selectedHistoryVersionId: "",
          });
        } else {
          setState({ step: 1, selectedHistoryVersionId: "" });
        }
        trackEvent("context_applied", {
          source_tool: contextSyncState ? contextSyncState.sourceToolId : "",
        });
        break;

      case "dismiss-context":
        state.contextDismissed = true;
        setState({});
        trackEvent("context_dismissed", {
          source_tool: contextSyncState ? contextSyncState.sourceToolId : "",
        });
        break;

      case "select-category":
        setState({
          categoryId: id,
          industryId: null,
          painPointId: null,
          selectedHistoryVersionId: "",
        });
        trackEvent("opportunity_category_selected", { category_id: id });
        break;

      case "select-industry":
        setState({
          industryId: id,
          painPointId: null,
          selectedHistoryVersionId: "",
        });
        trackEvent("opportunity_industry_selected", { industry_id: id });
        break;

      case "select-pain":
        setState({ painPointId: id, selectedHistoryVersionId: "" });
        trackEvent("opportunity_pain_selected", { pain_id: id });
        break;

      case "set-mode":
        var mode = trigger.getAttribute("data-mode");
        setState({ mode: mode });
        break;

      case "toggle-solution":
        var card = trigger.closest(".solution-card");
        if (card) card.classList.toggle("is-open");
        e.preventDefault();
        break;

      case "next":
        if (state.step === 5) {
          setState({
            step: 1,
            categoryId: null,
            industryId: null,
            painPointId: null,
          });
        } else if (canAdvance()) {
          setState({ step: state.step + 1 });
        }
        break;

      case "prev":
        if (state.step > 1) {
          setState({ step: state.step - 1 });
        }
        break;

      case "reset":
        if (!hasResettableProgress()) break;
        if (!window.confirm("清空当前选择，从第 1 步重新开始？")) break;
        setState({
          step: 1,
          categoryId: null,
          industryId: null,
          painPointId: null,
          contextDismissed: false,
          selectedHistoryVersionId: "",
        });
        trackEvent("opportunity_reset", {
          mode: state.mode,
        });
        break;

      case "bookmark":
        if (!state.industryId) return;
        var idx = state.bookmarks.indexOf(state.industryId);
        if (idx === -1) {
          if (state.bookmarks.length < 5) {
            state.bookmarks.push(state.industryId);
          }
        } else {
          state.bookmarks.splice(idx, 1);
        }
        setState({});
        trackEvent("opportunity_bookmark_toggled", {
          industry_id: state.industryId,
        });
        break;

      case "remove-bookmark":
        e.stopPropagation();
        var ri = state.bookmarks.indexOf(id);
        if (ri !== -1) state.bookmarks.splice(ri, 1);
        setState({});
        break;

      case "jump-bookmark":
        var bInd = getIndustry(id);
        if (bInd) {
          setState({
            categoryId: bInd.categoryId,
            industryId: id,
            painPointId: null,
            step: 3,
            selectedHistoryVersionId: "",
          });
        }
        break;

      case "save-history":
        if (!window.XYVCUnifiedDataManager) {
          alert("当前浏览器暂不支持历史保存。");
          break;
        }
        state.selectedHistoryVersionId = "";
        ensureValidationHistorySaved();
        render();
        alert("当前版本已保存。");
        break;

      case "open-history":
        var entry = getToolHistory().find(function (item) {
          return item.versionId === id;
        });
        if (entry && entry.inputSnapshot) {
          state.selectedHistoryVersionId = id;
          applySerializableState(entry.inputSnapshot);
          trackEvent("history_reopened", {
            version_id: id,
            industry_id: state.industryId || "",
          });
        }
        break;

      case "share":
        var url = location.href;
        if (window.XYVCUnifiedDataManager && state.step === 5) {
          var summary = buildCurrentOpportunitySummary();
          var industry = getIndustry(state.industryId);
          var pain = getPainPoint(state.industryId, state.painPointId);
          var snapshot = window.XYVCUnifiedDataManager.createShareSnapshot(
            TOOL_ID,
            {
              mode: state.mode,
              categoryId: state.categoryId,
              industryId: state.industryId,
              painPointId: state.painPointId,
              summary: summary,
              validation: industry ? industry.validation : null,
              tools:
                pain && Array.isArray(pain.solutions)
                  ? pain.solutions.map(function (solution) {
                      return {
                        title: solution.title,
                        stacks: solution.stacks || [],
                      };
                    })
                  : [],
            },
            {
              title: summary.oneLiner || "AI 创业机会探索快照",
              baseUrl: location.href.split("#")[0],
            },
          );
          url = snapshot.url;
        }
        if (navigator.share) {
          navigator
            .share({
              title:
                "AI 创业机会探索器 — " +
                (((getIndustry(state.industryId) || {}).name) || ""),
              url: url,
            })
            .catch(function () {});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(function () {
            alert("链接已复制");
          });
        }
        trackEvent("share_snapshot_created", {
          step: state.step,
          industry_id: state.industryId || "",
        });
        break;
    }
  });

  /* ── Stepper dot click: jump to step ── */
  document.querySelectorAll(".stepper__dot").forEach(function (dot) {
    dot.addEventListener("click", function () {
      var target = parseInt(dot.getAttribute("data-step"), 10);
      if (target < state.step) {
        setState({ step: target });
      }
    });
    dot.style.cursor = "pointer";
  });

  /* ── Init ── */
  loadLocal();
  parseHash();
  if (window.XYVCUnifiedDataManager) {
    var sharedSnapshot =
      window.XYVCUnifiedDataManager.readShareSnapshotFromLocation(location.href);
    if (sharedSnapshot && sharedSnapshot.toolId === TOOL_ID && sharedSnapshot.payload) {
      state.mode = sharedSnapshot.payload.mode || state.mode;
      state.categoryId = sharedSnapshot.payload.categoryId || state.categoryId;
      state.industryId = sharedSnapshot.payload.industryId || state.industryId;
      state.painPointId = sharedSnapshot.payload.painPointId || state.painPointId;
      state.step = state.industryId ? 5 : state.step;
    }
  }
  render();

  window.addEventListener("hashchange", function () {
    parseHash();
    render();
  });
})();
