// =====================================
// === AÑO EN FOOTER ===
// =====================================
document.getElementById("year").textContent = new Date().getFullYear();

// =====================================
// === VARIABLES GLOBALES ===
// =====================================
const dayButtons = document.querySelectorAll(".day-btn");
const menusContainer = document.getElementById("menusContainer");
const resumen = document.getElementById("resumen");
const enviarBtn = document.getElementById("enviarPedido");

let selectedDays = new Set();
let menuData = {}; // JSON completo
let empresaActual = null;

// =====================================
// === VALIDAR SESIÓN DE EMPRESA ===
// =====================================
function validarEmpresa() {
  empresaActual = localStorage.getItem("empresa");
  if (!empresaActual) {
    alert("No se detectó empresa, regresando al inicio.");
    window.location.href = "index.html";
    return;
  }
  const inputEmpresa = document.getElementById("empresa");
  if (inputEmpresa) {
    inputEmpresa.value = empresaActual;
    inputEmpresa.setAttribute("readonly", true);
  }
}

// =====================================
// === CARGAR MENU DESDE JSON ===
// =====================================
async function cargarMenu() {
  try {
    const response = await fetch("../resources/menu.json");
    if (!response.ok) throw new Error("No se pudo cargar JSON");
    menuData = await response.json();

    console.log("JSON cargado", menuData);
    configurarDias();
  } catch (e) {
    console.error("Error:", e);
    alert("Error cargando archivo menu.json");
  }
}

// =====================================
// === CONFIGURAR BOTONES DE DÍAS ===
// =====================================
function configurarDias() {
  dayButtons.forEach((btn, index) => {
    const day = btn.dataset.day;

    // ✅ AQUÍ ESTÁ LA CORRECCIÓN CLAVE
    const config = menuData.menu[day];

    const tooltip = btn.querySelector("span");
    const fecha = obtenerFechaPorIndice(index);
    const fechaTexto = formatearFechaCompleta(fecha);

    if (!config || config.activo === false) {
      btn.disabled = true;
      btn.classList.add("opacity-50", "cursor-not-allowed", "bg-gray-200");
      tooltip.textContent = "Sin servicio";
    } else {
      btn.disabled = false;
      btn.classList.remove("opacity-50", "cursor-not-allowed", "bg-gray-200");
      tooltip.textContent = fechaTexto;
    }
  });
}

// =====================================
// === CREAR MENÚ DEL DÍA ===
// =====================================
function createMenuForDay(day) {
  const opciones = menuData.menu[day]; // ✅ CAMBIO

  if (!opciones || opciones.activo === false) {
    return `<div class="bg-red-50 p-3">No hay servicio para ${day}</div>`;
  }

  return `
  <div id="menu-${day}" class="bg-white p-4 rounded shadow border mb-3">
    <h3 class="font-semibold text-green-700">${day}</h3>
    <div class="grid sm:grid-cols-3 gap-3">
      <select class="entrada">${opciones.entrada.map(x => `<option>${x}</option>`).join("")}</select>
      <select class="guarnicion">${opciones.guarnicion.map(x => `<option>${x}</option>`).join("")}</select>
      <select class="fuerte">${opciones.fuerte.map(x => `<option>${x}</option>`).join("")}</select>
    </div>
  </div>`;
}

// =====================================
// === EVENTOS DE DÍAS ===
// =====================================
dayButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.disabled) return;
    const day = btn.dataset.day;

    if (selectedDays.has(day)) {
      selectedDays.delete(day);
      btn.classList.remove("bg-green-600", "text-white");
      document.getElementById(`menu-${day}`)?.remove();
    } else {
      selectedDays.add(day);
      btn.classList.add("bg-green-600", "text-white");
      menusContainer.insertAdjacentHTML("afterbegin", createMenuForDay(day));
    }
    actualizarResumen();
  });
});

// =====================================
// === PRECIOS ===
// =====================================
function calcularPrecio(cantidad) {
  return cantidad >= 4 ? 80 : cantidad === 3 ? 85 : 90;
}


// =====================================
// === RESUMEN ===
// =====================================
function actualizarResumen() {
  const dias = [...selectedDays];
  if (!dias.length) {
    resumen.textContent = "Selecciona días.";
    return;
  }

  const unit = calcularPrecio(dias.length);
  const total = unit * dias.length;
  const sin = dias.length * 80;
  const ahorro = sin - total;
  const pct = Math.round((ahorro / sin) * 100);

  resumen.innerHTML = `
  <b>Días:</b> ${dias.join(", ")}<br>
  <b>Unitario:</b> $${unit}<br>
  <b>Total:</b> $${total}<br>
  ${ahorro > 0 ? `Ahorras $${ahorro} (${pct}%)` : ""}
  `;
}

// =====================================
// === ENVÍO ===
// =====================================
enviarBtn.addEventListener("click", async () => {
  const dias = [...selectedDays];
  const nombre = document.getElementById("nombre").value.trim();
  const empresa = empresaActual;

  if (!nombre) return alert("Ingresa tu nombre");
  if (!dias.length) return alert("Selecciona al menos un día");

  const precio = calcularPrecio(dias.length);
  const total = precio * dias.length;
  const sin = dias.length * 80;
  const ahorro = sin - total;
  const pct = Math.round((ahorro / sin) * 100);
  const fechaGen = formatearFechaCompleta(new Date(), true);

  const detalle = dias.map((day, i) => {
    const fecha = formatearFechaCompleta(obtenerFechaPorIndice(i));
    const box = document.getElementById(`menu-${day}`);
    return `*${day}* (${fecha})\n${box.querySelector(".entrada").value} | ${box.querySelector(".guarnicion").value} | ${box.querySelector(".fuerte").value}`;
  }).join("\n\n");

  let msg = `*${nombre}*\nEmpresa: ${empresa}\n\n${detalle}\n\nTotal: $${total}`;
  if (ahorro > 0) msg += `\nAhorras: $${ahorro} (${pct}%)`;
  msg += `\nGenerado: ${fechaGen}`;

  window.open(`https://wa.me/5537017294?text=${encodeURIComponent(msg)}`, "_blank");
});

// =====================================
// === FECHAS ===
// =====================================
function obtenerFechaPorIndice(i) {
  const hoy = new Date();
  const diaSemana = (hoy.getDay() + 6) % 7;

  // Lunes de la semana actual
  const lunesActual = new Date(hoy);
  lunesActual.setDate(hoy.getDate() - diaSemana);

  // Lunes de la semana siguiente
  const lunesSiguiente = new Date(lunesActual);
  lunesSiguiente.setDate(lunesActual.getDate() + 7);

  // Día solicitado dentro de la semana siguiente
  const fecha = new Date(lunesSiguiente);
  fecha.setDate(lunesSiguiente.getDate() + i);

  return fecha;
}


function formatearFechaCompleta(f, hora = false) {
  const o = { weekday: "long", day: "2-digit", month: "short", year: "numeric" };
  if (hora) { o.hour = "2-digit"; o.minute = "2-digit"; }
  return f.toLocaleDateString("es-MX", o).replace(".", "").toLowerCase();
}

// =====================================
// === INICIO ===
// =====================================
document.addEventListener("DOMContentLoaded", () => {
  validarEmpresa();
  cargarMenu();
  document.getElementById("rangoSemana").textContent = obtenerRangoSemana();
});

function obtenerRangoSemana() {
  const hoy = new Date();

  // Convertimos domingo=6, lunes=0, martes=1...
  const diaSemana = (hoy.getDay() + 6) % 7;

  // Lunes de la semana actual
  const lunesActual = new Date(hoy);
  lunesActual.setDate(hoy.getDate() - diaSemana);

  // Lunes de la semana siguiente
  const lunesSiguiente = new Date(lunesActual);
  lunesSiguiente.setDate(lunesActual.getDate() + 7);

  // Viernes de la semana siguiente
  const viernesSiguiente = new Date(lunesSiguiente);
  viernesSiguiente.setDate(lunesSiguiente.getDate() + 4);

  const formatoMes = new Intl.DateTimeFormat("es-MX", { month: "long" });
  const mes = formatoMes.format(viernesSiguiente);
  const año = viernesSiguiente.getFullYear();

  return `${lunesSiguiente.getDate()} al ${viernesSiguiente.getDate()} de ${mes} ${año}`;
}

