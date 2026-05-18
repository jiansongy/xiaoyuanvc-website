(function () {
  "use strict";

  var INDEX_URL = "/assets/site-search-index.json";
  var isOpen = false;
  var indexPromise = null;
  var elements = {};

  function ensureStyles() {
    if (document.getElementById("siteSearchFallbackStyles")) return;
    var style = document.createElement("style");
    style.id = "siteSearchFallbackStyles";
    style.textContent =
      ".site-search{position:fixed;inset:0;z-index:300;display:none;align-items:flex-start;justify-content:center;padding:96px 24px 24px;font-family:Inter,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',-apple-system,BlinkMacSystemFont,sans-serif}.site-search--open{display:flex}.site-search__backdrop{position:absolute;inset:0;background:rgba(15,23,42,.46);backdrop-filter:blur(3px)}.site-search__panel{position:relative;width:min(720px,100%);max-height:min(680px,calc(100vh - 120px));display:flex;flex-direction:column;overflow:hidden;background:#fff;border:1px solid rgba(15,23,42,.1);border-radius:8px;box-shadow:0 24px 80px rgba(15,23,42,.22)}.site-search__bar{display:flex;align-items:center;gap:14px;padding:16px 18px;border-bottom:1px solid rgba(15,23,42,.08);color:#64748b}.site-search__icon,.site-search-trigger__icon{width:16px;height:16px;border:2px solid currentColor;border-radius:50%;position:relative;flex:0 0 auto}.site-search__icon:after,.site-search-trigger__icon:after{content:'';position:absolute;width:7px;height:2px;right:-5px;bottom:-3px;background:currentColor;border-radius:999px;transform:rotate(45deg)}.site-search__input{min-width:0;flex:1;border:0;outline:0;color:#0f172a;font:inherit;font-size:1rem;background:transparent}.site-search__close{width:34px;height:34px;border:0;border-radius:8px;color:#64748b;background:transparent;font-size:1.5rem;line-height:1;cursor:pointer}.site-search__close:hover{color:#0f172a;background:#f1f5f9}.site-search__results{overflow-y:auto;padding:10px}.site-search__result{display:grid;gap:3px;padding:14px;color:#0f172a;border-radius:8px;text-decoration:none}.site-search__result:hover,.site-search__result:focus-visible{color:#0f172a;background:#f1f5f9}.site-search__type{width:max-content;padding:2px 8px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-size:.75rem;font-weight:700}.site-search__title{font-size:1rem;line-height:1.45}.site-search__excerpt,.site-search__url,.site-search__empty{color:#475569;font-size:.875rem;line-height:1.55}.site-search__url{color:#64748b;word-break:break-all}.site-search__empty{padding:32px 18px;text-align:center}.site-search-lock{overflow:hidden}.site-search-trigger{display:inline-flex;align-items:center;gap:7px}";
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
      indexPromise = fetch(INDEX_URL)
        .then(function (res) {
          if (!res.ok) throw new Error("Search index request failed");
          return res.json();
        })
        .then(function (data) {
          return data.entries || [];
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

  function render(results, query) {
    if (!elements.results) return;

    if (!query.trim()) {
      elements.results.innerHTML =
        '<p class="site-search__empty">输入关键词搜索官网、资源中心和教程。</p>';
      return;
    }

    if (!results.length) {
      elements.results.innerHTML =
        '<p class="site-search__empty">没有找到相关内容，换个关键词试试。</p>';
      return;
    }

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
  }

  function runSearch() {
    var query = elements.input ? elements.input.value : "";
    loadIndex()
      .then(function (entries) {
        render(search(entries, query), query);
      })
      .catch(function () {
        elements.results.innerHTML =
          '<p class="site-search__empty">搜索索引暂时不可用。</p>';
      });
  }

  function closeSearch() {
    if (!isOpen || !elements.root) return;
    elements.root.classList.remove("site-search--open");
    document.body.classList.remove("site-search-lock");
    isOpen = false;
  }

  function openSearch() {
    if (!elements.root) createSearchUi();
    ensureStyles();
    elements.root.classList.add("site-search--open");
    document.body.classList.add("site-search-lock");
    isOpen = true;
    window.setTimeout(function () {
      elements.input.focus();
      elements.input.select();
    }, 0);
    runSearch();
  }

  function createButton() {
    var links = document.querySelector(".nav__links");
    if (!links || links.querySelector(".site-search-trigger")) return;

    var button = document.createElement("button");
    button.type = "button";
    button.className = "nav__link site-search-trigger";
    button.setAttribute("aria-label", "搜索文档");
    button.innerHTML =
      '<span class="site-search-trigger__icon" aria-hidden="true"></span><span>搜索文档</span>';
    button.addEventListener("click", openSearch);
    links.appendChild(button);
  }

  function createSearchUi() {
    var root = document.createElement("div");
    root.className = "site-search";
    root.innerHTML =
      '<div class="site-search__backdrop" data-site-search-close></div>' +
      '<section class="site-search__panel" role="dialog" aria-modal="true" aria-label="搜索文档">' +
      '<div class="site-search__bar">' +
      '<span class="site-search__icon" aria-hidden="true"></span>' +
      '<input class="site-search__input" type="search" placeholder="搜索官网、资源、教程..." autocomplete="off" />' +
      '<button class="site-search__close" type="button" aria-label="关闭搜索">×</button>' +
      "</div>" +
      '<div class="site-search__results" role="list"></div>' +
      "</section>";
    document.body.appendChild(root);

    elements.root = root;
    elements.input = root.querySelector(".site-search__input");
    elements.results = root.querySelector(".site-search__results");

    root.addEventListener("click", function (event) {
      if (
        event.target.hasAttribute("data-site-search-close") ||
        event.target.classList.contains("site-search__close")
      ) {
        closeSearch();
      }
      if (event.target.closest(".site-search__result")) {
        closeSearch();
      }
    });
    elements.input.addEventListener("input", runSearch);
  }

  function init() {
    ensureStyles();
    createButton();
    document.addEventListener("keydown", function (event) {
      var target = event.target;
      var typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      } else if (event.key === "/" && !typing && !isOpen) {
        event.preventDefault();
        openSearch();
      } else if (event.key === "Escape" && isOpen) {
        closeSearch();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
