/* Shared presentation controls. Tool adapters keep validation and state local. */
(function () {
  "use strict";
  var adapter, scheduled = false, menuOpen = false, menuSignature = "", nav, progress, bar, hint, previous, primary, menu;
  function button(text, run, className) {
    var el = document.createElement("button"); el.type = "button"; el.textContent = text;
    el.className = className || "tool-ui-secondary"; el.onclick = run; return el;
  }
  function visible(el) { return !!el && !!el.getBoundingClientRect().height; }
  function closeMenu() { menuOpen = false; menu.hidden = true; nav.querySelector("button").setAttribute("aria-expanded", "false"); }
  function updateMenu(state) {
    var entries = [{ label: "工具介绍", run: adapter.home }].concat(adapter.steps ? adapter.steps() : [], adapter.more ? adapter.more(state) : [], [{ label: "重新开始", run: adapter.reset, danger: true }]);
    var signature = entries.map(function (entry) { return entry.label + ":" + !!entry.disabled; }).join("|");
    if (signature === menuSignature) return;
    menuSignature = signature; menu.replaceChildren();
    entries.forEach(function (entry) { var el = button(entry.label, function () { closeMenu(); entry.run(); update(); }, entry.danger ? "tool-ui-danger" : undefined); el.disabled = !!entry.disabled; menu.appendChild(el); });
  }
  function update() {
    scheduled = false; if (!adapter || !nav) return;
    var state = adapter.state(); document.body.dataset.toolView = state.view;
    progress.hidden = state.view === "welcome";
    progress.querySelector("strong").textContent = state.position || "";
    progress.querySelector("span").textContent = state.detail || "";
    bar.hidden = state.view === "welcome";
    previous.hidden = !state.previous;
    if (state.previous) { previous.textContent = state.previous.label || "上一步"; previous.onclick = function () { state.previous.run(); update(); }; }
    primary.hidden = !state.primary;
    if (state.primary) { primary.textContent = state.primary.label; primary.disabled = !!state.primary.disabled; primary.onclick = function () { state.primary.run(); update(); }; }
    hint.textContent = state.hint || ""; hint.hidden = !state.hint;
    var start = adapter.startButton && adapter.startButton();
    if (start && state.view === "welcome") start.textContent = adapter.hasProgress() ? "继续上次" : adapter.startLabel;
    if (menuOpen) updateMenu(state);
  }
  function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } }
  function register(options) {
    adapter = options;
    function mount() {
      nav = document.querySelector(".tool-shell-nav"); nav.classList.add("tool-ui");
      var title = nav.querySelector("span"); title.className = "tool-ui-title";
      [...nav.querySelectorAll("button")].forEach(function (el) { el.remove(); });
      nav.querySelector("a").textContent = "← 返回资源中心";
      var toggle = button("更多", function () { menuOpen = !menuOpen; menu.hidden = !menuOpen; toggle.setAttribute("aria-expanded", String(menuOpen)); if (menuOpen) { menuSignature = ""; updateMenu(adapter.state()); } });
      toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-controls", "tool-ui-menu"); nav.appendChild(toggle);
      menu = document.createElement("div"); menu.id = "tool-ui-menu"; menu.className = "tool-ui-menu tool-ui"; menu.hidden = true; nav.appendChild(menu);
      progress = document.createElement("div"); progress.className = "tool-ui-position tool-ui"; progress.setAttribute("aria-live", "polite"); progress.innerHTML = "<strong></strong><span></span>"; nav.after(progress);
      bar = document.createElement("div"); bar.className = "tool-ui-actions tool-ui";
      previous = button("上一步", function () {}); primary = button("下一步", function () {}, "tool-ui-primary");
      hint = document.createElement("p"); hint.className = "tool-ui-hint"; hint.setAttribute("role", "status");
      bar.append(hint, previous, primary); document.body.appendChild(bar); document.body.classList.add("tool-ui-active");
      document.addEventListener("click", function (event) { if (!nav.contains(event.target)) closeMenu(); schedule(); });
      document.addEventListener("keydown", function (event) { if (event.key === "Escape" && menuOpen) { closeMenu(); toggle.focus(); } });
      document.addEventListener("input", function (event) { if (!event.target.closest(".tool-ui") && adapter.inputChanged) adapter.inputChanged(event); schedule(); });
      document.addEventListener("change", schedule);
      new MutationObserver(function (records) { if (records.some(function (record) { return !record.target.closest || !record.target.closest(".tool-ui, #tool-session-status"); })) schedule(); }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class", "style", "disabled"] });
      if (window.visualViewport) {
        var adjustKeyboard = function () { var offset = Math.max(0, innerHeight - visualViewport.height - visualViewport.offsetTop); document.documentElement.style.setProperty("--tool-keyboard-offset", offset > 120 ? offset + "px" : "0px"); };
        visualViewport.addEventListener("resize", adjustKeyboard); visualViewport.addEventListener("scroll", adjustKeyboard);
      }
      document.addEventListener("focusin", function (event) { if (/INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) setTimeout(function () { if (document.activeElement === event.target) event.target.scrollIntoView({ block: "center", behavior: "smooth" }); }, 180); });
      update();
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
  }
  window.XYVCToolUI = { message: function (text) { window.XYVCToolSession.notice(text, /已复制|已保存|已获得|已完成/.test(text) ? "info" : "error"); }, register: register, update: schedule, visible: visible, error: function (text, el) { window.XYVCToolSession.notice(text, "error"); if (el) { el.setAttribute("aria-invalid", "true"); el.focus(); } } };
})();
