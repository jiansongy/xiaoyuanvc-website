<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import { onMounted } from "vue";

const { Layout } = DefaultTheme;

function applyActiveStates() {
  if (typeof location === "undefined") return;
  const path = location.pathname;
  const inDigital = path.includes("/digital-startup");
  const inCrypto = path.includes("/crypto-vc");
  const parent = document.querySelector(
    ".nav__item--dropdown > .nav__link",
  );
  if (parent) parent.classList.toggle("active", inDigital || inCrypto);
  document.querySelectorAll(".nav__submenu-link").forEach((el) => {
    const href = el.getAttribute("href") || "";
    el.classList.toggle(
      "active",
      (href.includes("/digital-startup") && inDigital) ||
        (href.includes("/crypto-vc") && inCrypto),
    );
  });
}

onMounted(() => {
  const hamburger = document.getElementById("navHamburger");
  const menu = document.getElementById("navMenu");
  const overlay = document.getElementById("navOverlay");
  if (!hamburger || !menu) return;

  let open = false;
  const close = () => {
    hamburger.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    menu.classList.remove("open");
    overlay?.classList.remove("open");
    document.body.style.overflow = "";
    open = false;
  };
  const toggle = () => {
    open = !open;
    if (open) {
      hamburger.classList.add("open");
      hamburger.setAttribute("aria-expanded", "true");
      menu.classList.add("open");
      overlay?.classList.add("open");
      document.body.style.overflow = "hidden";
    } else {
      close();
    }
  };

  hamburger.addEventListener("click", toggle);
  overlay?.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && open) close();
  });

  // 滚动时切换 .scrolled 背景，与主站一致
  const nav = document.getElementById("nav");
  const onScroll = () => {
    if (!nav) return;
    if (window.scrollY > 10) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // 初次挂载 + 路由切换时刷新 active 高亮
  applyActiveStates();
  const refresh = () => setTimeout(applyActiveStates, 0);
  window.addEventListener("popstate", refresh);
  // VitePress SPA 通过 history.pushState 切页，包装一次以触发刷新
  const origPush = history.pushState.bind(history);
  history.pushState = function (...args) {
    const r = origPush(...args);
    refresh();
    return r;
  };
});
</script>

<template>
  <Layout>
    <template #layout-top>
      <nav class="nav vp-raw" id="nav">
        <div class="nav__inner">
          <a class="nav__logo" href="/" aria-label="校园VC 首页">
            <img :src="'/assets/logo-color.png'" alt="校园VC Logo" width="81" height="40" />
          </a>
          <button
            class="nav__hamburger"
            id="navHamburger"
            aria-label="打开导航菜单"
            aria-expanded="false"
            type="button"
          >
            <span></span><span></span><span></span>
          </button>
          <div class="nav__menu" id="navMenu">
            <div class="nav__links">
              <a class="nav__link" href="/">首页</a>
              <div class="nav__item nav__item--dropdown">
                <a class="nav__link" href="/student.html">
                  我是学生<span class="nav__caret" aria-hidden="true">▾</span>
                </a>
                <div class="nav__submenu" role="menu">
                  <a
                    class="nav__submenu-link"
                    href="/learn/digital-startup/"
                    role="menuitem"
                  >数创教程</a>
                  <a
                    class="nav__submenu-link"
                    href="/learn/crypto-vc/"
                    role="menuitem"
                  >加密教程</a>
                </div>
              </div>
              <a class="nav__link" href="/teacher.html">我是教师</a>
              <a class="nav__link" href="/resources/">资源中心</a>
              <a class="nav__link" href="/#founder">团队介绍</a>
              <a class="nav__link" href="/#contact">联系我们</a>
            </div>
          </div>
          <div class="nav__overlay" id="navOverlay"></div>
        </div>
      </nav>
    </template>
  </Layout>
</template>
