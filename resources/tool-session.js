/* Shared persistence and request lifetime. Each tool owns its workflow. */
(function () {
  "use strict";
  var epoch = 0, resetting = false, controllers = new Set(), damaged = new Set(), failedKey = "";
  function notice(text, kind) {
    var el = document.getElementById("tool-session-status");
    if (!el) {
      el = document.createElement("p"); el.id = "tool-session-status";
      el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite");
      el.style.cssText = "position:fixed;left:16px;right:16px;bottom:80px;z-index:250;padding:12px 16px;background:#fff;border:1px solid #d1d5db;border-radius:8px;color:#1f2937;font-size:14px;box-shadow:0 2px 8px #0001";
      document.body.appendChild(el);
    }
    el.textContent = text; el.dataset.kind = kind || "info"; el.hidden = false;
    if (el._timer) clearTimeout(el._timer);
    if (kind !== "error") el._timer = setTimeout(function () { el.hidden = true; }, 2500);
  }
  function failed() { notice("未能保存到浏览器，请保持页面打开并复制内容备份。", "error"); }
  function write(key, value) {
    if (resetting || damaged.has(key)) return false;
    try { localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value)); if (failedKey === key) { failedKey = ""; notice("已保存到本浏览器。"); } return true; }
    catch (e) { failedKey = key; failed(); return false; }
  }
  function read(key) {
    if (damaged.has(key)) return null;
    try {
      var raw = localStorage.getItem(key); if (!raw) return null;
      try { return JSON.parse(raw); }
      catch (e) {
        damaged.add(key);
        try { if (!localStorage.getItem(key + ":recovery")) localStorage.setItem(key + ":recovery", raw); } catch (backupError) {}
        notice("记录无法读取，原始内容已保留。请先备份，再重新开始。", "error");
        var el = document.getElementById("tool-session-status"), button = document.createElement("button");
        button.textContent = "下载原始记录"; button.type = "button";
        button.onclick = function () { var url = URL.createObjectURL(new Blob([raw], { type: "text/plain;charset=utf-8" })); var a = document.createElement("a"); a.href = url; a.download = "工具记录备份.txt"; a.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000); };
        el.appendChild(button); return null;
      }
    } catch (e) { failed(); return null; }
  }
  function invalidate() {
    epoch++; controllers.forEach(function (ctrl) { ctrl.abort(); }); controllers.clear();
  }
  function current(token) { return token === epoch && !resetting; }
  function assertCurrent(token) { if (!current(token)) throw new DOMException("本次请求已取消", "AbortError"); }
  async function request(url, options) {
    var token = epoch, ctrl = new AbortController(), original = options && options.signal;
    controllers.add(ctrl);
    var abort = function () { ctrl.abort(); };
    if (original) { if (original.aborted) abort(); else original.addEventListener("abort", abort, { once: true }); }
    try { var response = await fetch(url, Object.assign({}, options, { signal: ctrl.signal })); assertCurrent(token); return response; }
    finally { controllers.delete(ctrl); if (original) original.removeEventListener("abort", abort); }
  }
  function reset(toolId, key, state, message) {
    if (!confirm(message || "重新开始会清除本工具这次填写的内容和AI结果。已保存的历史版本及其他工具资料会保留。确定继续吗？")) return false;
    var sharedKey = "xyvc-unified-data-v2", oldPrivate, oldShared;
    try {
      oldPrivate = localStorage.getItem(key); oldShared = localStorage.getItem(sharedKey);
      if (oldShared) {
        var workspace = JSON.parse(oldShared);
        if (workspace.tools && workspace.tools[toolId]) {
          var tool = workspace.tools[toolId]; tool.draftData = {}; tool.actionItems = []; tool.updatedAt = new Date().toISOString(); tool.lastShareId = "";
        }
        localStorage.setItem(sharedKey, JSON.stringify(workspace));
      }
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      // Restore the last durable values if one of the two writes failed.
      try { if (oldShared !== null && oldShared !== undefined) localStorage.setItem(sharedKey, oldShared); if (oldPrivate !== null && oldPrivate !== undefined) localStorage.setItem(key, oldPrivate); } catch (rollbackError) {}
      failed(); return false;
    }
    invalidate(); resetting = true; damaged.delete(key);
    location.replace(location.pathname); return true;
  }
  window.XYVCToolSession = { write: write, read: read, reset: reset, notice: notice, invalidate: invalidate, token: function () { return epoch; }, current: current, assertCurrent: assertCurrent, fetch: request, isResetting: function () { return resetting; } };
})();
