/* Apply a shared preference before paint to avoid a theme flash. */
(() => {
  let theme = "dark";
  try {
    const saved = localStorage.getItem("portfolio-theme");
    if (saved === "light" || saved === "dark") theme = saved;
  } catch { /* The default also works when storage is unavailable. */ }
  document.documentElement.dataset.theme = theme;
})();
