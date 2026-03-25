(function () {
  "use strict";

  var DATA = window.AI_OPPORTUNITY_DATA;
  if (!DATA) return;

  var STEP_LABELS = ["选择方向", "选择行业", "分析痛点", "AI 解法", "验证计划"];
  var LS_KEY = "ai-opp-state";

  /* ── State ── */
  var state = {
    mode: "student",
    step: 1,
    categoryId: null,
    industryId: null,
    painPointId: null,
    bookmarks: [],
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
          bookmarks: state.bookmarks,
        }),
      );
    } catch (e) {
      /* quota */
    }
  }

  function loadLocal() {
    try {
      var d = JSON.parse(localStorage.getItem(LS_KEY));
      if (d && d.bookmarks) state.bookmarks = d.bookmarks;
    } catch (e) {
      /* corrupt */
    }
  }

  /* ── Render Orchestrator ── */
  function render() {
    renderStepper();
    renderModeToggle();
    renderFooter();
    renderBookmarks();

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
    if (typeof gtag === "function") {
      gtag("event", "tool_step_view", {
        tool_name: "ai_opportunity",
        step: state.step,
        mode: state.mode,
        category: state.categoryId || "",
        industry: state.industryId || "",
      });
    }
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
    var bm = document.querySelector(".btn-bookmark");

    if (prev) prev.style.display = state.step > 1 ? "" : "none";

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

  /* ── Step 5: Validation ── */
  function renderValidation() {
    var container = document.getElementById("validationContent");
    var ind = getIndustry(state.industryId);
    if (!container || !ind || !ind.validation) return;

    var v = ind.validation;
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
      "</div>";
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
      case "select-category":
        setState({ categoryId: id, industryId: null, painPointId: null });
        break;

      case "select-industry":
        setState({ industryId: id, painPointId: null });
        break;

      case "select-pain":
        setState({ painPointId: id });
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
          });
        }
        break;

      case "share":
        var url = location.href;
        if (navigator.share) {
          navigator
            .share({
              title:
                "AI 创业机会探索器 — " +
                  (getIndustry(state.industryId) || {}).name || "",
              url: url,
            })
            .catch(function () {});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(function () {
            alert("链接已复制");
          });
        }
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
  render();

  window.addEventListener("hashchange", function () {
    parseHash();
    render();
  });
})();
