const currentYear = document.querySelector("#currentYear");
const themeToggle = document.querySelector("#themeToggle");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const navLinks = document.querySelectorAll(".main-nav a");
const sections = [...navLinks]
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

const getSystemTheme = () => (
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
);

const setTheme = (theme, shouldSave = true) => {
    const nextTheme = theme === "dark" ? "dark" : "light";

    document.documentElement.dataset.theme = nextTheme;

    if (themeColorMeta) {
        themeColorMeta.setAttribute("content", nextTheme === "dark" ? "#0b1218" : "#101820");
    }

    if (themeToggle) {
        const nextLabel = nextTheme === "dark" ? "Alternar para tema claro" : "Alternar para tema escuro";
        themeToggle.setAttribute("aria-label", nextLabel);
        themeToggle.setAttribute("title", nextLabel);
    }

    if (shouldSave) {
        try {
            localStorage.setItem("portfolio-theme", nextTheme);
        } catch {
            // Some privacy modes block localStorage; the theme still changes for the current page.
        }
    }
};

if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}

if (themeToggle) {
    setTheme(document.documentElement.dataset.theme || getSystemTheme(), false);

    themeToggle.addEventListener("click", () => {
        const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
        setTheme(currentTheme === "dark" ? "light" : "dark");
    });
}

if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                navLinks.forEach((link) => {
                    link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
                });
            });
        },
        {
            rootMargin: "-35% 0px -55% 0px",
            threshold: 0.01
        }
    );

    sections.forEach((section) => observer.observe(section));
}
