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


const btnResumen = document.getElementById("btnResumen");
const resumenBox = document.getElementById("resumenBox");

let selectedDays = new Set();
let menuData = {}; // JSON completo

let tipoPlan = "dia";


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

    const params = new URLSearchParams(window.location.search);
    if (params.get("plan") === "semanal") {
      preseleccionarDias();
    }
  } catch (e) {
    console.error("Error:", e);
    alert("Error cargando archivo menu.json");
  }
}

function preseleccionarDias() {
  dayButtons.forEach(btn => {
    if (btn.disabled) return;

    const day = btn.dataset.day;

    if (!selectedDays.has(day)) {
      btn.click(); // 👈 Esto reutiliza tu lógica existente (no rompe nada)
    }
  });
}


function configurarPlanUI() {
  const params = new URLSearchParams(window.location.search);
  const plan = params.get("plan") || "dia";

  tipoPlan = plan;
  const badge = document.getElementById("badgePlan");
  const tooltip = document.getElementById("tooltipPlan");

  if (!badge || !tooltip) return;

  if (plan === "semanal") {
    badge.textContent = "Plan semanal";
    badge.classList.replace("bg-[#111827]", "bg-green-700");

    tooltip.textContent = "Recibe tu comida toda la semana con precio preferencial.";
  } else {
    badge.textContent = "Plan por día";
    badge.classList.replace("bg-green-700", "bg-[#111827]");

    tooltip.textContent = "Ordena solo cuando lo necesites.";
  }
}

document.addEventListener("DOMContentLoaded", configurarPlanUI);


// =====================================
// === CONFIGURAR BOTONES DE DÍAS ===
// =====================================
function configurarDias() {
  dayButtons.forEach((btn, index) => {
    const day = btn.dataset.day;

    // ✅ AQUÍ ESTÁ LA CORRECCIÓN CLAVE
    const config = menuData.menu[day];

    const tooltip = btn.querySelector("span");
    const fecha = obtenerFechaPorNombre(day);
    const fechaTexto = formatearFechaCompleta(fecha);

    // Regresa verdadero en caso de que ya sean las 9 am
    const cerrado = pedidosCerrados(day);

    if (!config || config.activo === false || cerrado) {
      btn.disabled = true;
      btn.classList.add("opacity-50", "cursor-not-allowed", "bg-gray-200");
      tooltip.textContent = cerrado ? "Pedidos cerrados hoy (9:00 AM)" : "Sin servicio";

    } else {
      btn.disabled = false;
      btn.classList.remove("opacity-50", "cursor-not-allowed", "bg-gray-200");
      tooltip.textContent = fechaTexto;
    }
  });
}


function usarSemanaSiguiente() {
  const ahora = new Date();
  const dia = ahora.getDay(); // 0=Dom, 5=Vie
  const hora = ahora.getHours();

  // viernes después de 13:00
  if (dia === 5 && hora >= 13) return true;

  // sábado o domingo
  if (dia === 6 || dia === 0) return true;

  return false;
}


// =====================================
// === CREAR MENÚ DEL DÍA ===
// =====================================
// =====================================
// === CREAR MENÚ CON RADIO BUTTONS ===
// =====================================
function createMenuForDay(day) {
  const opciones = menuData.menu[day];

  if (!opciones || opciones.activo === false) {
    return `<div class="bg-red-50 p-3 rounded">No hay servicio para ${day}</div>`;
  }

  const fecha = obtenerFechaPorNombre(day);
  const fechaTexto = fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short"
  });

  const renderRadios = (lista, name) =>
    lista.map((item, i) => `
      <label class="flex items-center gap-2 border rounded-lg p-2 cursor-pointer hover:bg-green-50">
        <input type="radio" name="${day}-${name}" value="${item}" class="accent-green-600" ${i === 0 ? "checked" : ""}>
        <span class="text-sm">${item}</span>
      </label>
    `).join("");

  return `
  <div id="menu-${day}" class="bg-white p-4 rounded-xl shadow border">

    <h3 class="font-semibold text-green-700 mb-3 flex items-center gap-2">
      ${day}
      <span class="text-gray-500 text-sm">${fechaTexto}</span>
    </h3>

    <div class="space-y-4">
      <div>
        <p class="text-sm font-medium mb-2">🥗 Entrada</p>
        <div class="grid sm:grid-cols-2 gap-2">
          ${renderRadios(opciones.entrada, "entrada")}
        </div>
      </div>

      <div>
        <p class="text-sm font-medium mb-2">🍚 Guarnición</p>
        <div class="grid sm:grid-cols-2 gap-2">
          ${renderRadios(opciones.guarnicion, "guarnicion")}
        </div>
      </div>

      <div>
        <p class="text-sm font-medium mb-2">🍗 Plato fuerte</p>
        <div class="grid sm:grid-cols-2 gap-2">
          ${renderRadios(opciones.fuerte, "fuerte")}
        </div>
      </div>
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
      const temp = document.createElement("div");

      temp.innerHTML = createMenuForDay(day);
      const card = temp.firstElementChild;

      if (tipoPlan === "semanal") {
        menusContainer.appendChild(card);
        ordenarCardsSemana();
      } else {
        menusContainer.prepend(card);
      }

    }
    actualizarResumen();
  });
});


function ordenarCardsSemana() {
  const orden = ["lunes", "martes", "miércoles", "jueves", "viernes"];

  const cards = [...menusContainer.children];

  cards.sort((a, b) => {
    const aDia = a.id.replace("menu-", "");
    const bDia = b.id.replace("menu-", "");
    return orden.indexOf(aDia) - orden.indexOf(bDia);
  });

  cards.forEach(card => menusContainer.appendChild(card));
}


// =====================================
// === PRECIOS ===
// =====================================
function calcularPrecio(cantidad) {
  return cantidad >= 5 ? 80 : cantidad >= 3 ? 85 : 90;
}


// =====================================
// === SCROLL AL RESUMEN (BOTÓN FLOTANTE)
// =====================================

// =====================================
// === SCROLL AL RESUMEN (BOTÓN FLOTANTE)
// =====================================
document.addEventListener("DOMContentLoaded", () => {
  const btnResumen = document.getElementById("btnResumen");
  const resumenBox = document.getElementById("resumenBox");

  if (!btnResumen) {
    console.warn("❌ No existe btnResumen");
    return;
  }

  if (!resumenBox) {
    console.warn("❌ No existe resumenBox");
    return;
  }

  btnResumen.addEventListener("click", () => {
    resumenBox.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
});


function actualizarBotonResumen() {
  const contador = document.getElementById("contadorResumen");
  if (!contador) return;

  const total = selectedDays.size;
  contador.textContent = total ? `🧾 Resumen (${total})` : "🧾 Resumen";
}

// Llama esto cada vez que cambias días:
const _actualizarResumenOriginal = actualizarResumen;
actualizarResumen = function () {
  _actualizarResumenOriginal();
  actualizarBotonResumen();
};




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
  const empresa = document.getElementById("empresa").value.trim();

  if (!nombre) return alert("Ingresa tu nombre");
  if (!dias.length) return alert("Selecciona al menos un día");

  const precio = calcularPrecio(dias.length);
  const total = precio * dias.length;
  const sin = dias.length * 80;
  const ahorro = sin - total;
  const pct = Math.round((ahorro / sin) * 100);
  const fechaGen = formatearFechaCompleta(new Date(), true);

  const detalle = dias.map(day => {
    const fecha = formatearFechaCompleta(obtenerFechaPorNombre(day));
    const box = document.getElementById(`menu-${day}`);
    if (!box) return `⚠️ Error cargando pedido de ${day}`;

    const entrada = box.querySelector(`input[name^="${day}-entrada"]:checked`)?.value || "";
    const guarnicion = box.querySelector(`input[name^="${day}-guarnicion"]:checked`)?.value || "";
    const fuerte = box.querySelector(`input[name^="${day}-fuerte"]:checked`)?.value || "";

    return `*Entrega:* ${fecha}
*Entrada:* ${entrada}
*Guarnición:* ${guarnicion}
*Plato fuerte:* ${fuerte}`;
  }).join("\n\n");

  let msg = `🍽️ *NUEVO PEDIDO | BIBREAK*

*Cliente:* ${nombre}
*Empresa:* ${empresa || "No especificada"}

*Detalle de mi pedido*

${detalle}

*TOTAL A PAGAR:* $${total}.00 MXN`;

  if (ahorro > 0) {
    msg += `*Ahorro aplicado:* $${ahorro} (${pct}%)\n`;
  }

  msg += `
*Pedido generado:* ${fechaGen}
`;

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
  cargarMenu();
  document.getElementById("rangoSemana").textContent = obtenerRangoSemana();
});

function obtenerRangoSemana() {
  const hoy = new Date();
  const diaSemana = (hoy.getDay() + 6) % 7;

  const lunesActual = new Date(hoy);
  lunesActual.setDate(hoy.getDate() - diaSemana);

  const lunes = usarSemanaSiguiente()
    ? new Date(lunesActual.getTime() + 7 * 86400000)
    : lunesActual;

  const viernes = new Date(lunes);
  viernes.setDate(lunes.getDate() + 4);

  const formatoMes = new Intl.DateTimeFormat("es-MX", { month: "long" });

  return `${lunes.getDate()} al ${viernes.getDate()} de ${formatoMes.format(viernes)} ${viernes.getFullYear()}`;
}



// Devuelve la fecha correspondiente al nombre del día (lunes, martes, ...)
function obtenerFechaPorNombre(dayName) {
  const dias = ["lunes", "martes", "miércoles", "jueves", "viernes"];
  const idx = dias.findIndex(d =>
    d.toLowerCase().startsWith(dayName.toLowerCase().slice(0, 3))
  );

  const hoy = new Date();
  const diaSemana = (hoy.getDay() + 6) % 7;

  // lunes semana actual
  const lunesActual = new Date(hoy);
  lunesActual.setDate(hoy.getDate() - diaSemana);

  const lunes = usarSemanaSiguiente()
    ? new Date(lunesActual.getTime() + 7 * 86400000)
    : lunesActual;

  if (idx < 0) return lunes;

  const fecha = new Date(lunes);
  fecha.setDate(lunes.getDate() + idx);
  return fecha;
}


function pedidosCerrados(day) {
  const hoy = new Date();
  const ahora = new Date();

  const fechaDia = obtenerFechaPorNombre(day);

  // Reset horas para comparar solo fechas
  hoy.setHours(0, 0, 0, 0);
  fechaDia.setHours(0, 0, 0, 0);

  // Hora límite
  const horaLimite = new Date();
  horaLimite.setHours(9, 0, 0, 0);

  // Si es HOY y ya pasó la hora límite
  const esHoy = hoy.getTime() === fechaDia.getTime();
  const fueraDeHora = ahora >= horaLimite;

  return esHoy && fueraDeHora;
}


