/**
 * 校园VC 官网 — main.js
 * IIFE pattern, no global variables
 * All DOM operations check element existence
 */
(function () {
  'use strict';

  // ---- Scroll Nav: transparent → blurred background ----
  function initNavScroll() {
    var nav = document.getElementById('nav');
    if (!nav) return;

    function onScroll() {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---- Active nav link highlighting via IntersectionObserver ----
  function initNavHighlight() {
    var navLinks = document.querySelectorAll('.nav__link[data-section]');
    if (!navLinks.length) return;

    var sections = [];
    navLinks.forEach(function (link) {
      var id = link.getAttribute('data-section');
      var section = document.getElementById(id);
      if (section) {
        sections.push({ id: id, el: section });
      }
    });

    if (!sections.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navLinks.forEach(function (link) {
            link.classList.remove('active');
          });
          var activeLink = document.querySelector(
            '.nav__link[data-section="' + entry.target.id + '"]'
          );
          if (activeLink) {
            activeLink.classList.add('active');
          }
        }
      });
    }, {
      rootMargin: '-40% 0px -55% 0px',
      threshold: 0
    });

    sections.forEach(function (s) {
      observer.observe(s.el);
    });
  }

  // ---- Smooth scroll for nav links ----
  function initSmoothScroll() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;

      var targetId = link.getAttribute('href').slice(1);
      var target = document.getElementById(targetId);
      if (!target) return;

      e.preventDefault();
      var navHeight = parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--nav-height')
      ) || 72;

      window.scrollTo({
        top: target.offsetTop - navHeight,
        behavior: 'smooth'
      });

      // Close mobile menu if open
      closeMobileMenu();
    });
  }

  // ---- Number counter animation ----
  function initCounters() {
    var counters = document.querySelectorAll('[data-target]');
    if (!counters.length) return;

    function animateCounter(el) {
      var target = parseInt(el.getAttribute('data-target'), 10);
      if (isNaN(target)) return;

      var suffix = el.getAttribute('data-suffix') || '';
      var duration = 2000;
      var startTime = null;

      function formatNumber(n) {
        if (n >= 10000) {
          return (n / 10000).toFixed(n % 10000 === 0 ? 0 : 1) + '万';
        }
        return n.toLocaleString('zh-CN');
      }

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        // Ease out cubic
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = Math.floor(eased * target);
        el.textContent = formatNumber(current) + suffix;

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = formatNumber(target) + suffix;
        }
      }

      requestAnimationFrame(step);
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    counters.forEach(function (c) {
      observer.observe(c);
    });
  }

  // ---- Scroll fade-in animation ----
  function initFadeIn() {
    var elements = document.querySelectorAll('.fade-in');
    if (!elements.length) return;

    // Check for reduced motion preference
    var prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      elements.forEach(function (el) {
        el.classList.add('visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          // Staggered animation for siblings
          var parent = entry.target.parentElement;
          if (parent) {
            var siblings = parent.querySelectorAll('.fade-in');
            var index = Array.prototype.indexOf.call(siblings, entry.target);
            var delay = Math.max(0, index) * 80;
            entry.target.style.transitionDelay = delay + 'ms';
          }

          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -60px 0px'
    });

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  // ---- Mobile hamburger menu ----
  var menuOpen = false;

  function closeMobileMenu() {
    var hamburger = document.getElementById('navHamburger');
    var menu = document.getElementById('navMenu');
    var overlay = document.getElementById('navOverlay');

    if (hamburger) {
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
    if (menu) menu.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
    menuOpen = false;
  }

  function toggleMobileMenu() {
    var hamburger = document.getElementById('navHamburger');
    var menu = document.getElementById('navMenu');
    var overlay = document.getElementById('navOverlay');

    if (!hamburger || !menu) return;

    menuOpen = !menuOpen;

    if (menuOpen) {
      hamburger.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
      menu.classList.add('open');
      if (overlay) overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    } else {
      closeMobileMenu();
    }
  }

  function initMobileMenu() {
    var hamburger = document.getElementById('navHamburger');
    var overlay = document.getElementById('navOverlay');

    if (hamburger) {
      hamburger.addEventListener('click', toggleMobileMenu);
    }

    if (overlay) {
      overlay.addEventListener('click', closeMobileMenu);
    }

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuOpen) {
        closeMobileMenu();
      }
    });
  }

  // ---- Init all modules on DOMContentLoaded ----
  document.addEventListener('DOMContentLoaded', function () {
    initNavScroll();
    initNavHighlight();
    initSmoothScroll();
    initCounters();
    initFadeIn();
    initMobileMenu();
  });
})();
