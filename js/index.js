// ===============================
// === index.js (menú móvil fix definitivo)
// ===============================

// ===============================
// === AÑO EN FOOTER
// ===============================
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();


// ===============================
// === MENÚ MÓVIL (FIX: position fixed al abrir)
// ===============================
const toggle = document.getElementById("menu-toggle");
const menu = document.getElementById("mobile-menu");

if (toggle && menu) {
  // guardamos estilos originales para restaurar al cerrar
  const original = {
    position: menu.style.position || "",
    top: menu.style.top || "",
    left: menu.style.left || "",
    width: menu.style.width || "",
    display: menu.style.display || "",
    maxHeight: menu.style.maxHeight || "",
    overflowY: menu.style.overflowY || "",
    zIndex: menu.style.zIndex || ""
  };

  function aplicarEstilosFijos() {
    // si ya está fixed no hacemos nada extra
    menu.style.position = "fixed";
    // dejarlo debajo del header (ajusta si tu header tiene otra altura)
    menu.style.top = "4rem";
    menu.style.left = "0";
    menu.style.width = "100%";
    menu.style.display = "flex";
    menu.style.zIndex = "9999";
    // que el menú pueda scrollear internamente si es muy largo
    menu.style.maxHeight = "calc(100vh - 4rem)";
    menu.style.overflowY = "auto";

    // opcional: bloquear scroll del body mientras el menú esté abierto (descomenta si quieres)
    // document.body.style.overflow = "hidden";

    // fuerza reflow para evitar glitches móviles
    menu.getBoundingClientRect();
  }

  function restaurarEstilos() {
    // restauramos estilos originales (vacíos volverán a CSS)
    menu.style.position = original.position;
    menu.style.top = original.top;
    menu.style.left = original.left;
    menu.style.width = original.width;
    menu.style.display = original.display;
    menu.style.maxHeight = original.maxHeight;
    menu.style.overflowY = original.overflowY;
    menu.style.zIndex = original.zIndex;

    // restaurar scroll del body si lo bloqueaste
    // document.body.style.overflow = "";
  }

  function abrirMenu() {
    // quitar clase 'hidden' y aplicar estilos fijos
    menu.classList.remove("hidden");
    aplicarEstilosFijos();
  }

  function cerrarMenu() {
    // ocultamos y restauramos estilos
    menu.classList.add("hidden");
    restaurarEstilos();
  }

  // Botón hamburguesa: toggle con protección de propagation
  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const estaAbierto = !menu.classList.contains("hidden");
    if (estaAbierto) cerrarMenu();
    else abrirMenu();
  });

  // Cerrar al hacer click en un enlace del menú
  menu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      // permite tiempo a que el navegador haga la navegación por ancla
      // y luego cerrar el menú
      setTimeout(() => cerrarMenu(), 60);
    });
  });

  // Cerrar si se hace click fuera del menú o del toggle
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) {
      if (!menu.classList.contains("hidden")) cerrarMenu();
    }
  });

  // Al cambiar el hash (ancla) cerramos también
  window.addEventListener("hashchange", () => {
    if (!menu.classList.contains("hidden")) cerrarMenu();
  });

  // Si se redimensiona la ventana (rotate mobile), forzamos reflow y reajuste
  window.addEventListener("resize", () => {
    if (!menu.classList.contains("hidden")) {
      aplicarEstilosFijos();
    } else {
      restaurarEstilos();
    }
  });
}


// ===============================
// === FADE IN OBSERVER
// ===============================
const fadeEls = document.querySelectorAll(".fade-in");
if (fadeEls.length) {
  const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    },
    { threshold: 0.1 }
  );
  fadeEls.forEach(el => observer.observe(el));
}


// ===============================
// === HEADER SCROLL EFFECT
// ===============================
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
