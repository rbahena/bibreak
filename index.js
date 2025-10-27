document.getElementById("year").textContent = new Date().getFullYear();

const toggle = document.getElementById("menu-toggle");
const menu = document.getElementById("mobile-menu");

toggle.addEventListener("click", () => {
    menu.classList.toggle("hidden");
});

const fadeEls = document.querySelectorAll(".fade-in");
const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add("visible");
        });
    },
    { threshold: 0.1 }
);
fadeEls.forEach((el) => observer.observe(el));
const header = document.getElementById("main-header");

window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
        header.classList.add("shadow-md");
        header.querySelector("div").classList.add("py-3");
        header.querySelector("div").classList.remove("py-6");
    } else {
        header.classList.remove("shadow-md");
        header.querySelector("div").classList.remove("py-3");
        header.querySelector("div").classList.add("py-6");
    }
});