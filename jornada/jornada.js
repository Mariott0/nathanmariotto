(() => {
  "use strict";

  const experience = document.querySelector(".audience-experience");
  const tabList = experience?.querySelector('[role="tablist"]');
  const tabs = tabList ? [...tabList.querySelectorAll('[role="tab"]')] : [];

  if (tabs.length) {
    const selectTab = (selectedTab, focus = false) => {
      tabs.forEach((tab) => {
        const selected = tab === selectedTab;
        const panel = document.getElementById(tab.getAttribute("aria-controls"));
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        panel.hidden = !selected;
      });
      if (focus) selectedTab.focus();
    };

    tabs.forEach((tab, index) => {
      const panel = document.getElementById(tab.getAttribute("aria-controls"));
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tab.id);
      panel.tabIndex = 0;
      tab.addEventListener("click", () => selectTab(tab));
      tab.addEventListener("keydown", (event) => {
        let nextIndex;
        if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
        if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = tabs.length - 1;
        if (nextIndex === undefined) return;
        event.preventDefault();
        selectTab(tabs[nextIndex], true);
      });
    });
    selectTab(tabs[0]);
    experience.classList.add("is-enhanced");
    tabList.hidden = false;
  }

  const preview = document.getElementById("boardPreview");
  const openButton = document.getElementById("openPreview");
  const closeButton = document.getElementById("closePreview");

  if (preview && openButton && closeButton && typeof preview.showModal === "function") {
    openButton.hidden = false;
    openButton.addEventListener("click", () => {
      preview.showModal();
      document.body.classList.add("preview-is-open");
    });
    closeButton.addEventListener("click", () => preview.close());
    preview.addEventListener("click", (event) => {
      if (event.target !== preview) return;
      const bounds = preview.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) preview.close();
    });
    preview.addEventListener("close", () => {
      document.body.classList.remove("preview-is-open");
      openButton.focus({ preventScroll: true });
    });
  }
})();
