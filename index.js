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

/* ========== LÓGICA DEL MODAL DE EMPRESA ========== */

// Elementos del modal (coinciden con tu HTML)
const modal = document.getElementById("modal");
const empresaInput = document.getElementById("empresaInput");
const errorEmpresa = document.getElementById("errorEmpresa");
const btnEntrar = document.getElementById("entrar");
const btnCancelar = document.getElementById("cancelar");

// Botones que abren el modal (pueden existir o no)
const posiblesAbridores = [
    document.getElementById("verMenu"),
    document.getElementById("verMenuMobile"),
    document.getElementById("verMenuLink")
].filter(Boolean); // descartamos nulls

// Lista de empresas autorizadas (cargada desde menu.json)
let empresasAutorizadas = [];

// Funciones para abrir/cerrar modal
function abrirModal() {
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    if (empresaInput) {
        empresaInput.value = "";
        empresaInput.focus();
    }
    if (errorEmpresa) errorEmpresa.classList.add("hidden");
}

function cerrarModal() {
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    if (errorEmpresa) errorEmpresa.classList.add("hidden");
}

// Añadir listeners a cada botón que abre modal
if (posiblesAbridores.length === 0) {
    // Consola informativa para depuración
    console.warn("No se encontraron botones para abrir el modal (ids: verMenu, verMenuMobile, verMenuLink).");
}
posiblesAbridores.forEach(btn => {
    btn.addEventListener("click", abrirModal);
});

// Cancelar
if (btnCancelar) btnCancelar.addEventListener("click", cerrarModal);

// Cerrar al hacer click fuera del panel del modal
if (modal) {
    modal.addEventListener("click", (e) => {
        if (e.target === modal) cerrarModal();
    });
}

// Cerrar con Esc
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrarModal();
});

// Habilitar Enter en el input para "Entrar"
if (empresaInput) {
    empresaInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (btnEntrar) btnEntrar.click();
        }
    });
}

// Cargar empresas desde menu.json (fichero central)
fetch("menu.json")
    .then(res => {
        if (!res.ok) throw new Error("No se pudo cargar menu.json");
        return res.json();
    })
    .then(data => {
        if (data && Array.isArray(data.empresas)) {
            empresasAutorizadas = data.empresas.map(e => String(e).trim().toLowerCase());
        } else {
            console.warn("menu.json no contiene 'empresas' como arreglo. Asegúrate de la estructura.");
        }
    })
    .catch(err => {
        console.error("Error cargando menu.json:", err);
        // opcional: mostrar mensaje visible al admin si falta el archivo
    });

// Validación y redirección al presionar Entrar
if (btnEntrar) {
    btnEntrar.addEventListener("click", () => {
        if (!empresaInput) return;
        const entrada = empresaInput.value.trim().toLowerCase();
        if (!entrada) {
            if (errorEmpresa) {
                errorEmpresa.textContent = "Ingresa el nombre de la empresa.";
                errorEmpresa.classList.remove("hidden");
            }
            return;
        }

        // Si la lista aún no se cargó, prevenimos fallos y avisamos
        if (!empresasAutorizadas.length) {
            // fallback: permitir acceso si quieres mientras se configura (ahora lo bloqueamos)
            if (errorEmpresa) {
                errorEmpresa.textContent = "Validando... por favor intenta de nuevo en unos segundos.";
                errorEmpresa.classList.remove("hidden");
            }
            return;
        }

        const autorizada = empresasAutorizadas.includes(entrada);
        if (autorizada) {
            localStorage.setItem("empresa", entrada); // guardamos en localStorage
            window.location.href = "menu.html";
        } else {
            if (errorEmpresa) {
                errorEmpresa.textContent = "Ups!, empresa sin convenio.";
                errorEmpresa.classList.remove("hidden");
            }
        }
    });
}
