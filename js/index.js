// index.js — versión corregida y robusta

// Año en footer
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Menú móvil
const toggle = document.getElementById("menu-toggle");
const menu = document.getElementById("mobile-menu");
if (toggle && menu) {
    toggle.addEventListener("click", () => menu.classList.toggle("hidden"));
}

// Fade-in observer (opcional)
const fadeEls = document.querySelectorAll(".fade-in");
if (fadeEls.length) {
    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add("visible");
            });
        },
        { threshold: 0.1 }
    );
    fadeEls.forEach(el => observer.observe(el));
}

// Header scroll (mantengo la lógica ligera)
const header = document.getElementById("main-header");
if (header) {
    const headerInner = header.querySelector("div");
    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            header.classList.add("shadow-md");
            if (headerInner) {
                headerInner.classList.add("py-3");
                headerInner.classList.remove("py-6");
            }
        } else {
            header.classList.remove("shadow-md");
            if (headerInner) {
                headerInner.classList.remove("py-3");
                headerInner.classList.add("py-6");
            }
        }
    });
}

