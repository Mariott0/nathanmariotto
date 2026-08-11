const currentYear = document.querySelector("#currentYear");
const contactForm = document.querySelector("#contactForm");
const formStatus = document.querySelector("#formStatus");
const navLinks = document.querySelectorAll(".main-nav a");
const sections = [...navLinks]
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}

if (contactForm && formStatus) {
    contactForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const formData = new FormData(contactForm);
        const name = formData.get("name")?.toString().trim() || "";
        const email = formData.get("email")?.toString().trim() || "";
        const message = formData.get("message")?.toString().trim() || "";

        const subject = encodeURIComponent(`Contato pelo portfólio - ${name}`);
        const body = encodeURIComponent(`${message}\n\nNome: ${name}\nEmail: ${email}`);

        window.location.href = `mailto:loucosgamer124@gmail.com?subject=${subject}&body=${body}`;
        formStatus.textContent = "Abrindo seu aplicativo de email para enviar a mensagem.";
        contactForm.reset();
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
