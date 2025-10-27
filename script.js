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


/*Scripts para la pagina de menu*/

document.getElementById("year").textContent = new Date().getFullYear();

const dayButtons = document.querySelectorAll(".day-btn");
const resumen = document.getElementById("resumen");
const enviarBtn = document.getElementById("enviarPedido");
let selectedDays = new Set();

// Manejo de selección de días
dayButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        const day = btn.dataset.day;
        if (selectedDays.has(day)) {
            selectedDays.delete(day);
            btn.classList.remove("bg-green-600", "text-white");
        } else {
            selectedDays.add(day);
            btn.classList.add("bg-green-600", "text-white");
        }
        actualizarResumen();
    });
});

function calcularPrecio(cantidad) {
    if (cantidad >= 5) return 65;
    if (cantidad >= 3) return 70;
    return 80;
}

function actualizarResumen() {
    const dias = Array.from(selectedDays);
    const cantidad = dias.length;
    if (cantidad === 0) {
        resumen.textContent = "No has seleccionado días todavía.";
        return;
    }
    const precioUnitario = calcularPrecio(cantidad);
    const total = cantidad * precioUnitario;
    const sinDescuento = cantidad * 80;
    const ahorro = sinDescuento - total;

    resumen.innerHTML = `
          <strong>Días seleccionados:</strong> ${dias.join(", ")} <br>
          <strong>Precio unitario:</strong> $${precioUnitario} MXN <br>
          <strong>Total:</strong> $${total} MXN <br>
          <span class="text-green-700 font-semibold">¡Ahorras $${ahorro} MXN!</span>
        `;
}

enviarBtn.addEventListener("click", () => {
    const dias = Array.from(selectedDays);
    if (dias.length === 0) {
        alert("Selecciona al menos un día para continuar.");
        return;
    }

    const entrada = document.getElementById("entrada").value;
    const guarnicion = document.getElementById("guarnicion").value;
    const fuerte = document.getElementById("fuerte").value;
    const precio = calcularPrecio(dias.length);
    const total = dias.length * precio;

    const mensaje = encodeURIComponent(
        `🍽 *Nuevo pedido semanal:*\n\n📅 Días: ${dias.join(", ")}\n🥣 Entrada: ${entrada}\n🍚 Guarnición: ${guarnicion}\n🍗 Plato fuerte: ${fuerte}\n💰 Total: $${total} MXN\n\n¡Gracias por tu pedido!`
    );

    const telefono = "5537017294"; // <-- reemplázalo con tu número de WhatsApp
    const url = `https://wa.me/${telefono}?text=${mensaje}`;
    window.open(url, "_blank");
});