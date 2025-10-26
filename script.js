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
