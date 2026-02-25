/**
 * Generate static HTML pages for each podcast episode.
 *
 * Usage: node scripts/generate-episodes.mjs
 * Output: resources/episodes/epXXX.html
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const EPISODES_PATH = join(ROOT, "resources/data/episodes.json");
const OUT_DIR = join(ROOT, "resources/episodes");

const episodes = JSON.parse(readFileSync(EPISODES_PATH, "utf-8"));

mkdirSync(OUT_DIR, { recursive: true });

function durationToISO(dur) {
  const parts = dur.split(":").map(Number);
  if (parts.length === 3) return `PT${parts[0]}H${parts[1]}M${parts[2]}S`;
  return `PT${parts[0]}M${parts[1]}S`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function epUrl(epNum) {
  return `https://xiaoyuanvc.com/resources/episodes/ep${epNum}.html`;
}

function buildPage(ep, idx) {
  const title = `EP${ep.ep}: ${ep.title}`;
  const canonicalUrl = epUrl(ep.ep);

  // Prev/Next — episodes array is newest-first (higher ep numbers first)
  const newerEp = idx > 0 ? episodes[idx - 1] : null;
  const olderEp = idx < episodes.length - 1 ? episodes[idx + 1] : null;

  const prevLink = olderEp
    ? `<a href="ep${olderEp.ep}.html" class="podcast-nav__link">&larr; EP${olderEp.ep}</a>`
    : `<span class="podcast-nav__link podcast-nav__link--disabled">&larr; 已是最早一期</span>`;

  const nextLink = newerEp
    ? `<a href="ep${newerEp.ep}.html" class="podcast-nav__link">EP${newerEp.ep} &rarr;</a>`
    : `<span class="podcast-nav__link podcast-nav__link--disabled">已是最新一期 &rarr;</span>`;

  // JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: title,
    description: ep.description || "",
    datePublished: ep.date,
    url: canonicalUrl,
    episodeNumber: ep.ep,
    partOfSeries: {
      "@type": "PodcastSeries",
      name: "CSS — 校园VC的创客频道",
      url: "https://xiaoyuanvc.com/resources/",
      author: {
        "@type": "Organization",
        name: "校园VC",
        url: "https://xiaoyuanvc.com",
      },
    },
  };
  if (ep.duration) jsonLd.timeRequired = durationToISO(ep.duration);
  if (ep.audioUrl)
    jsonLd.associatedMedia = {
      "@type": "AudioObject",
      contentUrl: ep.audioUrl,
    };
  if (ep.guest)
    jsonLd.performer = {
      "@type": "Person",
      name: ep.guest,
      description: ep.guestIntro || "",
    };

  // Show Notes section
  const showNotesHtml = ep.showNotes
    ? `<div class="podcast-notes__content">${ep.showNotes}</div>`
    : `<div class="show-notes-placeholder">
        <p>详细笔记即将上线</p>
        <p class="show-notes-placeholder__sub">我们正在使用 AI 为每期节目生成详细笔记，敬请期待。</p>
      </div>`;

  // Audio player (only rendered if audioUrl exists)
  const playerHtml = ep.audioUrl
    ? `
      <!-- Large Inline Player -->
      <div class="podcast-player">
        <audio id="podcastAudio" src="${escapeHtml(ep.audioUrl)}" preload="metadata"></audio>
        <div class="podcast-player__embed">
          <button class="podcast-player__play-btn" id="podcastPlayBtn" aria-label="播放">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </button>
          <div class="podcast-player__controls">
            <div class="podcast-player__progress-bar" id="podcastBar">
              <div class="podcast-player__progress-fill" id="podcastBarFill"></div>
            </div>
            <div class="podcast-player__time-row">
              <span class="podcast-player__time" id="podcastCurrentTime">0:00</span>
              <span class="podcast-player__time" id="podcastTotalTime">0:00</span>
            </div>
          </div>
        </div>
      </div>`
    : "";

  const xiaoyuzhouLink = ep.xiaoyuzhouUrl
    ? `<a href="${escapeHtml(ep.xiaoyuzhouUrl)}" target="_blank" rel="noopener" class="podcast-links__item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
            </svg>
            <span>在小宇宙收听</span>
          </a>`
    : "";

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} | 校园VC 资源中心</title>
    <meta name="description" content="${escapeHtml(ep.description || "")}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <link rel="icon" href="../../assets/favicon.ico" />

    <!-- Open Graph -->
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(ep.description || "")}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="校园VC" />

    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>

    <!-- Inter Font -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

    <!-- CSS -->
    <link rel="stylesheet" href="../../styles.css" />
    <link rel="stylesheet" href="../resources.css" />

    <!-- Google Analytics (GA4) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-LP5EB2HW33"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', 'G-LP5EB2HW33');
    </script>
  </head>
  <body>
    <!-- Navigation -->
    <nav class="nav" id="nav">
      <div class="nav__inner">
        <a href="/" class="nav__logo">
          <img src="../../assets/logo-color.png" alt="校园VC Logo" width="140" height="40" />
        </a>
        <button class="nav__hamburger" id="navHamburger" aria-label="打开导航菜单" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
        <div class="nav__menu" id="navMenu">
          <div class="nav__links">
            <a href="/" class="nav__link">首页</a>
            <a href="/#about" class="nav__link">品牌介绍</a>
            <a href="/#products" class="nav__link">产品展示</a>
            <a href="/resources/" class="nav__link active">资源中心</a>
            <a href="/#founder" class="nav__link">团队介绍</a>
            <a href="/#faq" class="nav__link">常见问题</a>
            <a href="/#contact" class="nav__link">联系我们</a>
            <a href="https://learn.xiaoyuanvc.com" class="btn btn-primary nav__cta" target="_blank" rel="noopener">免费学习</a>
          </div>
        </div>
        <div class="nav__overlay" id="navOverlay"></div>
      </div>
    </nav>

    <!-- Podcast Detail -->
    <div class="podcast-detail" id="podcastDetail">
      <!-- Breadcrumb -->
      <div class="breadcrumb-container">
        <div class="breadcrumb">
          <a href="/">首页</a>
          <span class="breadcrumb__separator">/</span>
          <a href="/resources/">资源</a>
          <span class="breadcrumb__separator">/</span>
          <span class="breadcrumb__current">EP${ep.ep}</span>
        </div>
      </div>

      <!-- Header -->
      <div class="podcast-header">
        <div class="podcast-header__meta">
          <span class="type-badge type-badge--podcast">播客</span>
          <time datetime="${escapeHtml(ep.date)}">${escapeHtml(ep.date)}</time>
          <span>${escapeHtml(ep.duration || "")}</span>
        </div>
        <h1 class="podcast-header__title">${escapeHtml(title)}</h1>
        ${ep.guest ? `<p class="podcast-header__guest">嘉宾: ${escapeHtml(ep.guest)}</p>` : ""}
        ${ep.guestIntro ? `<p class="podcast-header__guest-intro">${escapeHtml(ep.guestIntro)}</p>` : ""}
      </div>
${playerHtml}

      <!-- Show Notes (description) -->
      <div class="podcast-notes">
        <h2 class="podcast-notes__heading">节目简介</h2>
        <div class="podcast-notes__content">${escapeHtml(ep.description || "")}</div>
      </div>

      <!-- Show Notes Detail -->
      <div class="podcast-notes">
        <h2 class="podcast-notes__heading">Show Notes</h2>
        ${showNotesHtml}
      </div>

      <!-- External Listening Links -->
      <div class="podcast-links">
        <h2 class="podcast-links__heading">收听平台</h2>
        <div class="podcast-links__list">
          ${xiaoyuzhouLink}
          <a href="https://podcasts.apple.com/cn/podcast/css-%E6%A0%A1%E5%9B%ADvc%E7%9A%84%E5%88%9B%E5%AE%A2%E9%A2%91%E9%81%93/id1686919222" target="_blank" rel="noopener" class="podcast-links__item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a10 10 0 0 0-3.16 19.5c.13-.44.22-.9.22-1.41V18a3 3 0 0 0-1-2.24A4 4 0 0 1 12 4a4 4 0 0 1 3.94 11.76A3 3 0 0 0 15 18v2.09c0 .51.09.97.22 1.41A10 10 0 0 0 12 2z" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
            <span>Apple Podcasts</span>
          </a>
        </div>
      </div>

      <!-- Prev/Next Navigation -->
      <div class="podcast-nav">
        ${prevLink}
        <a href="/resources/" class="podcast-nav__link">返回资源中心</a>
        ${nextLink}
      </div>
    </div>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer__inner">
          <div class="footer__logo">
            <img src="../../assets/logo-white.png" alt="校园VC Logo" width="196" height="56" />
          </div>
          <p class="footer__slogan">10年推动100万大学生创业</p>
          <nav class="footer__nav">
            <a href="/">首页</a>
            <a href="/#about">品牌介绍</a>
            <a href="/#products">产品展示</a>
            <a href="/resources/">资源中心</a>
            <a href="/#founder">团队介绍</a>
            <a href="/#contact">联系我们</a>
          </nav>
          <div class="footer__divider"></div>
          <div class="footer__bottom">
            <div class="footer__filing">
              <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">京ICP备2021017602号</a>
              <a href="https://www.beian.gov.cn/" target="_blank" rel="noopener">京公网安备11010802035175号</a>
            </div>
            <p class="footer__copyright">&copy; 2026 校园VC. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>

    <script src="../resources.js"></script>
    ${
      ep.audioUrl
        ? `<script>
    (function () {
      'use strict';
      var audio = document.getElementById('podcastAudio');
      var playBtn = document.getElementById('podcastPlayBtn');
      var bar = document.getElementById('podcastBar');
      var barFill = document.getElementById('podcastBarFill');
      var currentTimeEl = document.getElementById('podcastCurrentTime');
      var totalTimeEl = document.getElementById('podcastTotalTime');

      function formatTime(s) {
        if (isNaN(s)) return '0:00';
        var h = Math.floor(s / 3600);
        var m = Math.floor((s % 3600) / 60);
        var sec = Math.floor(s % 60);
        if (h > 0) return h + ':' + (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
        return m + ':' + (sec < 10 ? '0' : '') + sec;
      }

      audio.addEventListener('loadedmetadata', function () {
        totalTimeEl.textContent = formatTime(audio.duration);
      });

      audio.addEventListener('timeupdate', function () {
        currentTimeEl.textContent = formatTime(audio.currentTime);
        var pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
        barFill.style.width = pct + '%';
      });

      var isPlaying = false;
      playBtn.addEventListener('click', function () {
        if (isPlaying) {
          audio.pause();
          playBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>';
        } else {
          audio.play();
          playBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
        }
        isPlaying = !isPlaying;
      });

      audio.addEventListener('ended', function () {
        isPlaying = false;
        playBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>';
      });

      bar.addEventListener('click', function (e) {
        if (!audio.duration) return;
        var rect = bar.getBoundingClientRect();
        audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
      });
    })();
    </script>`
        : ""
    }
  </body>
</html>`;
}

let count = 0;
for (let i = 0; i < episodes.length; i++) {
  const ep = episodes[i];
  const html = buildPage(ep, i);
  const outPath = join(OUT_DIR, `ep${ep.ep}.html`);
  writeFileSync(outPath, html, "utf-8");
  count++;
  console.log(`  EP${ep.ep}: ${ep.title}`);
}

console.log(
  `\nDone. Generated ${count} static episode pages → resources/episodes/`,
);
