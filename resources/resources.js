(function () {
  "use strict";

  // ============================================
  // Module 1: Nav scroll effect + Hamburger menu
  // ============================================
  var nav = document.getElementById("nav");
  if (nav) {
    window.addEventListener("scroll", function () {
      nav.classList.toggle("scrolled", window.scrollY > 20);
    });
  }

  var hamburger = document.getElementById("navHamburger");
  var menu = document.getElementById("navMenu");
  var overlay = document.getElementById("navOverlay");
  if (hamburger && menu) {
    hamburger.addEventListener("click", function () {
      var isOpen = menu.classList.toggle("open");
      hamburger.classList.toggle("open", isOpen);
      hamburger.setAttribute("aria-expanded", isOpen);
      if (overlay) overlay.classList.toggle("open", isOpen);
      document.body.style.overflow = isOpen ? "hidden" : "";
    });
    if (overlay) {
      overlay.addEventListener("click", function () {
        menu.classList.remove("open");
        hamburger.classList.remove("open");
        hamburger.setAttribute("aria-expanded", "false");
        overlay.classList.remove("open");
        document.body.style.overflow = "";
      });
    }
  }

  document.addEventListener("click", function (event) {
    var target = event.target.closest("[data-analytics]");
    if (!target || typeof window.gtag !== "function") return;

    window.gtag("event", target.getAttribute("data-analytics"), {
      link_label:
        target.getAttribute("data-analytics-label") ||
        target.textContent.trim(),
      link_url: target.getAttribute("href") || "",
    });
  });

  // ============================================
  // Module 2: Podcast card renderer
  // ============================================
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    if (!str) return "";
    return str.replace(/'/g, "\\'").replace(/"/g, "&quot;");
  }

  function renderPodcastCards() {
    var container = document.getElementById("podcastCards");
    if (!container) return Promise.resolve();

    return fetch("data/episodes.json")
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        var episodes = data.episodes || data;
        var html = "";
        episodes.forEach(function (ep) {
          html +=
            '<div class="resource-card" data-type="podcast" data-topic="' +
            (ep.tags ? ep.tags[0] : "加密创投") +
            '">' +
            '<div class="resource-card__body">' +
            '<div class="resource-card__meta">' +
            '<span class="type-badge type-badge--podcast">播客</span>' +
            '<span class="resource-card__date">' +
            escapeHtml(ep.date) +
            "</span>" +
            '<span class="resource-card__date">' +
            escapeHtml(ep.duration) +
            "</span>" +
            "</div>" +
            '<h3 class="resource-card__title">' +
            '<a href="episodes/ep' +
            ep.ep +
            '.html">EP' +
            ep.ep +
            ": " +
            escapeHtml(ep.title) +
            "</a>" +
            "</h3>" +
            (ep.guest
              ? '<p class="resource-card__excerpt" style="margin-bottom:var(--space-xs);color:var(--color-text-tertiary);font-size:0.875rem;">嘉宾: ' +
                escapeHtml(ep.guest) +
                "</p>"
              : "") +
            '<p class="resource-card__excerpt">' +
            escapeHtml(ep.description || "").substring(0, 120) +
            "...</p>" +
            '<div class="resource-card__tags" style="margin-top:auto;padding-top:var(--space-md);">' +
            '<button class="play-btn" onclick="playEpisode(\'' +
            escapeAttr(ep.audioUrl) +
            "', 'EP" +
            ep.ep +
            ": " +
            escapeAttr(ep.title) +
            '\')" aria-label="播放 EP' +
            ep.ep +
            '" style="cursor:pointer;">&#9654; 播放</button>' +
            "</div>" +
            "</div>" +
            "</div>";
        });
        container.innerHTML = html;
      })
      .catch(function (err) {
        console.error("Failed to load episodes:", err);
      });
  }

  // ============================================
  // Module 3: Tag filter
  // ============================================
  var activeFilters = { type: "all", topic: "all" };

  function applyFilters(filters) {
    var cards = document.querySelectorAll(".resource-card");
    var visible = 0;
    cards.forEach(function (card) {
      var typeMatch =
        filters.type === "all" ||
        card.getAttribute("data-type") === filters.type;
      var topicMatch =
        filters.topic === "all" ||
        card.getAttribute("data-topic") === filters.topic;
      var show = typeMatch && topicMatch;
      if (show) {
        card.classList.remove("hidden");
        card.style.display = "";
        visible++;
      } else {
        card.classList.add("hidden");
        card.style.display = "none";
      }
    });

    // Empty state
    var grid = document.getElementById("resourceGrid");
    var emptyMsg = document.getElementById("emptyMsg");
    if (visible === 0) {
      if (!emptyMsg) {
        emptyMsg = document.createElement("p");
        emptyMsg.id = "emptyMsg";
        emptyMsg.className = "resource-grid__empty-msg";
        emptyMsg.textContent = "暂无匹配的内容，试试其他筛选条件";
        grid.appendChild(emptyMsg);
      }
      emptyMsg.style.display = "";
    } else if (emptyMsg) {
      emptyMsg.style.display = "none";
    }

    // Result count
    var filterCount = document.getElementById("filterCount");
    if (filterCount) {
      filterCount.textContent = visible + " 条内容";
    }
  }

  function initFilters() {
    var filterBar = document.getElementById("filterBar");
    if (!filterBar) return;

    filterBar.addEventListener("click", function (e) {
      var pill = e.target.closest(".filter-pill");
      if (!pill) return;

      var group = pill.closest("[data-filter-group]");
      if (!group) return;

      var filterGroup = group.getAttribute("data-filter-group");
      var filterValue = pill.getAttribute("data-filter-value");

      // Update active state in this group
      group.querySelectorAll(".filter-pill").forEach(function (p) {
        p.classList.remove("active");
      });
      pill.classList.add("active");

      activeFilters[filterGroup] = filterValue;
      applyFilters(activeFilters);
    });
  }

  // ============================================
  // Module 4: Audio player
  // ============================================
  var audioElement = null;
  var playerVisible = false;

  function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function updateProgress() {
    if (!audioElement) return;
    var fill = document.getElementById("playerBarFill");
    var timeEl = document.getElementById("playerTime");
    var current = audioElement.currentTime;
    var duration = audioElement.duration || 0;
    var pct = duration ? (current / duration) * 100 : 0;
    if (fill) fill.style.width = pct + "%";
    if (timeEl)
      timeEl.textContent = formatTime(current) + " / " + formatTime(duration);
  }

  function updatePlayButton(isPlaying) {
    var btn = document.getElementById("playerPlayBtn");
    if (!btn) return;
    btn.innerHTML = isPlaying
      ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
      : '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>';
  }

  // Expose playEpisode globally (called from onclick in rendered cards)
  window.playEpisode = function (audioUrl, title) {
    var player = document.getElementById("audioPlayer");
    var titleEl = document.getElementById("playerTitle");

    if (!player) return;

    if (!audioElement) {
      audioElement = new Audio();
      audioElement.addEventListener("timeupdate", updateProgress);
      audioElement.addEventListener("ended", function () {
        updatePlayButton(false);
      });
      audioElement.addEventListener("loadedmetadata", function () {
        updateProgress();
      });
    }

    audioElement.src = audioUrl;
    audioElement.play();
    if (titleEl) titleEl.textContent = title;
    player.classList.add("active");
    playerVisible = true;
    updatePlayButton(true);
  };

  // Player controls — set up on DOMContentLoaded
  document.addEventListener("DOMContentLoaded", function () {
    // Play/pause toggle
    var playBtn = document.getElementById("playerPlayBtn");
    if (playBtn) {
      playBtn.addEventListener("click", function () {
        if (!audioElement) return;
        if (audioElement.paused) {
          audioElement.play();
          updatePlayButton(true);
        } else {
          audioElement.pause();
          updatePlayButton(false);
        }
      });
    }

    // Close button
    var closeBtn = document.getElementById("playerCloseBtn");
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        if (audioElement) {
          audioElement.pause();
          audioElement.src = "";
        }
        var player = document.getElementById("audioPlayer");
        if (player) player.classList.remove("active");
        playerVisible = false;
      });
    }

    // Progress bar click to seek
    var bar = document.getElementById("playerBar");
    if (bar) {
      bar.addEventListener("click", function (e) {
        if (!audioElement || !audioElement.duration) return;
        var rect = bar.getBoundingClientRect();
        var pct = (e.clientX - rect.left) / rect.width;
        audioElement.currentTime = pct * audioElement.duration;
      });
    }

    // Keyboard shortcuts
    document.addEventListener("keydown", function (e) {
      if (!playerVisible || !audioElement) return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;
      if (e.code === "Space") {
        e.preventDefault();
        if (audioElement.paused) {
          audioElement.play();
          updatePlayButton(true);
        } else {
          audioElement.pause();
          updatePlayButton(false);
        }
      } else if (e.code === "ArrowLeft") {
        audioElement.currentTime = Math.max(0, audioElement.currentTime - 15);
      } else if (e.code === "ArrowRight") {
        audioElement.currentTime = Math.min(
          audioElement.duration,
          audioElement.currentTime + 15,
        );
      }
    });
  });

  // ============================================
  // Initialization
  // ============================================
  document.addEventListener("DOMContentLoaded", function () {
    initFilters();
    renderPodcastCards().then(function () {
      applyFilters(activeFilters);
    });
  });
})();
