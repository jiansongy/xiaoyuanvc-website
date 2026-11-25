(function () {
  "use strict";

  var INDEX_URL = "/assets/site-search-index.json";
  var indexPromise = null;
  var indexLoaded = false;
  var searchVersion = 0;
  var returnFocus = null;
  var elements = {};

  function ensureStyles() {
    if (document.getElementById("siteSearchFallbackStyles")) return;
    var style = document.createElement("style");
    style.id = "siteSearchFallbackStyles";
    style.textContent = `
      dialog.site-search {
        position: fixed; inset: 0; width: 100%; height: 100%; max-width: none; max-height: none;
        box-sizing: border-box; margin: 0; border: 0; overflow: hidden; background: transparent;
        align-items: flex-start; justify-content: center; padding: clamp(16px, 10vh, 96px) clamp(12px, 3vw, 24px) 12px;
        font-family: Inter, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      }
      dialog.site-search[open] { display: flex; }
      dialog.site-search::backdrop { background: rgba(15, 23, 42, .46); backdrop-filter: blur(3px); }
      .site-search__panel {
        box-sizing: border-box; width: min(720px, 100%); max-height: min(680px, 100%);
        display: flex; flex-direction: column; overflow: hidden; background: #fff;
        border: 1px solid rgba(15, 23, 42, .1); border-radius: 8px; box-shadow: 0 24px 80px rgba(15, 23, 42, .22);
      }
      .site-search__bar { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #475569; }
      .site-search__icon, .site-search-trigger__icon {
        box-sizing: border-box; width: 16px; height: 16px; border: 2px solid currentColor;
        border-radius: 50%; position: relative; flex: 0 0 auto;
      }
      .site-search__icon::after, .site-search-trigger__icon::after {
        content: ''; position: absolute; width: 7px; height: 2px; right: -5px; bottom: -3px;
        background: currentColor; border-radius: 999px; transform: rotate(45deg);
      }
      .site-search__input { min-width: 0; min-height: 44px; flex: 1; padding: 0 6px; border: 0; border-radius: 6px; color: #0f172a; font: inherit; font-size: 1rem; background: transparent; }
      .site-search__close, .site-search__retry {
        min-width: 44px; min-height: 44px; border: 0; border-radius: 8px; color: #334155;
        background: transparent; cursor: pointer;
      }
      .site-search__close { flex: 0 0 auto; font-size: 1.5rem; line-height: 1; }
      .site-search__retry { align-self: center; margin: 0 0 16px; padding: 0 16px; color: #1d4ed8; background: #eff6ff; font: inherit; }
      .site-search__close:hover, .site-search__result:hover { color: #0f172a; background: #f1f5f9; }
      .site-search :is(input, button, a):focus-visible { outline: 2px solid #2563eb; outline-offset: -2px; }
      .site-search__status { margin: 0; padding: 24px 14px; text-align: center; color: #475569; font-size: .875rem; line-height: 1.55; }
      .site-search__status--summary { padding: 8px 16px 0; text-align: start; }
      .site-search__results { min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 8px; }
      .site-search__result { display: grid; gap: 3px; padding: 14px; color: #0f172a; border-radius: 8px; text-decoration: none; }
      .site-search__type { width: max-content; padding: 2px 8px; border-radius: 999px; background: #dbeafe; color: #1d4ed8; font-size: .75rem; font-weight: 700; }
      .site-search__title { font-size: 1rem; line-height: 1.45; }
      .site-search__excerpt, .site-search__url { color: #475569; font-size: .875rem; line-height: 1.55; }
      .site-search__url { color: #64748b; word-break: break-all; }
      body.site-search-lock { overflow: hidden; }
      .site-search-trigger { display: inline-flex; align-items: center; gap: 7px; }
      @media (max-width: 767px) { dialog.site-search { padding-top: 16px; } }
    `;
    document.head.appendChild(style);
  }

  function normalize(text) {
    return (text || "").toString().toLowerCase().replace(/\s+/g, " ").trim();
  }

  function escapeHtml(text) {
    return (text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetch(INDEX_URL, { cache: "no-store" })
        .then(function (res) {
          if (!res.ok) throw new Error("Search index request failed");
          return res.text();
        })
        .then(function (text) {
          if (!text || !text.trim()) throw new Error("Empty search index");
          return JSON.parse(text);
        })
        .then(function (data) {
          if (!data || !Array.isArray(data.entries)) throw new Error("Invalid search index");
          indexLoaded = true;
          return data.entries;
        })
        .catch(function (error) {
          indexPromise = null;
          throw error;
        });
    }
    return indexPromise;
  }

  function scoreEntry(entry, terms) {
    var title = normalize(entry.title);
    var excerpt = normalize(entry.excerpt);
    var url = normalize(entry.url);
    var text = normalize(entry.text);
    var score = 0;

    terms.forEach(function (term) {
      if (!term) return;
      if (title.indexOf(term) !== -1) score += 30;
      if (url.indexOf(term) !== -1) score += 18;
      if (excerpt.indexOf(term) !== -1) score += 10;
      if (text.indexOf(term) !== -1) score += 3;
    });

    return score;
  }

  function search(entries, query) {
    var terms = normalize(query).split(/[\s,，。；;:：、]+/).filter(Boolean);
    if (!terms.length) return [];

    return entries
      .map(function (entry) {
        return { entry: entry, score: scoreEntry(entry, terms) };
      })
      .filter(function (item) {
        return item.score > 0;
      })
      .sort(function (a, b) {
        return b.score - a.score || a.entry.url.localeCompare(b.entry.url);
      })
      .slice(0, 12)
      .map(function (item) {
        return item.entry;
      });
  }

  function showStatus(message, hasResults) {
    elements.status.classList.toggle("site-search__status--summary", Boolean(hasResults));
    if (elements.status.textContent !== message) elements.status.textContent = message;
    elements.results.hidden = !hasResults;
    if (!hasResults) elements.results.replaceChildren();
  }

  function render(results) {
    if (!results.length) {
      showStatus("没有找到相关内容，换个关键词试试。");
      return;
    }

    showStatus("显示 " + results.length + " 条相关结果。", true);
    elements.results.innerHTML = results
      .map(function (item) {
        return (
          '<a class="site-search__result" href="' +
          escapeHtml(item.url) +
          '">' +
          '<span class="site-search__type">' +
          escapeHtml(item.type) +
          "</span>" +
          '<strong class="site-search__title">' +
          escapeHtml(item.title) +
          "</strong>" +
          '<span class="site-search__excerpt">' +
          escapeHtml(item.excerpt).slice(0, 150) +
          "</span>" +
          '<span class="site-search__url">' +
          escapeHtml(item.url) +
          "</span>" +
          "</a>"
        );
      })
      .join("");
    elements.results.scrollTop = 0;
  }

  function runSearch() {
    var query = elements.input.value.trim();
    var version = ++searchVersion;
    elements.retry.hidden = true;
    if (!query) {
      showStatus("输入关键词搜索官网、资源中心和教程。");
      return;
    }

    if (!indexLoaded) showStatus("正在加载搜索索引…");
    loadIndex()
      .then(function (entries) {
        if (version === searchVersion) render(search(entries, query));
      })
      .catch(function () {
        if (version !== searchVersion) return;
        showStatus("搜索暂时无法加载，请重试。");
        elements.retry.hidden = false;
      });
  }

  function canRestoreFocus(el) {
    return el && el.isConnected && el.getClientRects().length &&
      getComputedStyle(el).visibility === "visible" && !el.closest("[inert]");
  }

  function closeSearch() {
    if (!elements.dialog || !elements.dialog.open) return;
    searchVersion++;
    elements.dialog.close();
    document.body.classList.remove("site-search-lock");
    var focusTarget = [returnFocus, elements.trigger, document.getElementById("navHamburger")]
      .find(canRestoreFocus);
    if (focusTarget) focusTarget.focus({ preventScroll: true });
    returnFocus = null;
  }

  function openSearch(opener) {
    if (!elements.dialog) createSearchUi();
    if (!elements.dialog.open) {
      returnFocus = opener === document.body ? null : opener;
      elements.dialog.showModal();
      document.body.classList.add("site-search-lock");
      runSearch();
    }
    elements.input.focus();
    elements.input.select();
  }

  function createButton() {
    var links = document.querySelector(".nav__links");
    if (!links || links.querySelector(".site-search-trigger")) return;

    var button = document.createElement("button");
    button.type = "button";
    button.className = "nav__link site-search-trigger";
    button.setAttribute("aria-haspopup", "dialog");
    button.innerHTML =
      '<span class="site-search-trigger__icon" aria-hidden="true"></span><span>搜索全站</span>';
    button.addEventListener("click", function () { openSearch(button); });
    links.appendChild(button);
    elements.trigger = button;
  }

  function createSearchUi() {
    var dialog = document.createElement("dialog");
    dialog.className = "site-search";
    dialog.setAttribute("aria-label", "搜索全站");
    dialog.innerHTML =
      '<div class="site-search__panel">' +
      '<div class="site-search__bar">' +
      '<span class="site-search__icon" aria-hidden="true"></span>' +
      '<input class="site-search__input" type="search" aria-label="搜索关键词" placeholder="搜索官网、资源、教程…" autocomplete="off" autofocus />' +
      '<button class="site-search__close" type="button" aria-label="关闭搜索">×</button>' +
      "</div>" +
      '<p class="site-search__status" role="status"></p>' +
      '<button class="site-search__retry" type="button" hidden>重试搜索</button>' +
      '<div class="site-search__results" hidden></div>' +
      "</div>";
    document.body.appendChild(dialog);

    elements.dialog = dialog;
    elements.input = dialog.querySelector(".site-search__input");
    elements.close = dialog.querySelector(".site-search__close");
    elements.status = dialog.querySelector(".site-search__status");
    elements.retry = dialog.querySelector(".site-search__retry");
    elements.results = dialog.querySelector(".site-search__results");

    dialog.addEventListener("cancel", function (event) {
      event.preventDefault();
      closeSearch();
    });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) closeSearch();
      if (event.target.closest(".site-search__result") &&
          !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) closeSearch();
    });
    elements.close.addEventListener("click", closeSearch);
    elements.retry.addEventListener("click", function () {
      elements.input.focus();
      runSearch();
    });
    elements.input.addEventListener("input", runSearch);
  }

  function handleDialogKey(event) {
    if (event.isComposing) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeSearch();
    } else if (event.key === "Tab") {
      var results = elements.results.querySelectorAll("a");
      var last = results[results.length - 1] || (elements.retry.hidden ? elements.close : elements.retry);
      var wrap = event.shiftKey ? document.activeElement === elements.input : document.activeElement === last;
      if (wrap) {
        event.preventDefault();
        (event.shiftKey ? last : elements.input).focus();
      }
    }
  }

  function init() {
    ensureStyles();
    createButton();
    document.addEventListener("keydown", function (event) {
      if (elements.dialog && elements.dialog.open) handleDialogKey(event);
    }, true);
    document.addEventListener("keydown", function (event) {
      if (event.defaultPrevented || event.isComposing) return;
      var target = event.target;
      var typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch(document.activeElement);
      } else if (event.key === "/" && !typing && !(elements.dialog && elements.dialog.open)) {
        event.preventDefault();
        openSearch(document.activeElement);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
