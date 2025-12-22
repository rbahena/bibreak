// =====================================
// === AÑO EN FOOTER ===
// =====================================
try { document.getElementById("year").textContent = new Date().getFullYear(); } catch (e) {/* safe */ }

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
let menuData = {};
let tipoPlan = "dia";

// =====================================
// === UTIL: normalizar strings (quitar acentos, lower) ===
// =====================================
function normalizar(s = "") {
  return s
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .replace(/[^a-z0-9 ]/gi, "")      // quitar caracteres raros
    .trim()
    .toLowerCase();
}

// =====================================
// === INTENTA VARIAS RUTAS DE FETCH ===
// =====================================
async function fetchMenuWithFallback() {
  const paths = [
    "../resources/menu.json",
    "./resources/menu.json",
    "/resources/menu.json",
    "resources/menu.json"
  ];

  // Detect file:// (no server) y alerta
  if (location.protocol === "file:") {
    console.error("Estás abriendo el HTML con file:// — abre el proyecto con un servidor (Live Server, http://localhost)");
    mostrarAlertaVisible("El archivo debe servirse desde un servidor (Live Server / http). No uses file://");
    throw new Error("Protocolo file:// detectado");
  }

  for (const p of paths) {
    try {
      console.log(`Intentando cargar menu desde: ${p}`);
      const resp = await fetch(p, { cache: "no-store" });
      if (!resp.ok) {
        console.warn(`Ruta ${p} respondió ${resp.status}`);
        continue;
      }
      const j = await resp.json();
      console.log("menu.json cargado desde:", p, j);
      return j;
    } catch (err) {
      console.warn(`Error cargando ${p}:`, err);
      // seguir al siguiente path
    }
  }

  return null;
}

// =====================================
// === CARGAR MENU DESDE JSON (MAIN) ===
// =====================================
async function cargarMenu() {
  try {
    const data = await fetchMenuWithFallback();

    if (!data) {
      console.error("No se encontró menu.json en las rutas probadas.");
      mostrarAlertaVisible("No se encontró menu.json. Verifica la ruta del archivo.");
      return;
    }

    menuData = data;

    // 🧹 normalización de claves del menú
    if (menuData.menu) {
      const normalizedMenu = {};
      Object.keys(menuData.menu).forEach(k => {
        normalizedMenu[normalizar(k)] = menuData.menu[k];
      });
      menuData.menu = normalizedMenu;
    }

    // 🧹 limpiar semana_inicio
    if (menuData.config?.semana_inicio) {
      menuData.config.semana_inicio = menuData.config.semana_inicio.trim();
    }

    // ✅ validar semana
    if (!menuValidoParaSemana()) {
      mostrarAlertaMenu();
      return;
    }

    // ✅ habilita botones
    configurarDias();

    // ✅ plan semanal
    const params = new URLSearchParams(window.location.search);
    if (params.get("plan") === "semanal") {
      preseleccionarDias();
      ordenarCardsSemana(); // 🔥 asegura orden incluso si falla algún click
    }

  } catch (e) {
    console.error("Error en cargarMenu:", e);
    mostrarAlertaVisible("Error cargando el menú.");
  }
}



function preseleccionarDias() {
  dayButtons.forEach(btn => {
    if (btn.disabled) return;
    if (selectedDays.has(btn.dataset.day)) return;
    btn.click();
  });
}

// =====================================
// === MENSAJES VISIBLE SIMPLE ===
// =====================================
function mostrarAlertaVisible(text) {
  if (!document.getElementById("alertaMenuDebug")) {
    const a = document.createElement("div");
    a.id = "alertaMenuDebug";
    a.className = "bg-red-100 border border-red-500 text-red-800 p-3 rounded mb-4 text-center";
    a.innerText = text;
    document.querySelector("main")?.prepend(a);
  } else {
    document.getElementById("alertaMenuDebug").innerText = text;
  }
}

// =====================================
// === VALIDACIÓN: el menu corresponde a la semana visible ===
// =====================================
function menuValidoParaSemana() {
  if (!menuData.config || !menuData.config.semana_inicio) {
    console.log("No hay config.semana_inicio — asumo válido (devuelve true).");
    return true;
  }

  // parseo YYYY-MM-DD de forma LOCAL (evitar UTC shift)
  const parts = menuData.config.semana_inicio.split("-").map(Number);
  if (parts.length !== 3) {
    console.warn("config.semana_inicio no tiene formato YYYY-MM-DD:", menuData.config.semana_inicio);
    return false;
  }
  const [y, m, d] = parts;
  const fechaJSON = new Date(y, m - 1, d);
  fechaJSON.setHours(0, 0, 0, 0);

  const lunesSistema = obtenerLunesActivo();
  lunesSistema.setHours(0, 0, 0, 0);

  console.log("fechaJSON:", fechaJSON.toLocaleDateString(), "lunesSistema:", lunesSistema.toLocaleDateString());

  return fechaJSON.getTime() === lunesSistema.getTime();
}

// =====================================
// === CALCULO DEL LUNES ACTIVO SEGÚN REGLA ===
// =====================================
function obtenerLunesActivo() {
  const hoy = new Date();
  const dia = hoy.getDay(); // 0 dom ... 6 sab
  const hora = hoy.getHours();

  const diff = (hoy.getDay() + 6) % 7;
  const lunesActual = new Date(hoy);
  lunesActual.setDate(hoy.getDate() - diff);
  lunesActual.setHours(0, 0, 0, 0);

  // regla: viernes(5) después de 13 -> semana siguiente. Sábado/Domingo -> semana siguiente.
  if ((dia === 5 && hora >= 13) || dia === 6 || dia === 0) {
    const prox = new Date(lunesActual);
    prox.setDate(lunesActual.getDate() + 7);
    prox.setHours(0, 0, 0, 0);
    return prox;
  }
  return lunesActual;
}

// =====================================
// === mostrar alerta cuando JSON no coincide ===
// =====================================
function mostrarAlertaMenu() {

  const msg = menuData.config?.mensaje_fuera_de_rango || "Menú no disponible.";

  // si ya existe, no crear otra
  if (document.getElementById("modalMenu")) return;

  const modal = document.createElement("div");
  modal.id = "modalMenu";
  modal.style.position = "fixed";
  modal.style.inset = "0";
  modal.style.background = "rgba(0,0,0,0.45)";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.zIndex = "9999";

  modal.innerHTML = `
    <div style="
      background:white;
      padding:24px;
      max-width:380px;
      width:90%;
      border-radius:14px;
      box-shadow:0 10px 30px rgba(0,0,0,.3);
      text-align:center;
      animation: pop .2s ease-out;
    ">
      <h2 style="font-size:18px;font-weight:700;margin-bottom:10px">⚠️ Atención</h2>
      <p style="font-size:14px;color:#333;margin-bottom:14px">${msg}</p>
      <button id="cerrarModalMenu" style="
        background:#16a34a;
        color:white;
        padding:8px 16px;
        border-radius:8px;
        border:0;
        cursor:pointer;
        font-weight:600;
      ">Entendido</button>
    </div>
  `;

  modal.addEventListener("click", e => {
    if (e.target === modal) modal.remove();
  });

  document.body.appendChild(modal);

  document.getElementById("cerrarModalMenu").onclick = () => {
    window.location.href = "../index.html";
  };

  // Deshabilitar botones
  document.querySelectorAll(".day-btn").forEach(btn => {
    btn.disabled = true;
    btn.classList.add("opacity-50", "cursor-not-allowed", "bg-gray-200");
    const t = btn.querySelector("span");
    if (t) t.textContent = "Menú no disponible";
  });
}


// =====================================
// === CONFIGURAR BOTONES DE DÍAS ===
// =====================================
function configurarDias() {
  if (!menuData.menu) {
    console.error("menuData.menu vacío");
    mostrarAlertaVisible("menuData.menu vacío (revisa JSON).");
    return;
  }

  dayButtons.forEach(btn => {
    // normalizar dataset.day para buscar en menuData.menu
    const raw = (btn.dataset.day || "");
    const key = normalizar(raw); // por ejemplo "miercoles" sin acento

    const config = menuData.menu[key];
    const tooltip = btn.querySelector("span");
    const fecha = obtenerFechaPorNombre(key);
    const fechaTexto = formatearFechaCompleta(fecha);
    const cerrado = pedidosCerrados(key);

    if (!config || config.activo === false || cerrado) {
      btn.disabled = true;
      btn.classList.add("opacity-50", "cursor-not-allowed", "bg-gray-200");
      if (tooltip) tooltip.textContent = cerrado ? "Pedidos cerrados despues de las 11:30 AM" : "Sin servicio";
    } else {
      btn.disabled = false;
      btn.classList.remove("opacity-50", "cursor-not-allowed", "bg-gray-200");
      if (tooltip) tooltip.textContent = fechaTexto;
    }
  });
}

// =====================================
// === CREAR MENÚ DEL DÍA ===
// =====================================
function createMenuForDay(dayRaw) {
  const key = normalizar(dayRaw);
  const opciones = menuData.menu[key];

  if (!opciones || opciones.activo === false) {
    return `<div class="bg-red-50 p-3 rounded">No hay servicio para ${dayRaw}</div>`;
  }

  const fecha = obtenerFechaPorNombre(key);
  const fechaTexto = fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });

  const renderRadios = (lista, name) =>
    (lista || []).map((item, i) => `
      <label class="flex items-center gap-2 border rounded-lg p-2 cursor-pointer hover:bg-green-50">
        <input type="radio" name="${key}-${name}" value="${item}" class="accent-green-600" ${i === 0 ? "checked" : ""}>
        <span class="text-sm">${item}</span>
      </label>
    `).join("");

  return `
  <div id="menu-${key}" class="bg-white p-4 rounded-xl shadow border">
    <h3 class="font-semibold text-green-700 mb-3 flex items-center gap-2">
      ${dayRaw}
      <span class="text-gray-500 text-sm">${fechaTexto}</span>
    </h3>
    <div class="space-y-4">
      <div>
        <p class="text-sm font-medium mb-2">🥗 Entrada</p>
        <div class="grid sm:grid-cols-2 gap-2">${renderRadios(opciones.entrada, "entrada")}</div>
      </div>
      <div>
        <p class="text-sm font-medium mb-2">🍚 Guarnición</p>
        <div class="grid sm:grid-cols-2 gap-2">${renderRadios(opciones.guarnicion, "guarnicion")}</div>
      </div>
      <div>
        <p class="text-sm font-medium mb-2">🍗 Plato fuerte</p>
        <div class="grid sm:grid-cols-2 gap-2">${renderRadios(opciones.fuerte, "fuerte")}</div>
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
    const raw = btn.dataset.day || "";
    const key = normalizar(raw);

    if (selectedDays.has(key)) {
      selectedDays.delete(key);
      btn.classList.remove("bg-green-600", "text-white");
      document.getElementById(`menu-${key}`)?.remove();
    } else {
      selectedDays.add(key);
      btn.classList.add("bg-green-600", "text-white");
      const temp = document.createElement("div");
      temp.innerHTML = createMenuForDay(raw);
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

// =====================================
// === ORDENAR CARDS ===
// =====================================
function ordenarCardsSemana() {
  const orden = ["lunes", "martes", "miercoles", "jueves", "viernes"];
  const cards = [...menusContainer.children];
  cards.sort((a, b) => {
    const aDia = (a.id || "").replace("menu-", "");
    const bDia = (b.id || "").replace("menu-", "");
    return orden.indexOf(aDia) - orden.indexOf(bDia);
  });
  cards.forEach(c => menusContainer.appendChild(c));
}

// =====================================
// === RESUMEN/ENVÍO ===
// =====================================
function calcularPrecio(cantidad) {
  return 75;
}

function actualizarResumen() {
  const dias = [...selectedDays];
  if (!dias.length) { resumen.textContent = "Selecciona días."; return; }
  const unit = calcularPrecio(dias.length);
  const total = unit * dias.length;
  resumen.innerHTML = `<b>Días:</b> ${dias.join(", ")}<br><b>Total:</b> $${total}`;
}

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

  msg += `
*Pedido generado:* ${fechaGen}
`;

  window.open(`https://wa.me/5537017294?text=${encodeURIComponent(msg)}`, "_blank");
});

// =====================================
// === FECHAS & UTIL ===
// =====================================
function formatearFechaCompleta(f, hora = false) {
  const o = { weekday: "long", day: "2-digit", month: "short", year: "numeric" };
  if (hora) { o.hour = "2-digit"; o.minute = "2-digit"; }
  return f.toLocaleDateString("es-MX", o).replace(".", "").toLowerCase();
  }

function obtenerFechaPorNombre(dayNormalized) {
  const dias = ["lunes", "martes", "miercoles", "jueves", "viernes"];
  const idx = dias.indexOf(normalizar(dayNormalized));
  const lunes = obtenerLunesActivo();
  const f = new Date(lunes);
  f.setDate(lunes.getDate() + (idx >= 0 ? idx : 0));
  return f;
}

function pedidosCerrados(day) {
  const ahora = new Date();
  const fechaDia = obtenerFechaPorNombre(day);
  if (!fechaDia) return true;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const limiteHoy = new Date(hoy);
  limiteHoy.setHours(11, 30, 0, 0);

  // si es día anterior → cerrrado
  if (fechaDia < hoy) return true;

  // si es hoy y ya pasó las 9am → cerrado
  if (fechaDia.getTime() === hoy.getTime() && ahora >= limiteHoy) return true;

  return false; // único caso habilitado: futuro o hoy antes de las 9
}


function obtenerRangoSemana() {
  const lunes = obtenerLunesActivo();
  const viernes = new Date(lunes); viernes.setDate(lunes.getDate() + 4);
  return `${lunes.getDate()} al ${viernes.getDate()} de ${viernes.toLocaleDateString("es-MX", { month: "long" })} ${viernes.getFullYear()}`;
}

// =====================================
// === INICIO ===
// =====================================
document.addEventListener("DOMContentLoaded", () => {
  cargarMenu();
  //configurarPlanUI();
  try { document.getElementById("rangoSemana").textContent = obtenerRangoSemana(); } catch (e) { }
});
