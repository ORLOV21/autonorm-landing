/* ============================================================
   AutoNorm — интерактив лендинга (vanilla JS, без зависимостей).
   1) хедер при скролле  2) мобильное меню  3) активный пункт nav
   4) табы макета (ARIA + клавиатура)  5) reveal  6) счётчики
   7) печать промпта в hero
   Всё учитывает prefers-reduced-motion.
   ============================================================ */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 1. ХЕДЕР ПРИ СКРОЛЛЕ ---------- */
  var header = $(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 10);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- 2. МОБИЛЬНОЕ МЕНЮ ---------- */
  var toggle = $("#nav-toggle");
  var menu = $("#nav-menu");
  function closeMenu() {
    if (!menu) return;
    menu.classList.remove("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$(".nav__link", menu).forEach(function (l) { l.addEventListener("click", closeMenu); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
    window.addEventListener("resize", function () { if (window.innerWidth > 820) closeMenu(); });
  }

  /* ---------- 3. АКТИВНЫЙ ПУНКТ НАВИГАЦИИ ---------- */
  var navLinks = $$(".nav__link");
  var linkById = {};
  navLinks.forEach(function (l) {
    var id = l.getAttribute("href"); if (id && id.charAt(0) === "#") linkById[id.slice(1)] = l;
  });
  var sections = Object.keys(linkById).map(function (id) { return document.getElementById(id); }).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          navLinks.forEach(function (l) { l.classList.remove("is-current"); });
          var active = linkById[en.target.id];
          if (active) active.classList.add("is-current");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (s) { navObs.observe(s); });
  }

  /* ---------- 4. ТАБЫ МАКЕТА (ARIA tablist) ---------- */
  var tablist = $(".app__tabs");
  if (tablist) {
    var tabs = $$('[role="tab"]', tablist);
    function selectTab(tab, focus) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.classList.toggle("is-active", selected);
        t.setAttribute("aria-selected", selected ? "true" : "false");
        t.tabIndex = selected ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) {
          panel.classList.toggle("is-active", selected);
          if (selected) panel.removeAttribute("hidden"); else panel.setAttribute("hidden", "");
        }
      });
      if (focus && tab) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.tabIndex = tab.classList.contains("is-active") ? 0 : -1;
      tab.addEventListener("click", function () { selectTab(tab); });
      tab.addEventListener("keydown", function (e) {
        var idx = i;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") { idx = (i + 1) % tabs.length; }
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { idx = (i - 1 + tabs.length) % tabs.length; }
        else if (e.key === "Home") { idx = 0; }
        else if (e.key === "End") { idx = tabs.length - 1; }
        else { return; }
        e.preventDefault();
        selectTab(tabs[idx], true);
      });
    });
  }

  /* ---------- 5. REVEAL ПРИ СКРОЛЛЕ ---------- */
  var reveals = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); obs.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
    reveals.forEach(function (el) { revObs.observe(el); });
  }

  /* ---------- 6. СЧЁТЧИКИ ЦИФР ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    if (isNaN(target)) return;
    var decimals = (el.getAttribute("data-count").indexOf(".") > -1) ? 1 : 0;
    if (reduceMotion) { el.textContent = format(target, decimals) + suffix; return; }
    var dur = 1400, start = null;
    function fmtNow(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(target * eased, decimals) + suffix;
      if (p < 1) requestAnimationFrame(fmtNow);
      else el.textContent = format(target, decimals) + suffix;
    }
    requestAnimationFrame(fmtNow);
  }
  function format(n, d) {
    if (d > 0) return n.toFixed(1).replace(".", ",");
    return Math.round(n).toLocaleString("ru-RU");
  }
  var counters = $$("[data-count]");
  if ("IntersectionObserver" in window && counters.length) {
    var cObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); obs.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cObs.observe(el); });
  } else {
    counters.forEach(function (el) { animateCount(el); });
  }

  /* ---------- 7. ПЕЧАТЬ ПРОМПТА В HERO ---------- */
  var typed = $("#hero-typed");
  var prompt = "Проверь модель на коллизии и соответствие СП 60.13330, найди завышения в смете";
  if (typed) {
    if (reduceMotion) {
      typed.textContent = prompt;
    } else {
      var i = 0;
      function type() {
        typed.textContent = prompt.slice(0, i);
        if (i++ <= prompt.length) setTimeout(type, 38);
      }
      setTimeout(type, 600);
    }
  }
})();
