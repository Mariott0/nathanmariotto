/* Shared interactions, without a framework or animation dependencies. */
(() => {
  "use strict";
  const root = document.documentElement;
  const themeToggle = document.querySelector("#themeToggle");
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector("#menuToggle");
  const navigation = document.querySelector("#mainNav");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const year = document.querySelector("#currentYear");
  if (year) year.textContent = new Date().getFullYear();

  const applyTheme = (theme, save = false) => {
    const dark = theme !== "light";
    root.dataset.theme = dark ? "dark" : "light";
    if (themeMeta) themeMeta.content = dark ? "#0b0e11" : "#f6f7f2";
    if (themeToggle) {
      const label = dark ? "Ativar tema claro" : "Ativar tema escuro";
      themeToggle.setAttribute("aria-label", label);
      themeToggle.title = label;
    }
    if (save) {
      try { localStorage.setItem("portfolio-theme", root.dataset.theme); } catch { /* Keep the current page usable. */ }
    }
  };
  applyTheme(root.dataset.theme);
  themeToggle?.addEventListener("click", () => applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true));
  window.addEventListener("storage", (event) => { if (event.key === "portfolio-theme") applyTheme(event.newValue); });

  const setMenu = (open, returnFocus = false) => {
    if (!menuToggle || !navigation) return;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    navigation.classList.toggle("is-open", open);
    if (returnFocus) menuToggle.focus();
  };
  menuToggle?.addEventListener("click", () => setMenu(menuToggle.getAttribute("aria-expanded") !== "true"));
  navigation?.addEventListener("click", (event) => { if (event.target.closest("a")) setMenu(false); });
  document.addEventListener("click", (event) => { if (!header?.contains(event.target)) setMenu(false); });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle?.getAttribute("aria-expanded") === "true") setMenu(false, true);
  });
  header?.addEventListener("focusout", (event) => { if (!header.contains(event.relatedTarget)) setMenu(false); });
  window.matchMedia("(min-width: 801px)").addEventListener("change", () => setMenu(false));

  let scrollPending = false;
  const updateScroll = () => {
    const height = root.scrollHeight - window.innerHeight;
    root.style.setProperty("--scroll-progress", String(height > 0 ? Math.min(1, Math.max(0, window.scrollY / height)) : 0));
    header?.classList.toggle("is-scrolled", window.scrollY > 15);
    scrollPending = false;
  };
  const queueScroll = () => {
    if (scrollPending) return;
    scrollPending = true;
    requestAnimationFrame(updateScroll);
  };
  window.addEventListener("scroll", queueScroll, { passive: true });
  window.addEventListener("resize", queueScroll, { passive: true });
  window.addEventListener("load", queueScroll);
  updateScroll();

  const revealElements = [...document.querySelectorAll("[data-reveal]")];
  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.06, rootMargin: "0px 0px -25px 0px" });
    revealElements.forEach((element) => {
      element.classList.add("reveal");
      const siblings = [...element.parentElement.children].filter((sibling) => sibling.hasAttribute("data-reveal"));
      element.style.setProperty("--reveal-delay", `${Math.min(siblings.indexOf(element) * 65, 195)}ms`);
      revealObserver.observe(element);
    });
    reducedMotion.addEventListener("change", (event) => {
      if (!event.matches) return;
      revealObserver.disconnect();
      revealElements.forEach((element) => element.classList.add("is-visible"));
    });
    document.addEventListener("focusin", (event) => event.target.closest?.(".reveal")?.classList.add("is-visible"));
  }

  // Only local hash links belong in the observer; project links are URLs.
  const sectionLinks = [...document.querySelectorAll('.main-nav a[href^="#"]')]
    .map((link) => ({ link, section: document.getElementById(link.hash.slice(1)) }))
    .filter(({ section }) => section);
  if ("IntersectionObserver" in window && sectionLinks.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach(({ link, section }) => {
          const active = section === entry.target;
          link.classList.toggle("is-active", active);
          if (active) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-15% 0px -65% 0px", threshold: 0 });
    sectionLinks.forEach(({ section }) => sectionObserver.observe(section));
  }

  const filters = document.querySelector(".project-filters");
  const projects = [...document.querySelectorAll(".project-card[data-category]")];
  if (filters && projects.length) {
    filters.hidden = false;
    filters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      filters.querySelectorAll("[data-filter]").forEach((filter) => {
        const active = filter === button;
        filter.classList.toggle("is-active", active);
        filter.setAttribute("aria-pressed", String(active));
      });
      let visible = 0;
      projects.forEach((project) => {
        project.hidden = button.dataset.filter !== "all" && project.dataset.category !== button.dataset.filter;
        if (!project.hidden) { visible++; project.classList.add("is-visible"); }
      });
      const status = document.querySelector("#filterStatus");
      if (status) status.textContent = `${visible} ${visible === 1 ? "projeto exibido" : "projetos exibidos"}.`;
      queueScroll();
    });
  }
})();
