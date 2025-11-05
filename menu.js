// === AÑO EN FOOTER ===
document.getElementById("year").textContent = new Date().getFullYear();

// === VARIABLES GLOBALES ===
const dayButtons = document.querySelectorAll(".day-btn");
const menusContainer = document.getElementById("menusContainer");
const resumen = document.getElementById("resumen");
const enviarBtn = document.getElementById("enviarPedido");
let selectedDays = new Set();
let menuData = {}; // Contenido del JSON

// =====================================================
// === CARGAR MENU DESDE JSON ===
// =====================================================
async function cargarMenu() {
  try {
    const response = await fetch("menu.json");
    if (!response.ok) throw new Error("No se pudo cargar el menú");
    menuData = await response.json();
    console.log("Menú cargado correctamente");

    // 🔹 Configurar días según el JSON
    dayButtons.forEach((btn, index) => {
      const day = btn.dataset.day;
      const config = menuData[day];
      const tooltip = btn.querySelector("span");

      // Calcular fecha real del día
      const fecha = obtenerFechaPorIndice(index);
      const fechaTexto = formatearFechaCompleta(fecha);

      if (!config || config.activo === false) {
        // Día inactivo
        btn.disabled = true;
        btn.classList.add("opacity-50", "cursor-not-allowed", "bg-gray-200");
        tooltip.textContent = "Este día no brindaremos servicio";
      } else {
        // Día activo
        btn.disabled = false;
        btn.classList.remove("opacity-50", "cursor-not-allowed", "bg-gray-200");
        tooltip.textContent = fechaTexto;
      }
    });
  } catch (error) {
    console.error("Error al cargar el menú:", error);
    alert("Hubo un problema al cargar el menú semanal.");
  }
}

// =====================================================
// === CREAR MENÚ DE UN DÍA ===
// =====================================================
function createMenuForDay(day) {
  const opciones = menuData[day];
  if (!opciones || opciones.activo === false) {
    return `<div class="bg-red-50 border border-red-200 p-4 rounded-lg">
      <p class="text-red-700">No hay servicio disponible para ${day}.</p>
    </div>`;
  }

  return `
  <div id="menu-${day}" class="bg-white rounded-lg shadow p-6 border border-gray-100">
    <h3 class="text-lg font-semibold mb-4 text-green-700">${day}</h3>
    <div class="grid sm:grid-cols-3 gap-6">
      <div>
        <label class="block text-sm font-medium mb-1">Entrada</label>
        <select class="entrada w-full border rounded-lg p-2 text-sm">
          ${opciones.entrada.map(item => `<option>${item}</option>`).join("")}
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Guarnición</label>
        <select class="guarnicion w-full border rounded-lg p-2 text-sm">
          ${opciones.guarnicion.map(item => `<option>${item}</option>`).join("")}
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Plato fuerte</label>
        <select class="fuerte w-full border rounded-lg p-2 text-sm">
          ${opciones.fuerte.map(item => `<option>${item}</option>`).join("")}
        </select>
      </div>
    </div>
  </div>`;
}

// =====================================================
// === EVENTOS PARA LOS BOTONES DE DÍAS ===
// =====================================================
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

// =====================================================
// === FUNCIÓN DE PRECIOS Y DESCUENTOS ===
// =====================================================
function calcularPrecio(cantidad) {
  switch (true) {
    case cantidad >= 5:
      return 65;
    case cantidad === 4:
      return 70;
    case cantidad === 3:
      return 75;
    default:
      return 80;
  }
}

// =====================================================
// === ACTUALIZAR RESUMEN EN PANTALLA ===
// =====================================================
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
  const porcentajeDescuento = Math.round((ahorro / sinDescuento) * 100);

  resumen.innerHTML = `
    <strong>Días seleccionados:</strong> ${dias.join(", ")} <br>
    <strong>Precio unitario:</strong> $${precioUnitario} MXN <br>
    <strong>Total:</strong> $${total} MXN <br>
    ${ahorro > 0
      ? `<span class="text-green-700 font-semibold">¡Ahorras $${ahorro} MXN (${porcentajeDescuento}%)!</span>`
      : ""
    }
  `;
}

// =====================================================
// === EVENTO DE ENVÍO Y GENERACIÓN DE WHATSAPP ===
// =====================================================
enviarBtn.addEventListener("click", async () => {
  const dias = Array.from(selectedDays);
  const nombre = document.getElementById("nombre").value.trim();
  const empresa = document.getElementById("empresa").value.trim();

  if (!nombre) {
    alert("Por favor ingresa tu nombre completo antes de enviar el pedido.");
    return;
  }
  if (!empresa) {
    alert("Por favor ingresa el nombre de tu empresa antes de continuar.");
    return;
  }
  if (dias.length === 0) {
    alert("Selecciona al menos un día para continuar con tu pedido.");
    return;
  }

  const precio = calcularPrecio(dias.length);
  const total = dias.length * precio;
  const sinDescuento = dias.length * 80;
  const ahorro = sinDescuento - total;
  const porcentajeDescuento = Math.round((ahorro / sinDescuento) * 100);

  const ahora = new Date();
  const fechaGeneracion = formatearFechaCompleta(ahora, true);

  // === GENERAR IMAGEN DEL RESUMEN ===
  const resumenDiv = document.createElement("div");
  resumenDiv.style.padding = "20px";
  resumenDiv.style.fontFamily = "Arial, sans-serif";
  resumenDiv.style.background = "#f0fdf4";
  resumenDiv.style.border = "1px solid #bbf7d0";
  resumenDiv.style.borderRadius = "12px";
  resumenDiv.style.width = "400px";
  resumenDiv.style.color = "#166534";

  resumenDiv.innerHTML = `
    <h2 style="color:#166534; margin-bottom:8px;">Pedido semanal</h2>
    <p><strong>Nombre:</strong> ${nombre}</p>
    <p><strong>Empresa:</strong> ${empresa}</p>
    <p style="font-size: 12px; color:#065f46;"><em>Generado el ${fechaGeneracion}</em></p>
    <hr style="margin:12px 0; border-color:#bbf7d0;">
    ${dias
      .map((day, index) => {
        const fecha = formatearFechaCompleta(obtenerFechaPorIndice(index));
        const contenedor = document.getElementById(`menu-${day}`);
        const entrada = contenedor?.querySelector(".entrada")?.value || "—";
        const guarnicion = contenedor?.querySelector(".guarnicion")?.value || "—";
        const fuerte = contenedor?.querySelector(".fuerte")?.value || "—";
        return `
        <div style="margin-bottom:10px;">
          <strong>${day} (${fecha})</strong><br>
          ${entrada} | ${guarnicion} | ${fuerte}
        </div>`;
      })
      .join("")}
    <hr style="margin:12px 0; border-color:#bbf7d0;">
    <p><strong>Total sin descuento:</strong> $${sinDescuento} MXN</p>
    <p><strong>Total con descuento:</strong> $${total} MXN</p>
    ${ahorro > 0
      ? `<p style="color:#15803d; font-weight:bold;">Ahorraste $${ahorro} MXN (${porcentajeDescuento}%)</p>`
      : ""
    }
  `;

  document.body.appendChild(resumenDiv);
  resumenDiv.style.position = "absolute";
  resumenDiv.style.left = "-9999px";

  const canvas = await html2canvas(resumenDiv);
  const dataUrl = canvas.toDataURL("image/png");
  const enlace = document.createElement("a");
  enlace.href = dataUrl;
  enlace.download = `pedido_${nombre.replace(/\s+/g, "_")}.png`;
  enlace.click();
  resumenDiv.remove();

  // === MENSAJE DE WHATSAPP ===
  let detalle = dias
    .map((day, index) => {
      const fecha = formatearFechaCompleta(obtenerFechaPorIndice(index));
      const contenedor = document.getElementById(`menu-${day}`);
      const entrada = contenedor.querySelector(".entrada").value;
      const guarnicion = contenedor.querySelector(".guarnicion").value;
      const fuerte = contenedor.querySelector(".fuerte").value;
      return `*${day}* (${fecha})\n${entrada} | ${guarnicion} | ${fuerte}`;
    })
    .join("\n\n");

  const encabezado = empresa
    ? `*Nombre:* ${nombre}\n*Empresa:* ${empresa}\n\n`
    : `*Nombre:* ${nombre}\n\n`;

  let mensaje = `${encabezado}*Nuevo pedido semanal:*\n\n${detalle}\n\n *Total sin descuento:* $${sinDescuento} MXN\n *Total con descuento:* $${total} MXN`;

  if (ahorro > 0) {
    mensaje += `\n *Ahorro:* $${ahorro} MXN (${porcentajeDescuento}%)`;
  }

  mensaje += `\n\n *Generado el:* ${fechaGeneracion}`;

  const telefono = "5537017294";
  const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
});

// =====================================================
// === FUNCIONES DE FECHA Y SEMANA ===
// =====================================================
function obtenerRangoSemana() {
  const hoy = new Date();
  const diaSemana = hoy.getDay();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((diaSemana + 6) % 7));
  const viernes = new Date(lunes);
  viernes.setDate(lunes.getDate() + 4);

  const formato = new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  const diaInicio = lunes.getDate().toString().padStart(2, "0");
  const diaFin = viernes.getDate().toString().padStart(2, "0");
  const mes = formato.format(viernes).split(" ")[2];
  const anio = viernes.getFullYear();

  return `(${diaInicio} al ${diaFin} de ${mes} ${anio})`;
}

function obtenerFechaPorIndice(indice) {
  const hoy = new Date();
  const diaSemana = hoy.getDay();
  const diasRetroceder = (diaSemana + 6) % 7;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - diasRetroceder);
  const fecha = new Date(lunes);
  fecha.setDate(lunes.getDate() + indice);
  return fecha;
}

// 🟢 Nueva función para formato completo
function formatearFechaCompleta(fecha, incluirHora = false) {
  const opciones = { weekday: "long", day: "2-digit", month: "short", year: "numeric" };
  if (incluirHora) opciones.hour = "2-digit", opciones.minute = "2-digit";
  return fecha.toLocaleDateString("es-MX", opciones)
    .replace(".", "")
    .replace(/\b\w/g, c => c.toLowerCase());
}

// =====================================================
// === INICIALIZAR TODO ===
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
  cargarMenu();
  document.getElementById("rangoSemana").textContent = obtenerRangoSemana();
});
