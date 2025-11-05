document.getElementById("year").textContent = new Date().getFullYear();

const dayButtons = document.querySelectorAll(".day-btn");
const menusContainer = document.getElementById("menusContainer");
const resumen = document.getElementById("resumen");
const enviarBtn = document.getElementById("enviarPedido");
let selectedDays = new Set();

function createMenuForDay(day) {
  return `
  <div id="menu-${day}" class="bg-white rounded-lg shadow p-6 border border-gray-100">
    <h3 class="text-lg font-semibold mb-4 text-green-700">${day}</h3>
    <div class="grid sm:grid-cols-3 gap-6">
      <div>
        <label class="block text-sm font-medium mb-1">Entrada</label>
        <select class="entrada w-full border rounded-lg p-2 text-sm">
          <option>Sopa</option>
          <option>Consomé</option>
          <option>Crema</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Guarnición</label>
        <select class="guarnicion w-full border rounded-lg p-2 text-sm">
          <option>Arroz</option>
          <option>Pasta</option>
          <option>Ensalada</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Plato fuerte</label>
        <select class="fuerte w-full border rounded-lg p-2 text-sm">
          <option>Pollo a la plancha</option>
          <option>Carne guisada</option>
          <option>Filete de pescado</option>
          <option>Chiles rellenos</option>
        </select>
      </div>
    </div>
  </div>`;
}

dayButtons.forEach(btn => {
  btn.addEventListener("click", () => {
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

function calcularPrecio(cantidad) {
  switch (true) {
    case (cantidad >= 5):
      return 65;
    case (cantidad === 4):
      return 70;
    case (cantidad === 3):
      return 75;
    default:
      return 80; // Para 1 o 2 comidas
  }
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
  const nombreInput = document.getElementById("nombre");
  const empresaInput = document.getElementById("empresa");

  const nombre = nombreInput.value.trim();
  const empresa = empresaInput.value.trim();

  // Validar nombre
  if (!nombre) {
    alert("Por favor ingresa tu nombre completo antes de enviar el pedido.");
    nombreInput.focus();
    nombreInput.classList.add("border-red-500");
    setTimeout(() => nombreInput.classList.remove("border-red-500"), 2000);
    return;
  }

  // Validar empresa
  if (!empresa) {
    alert("Por favor ingresa el nombre de tu empresa.");
    empresaInput.focus();
    empresaInput.classList.add("border-red-500");
    setTimeout(() => empresaInput.classList.remove("border-red-500"), 2000);
    return;
  }

  // Validar días seleccionados
  if (dias.length === 0) {
    alert("Selecciona al menos un día para continuar con tu pedido.");
    return;
  }

  // Calcular precios
  const precio = calcularPrecio(dias.length);
  const total = dias.length * precio;

  // Construir detalle del pedido
  let detalle = dias.map(day => {
    const contenedor = document.getElementById(`menu-${day}`);
    if (!contenedor) return `*${day}*\n(No se encontró menú para este día)`;

    const entrada = contenedor.querySelector(".entrada")?.value || "—";
    const guarnicion = contenedor.querySelector(".guarnicion")?.value || "—";
    const fuerte = contenedor.querySelector(".fuerte")?.value || "—";

    return `*${day}*\n${entrada} | ${guarnicion} | ${fuerte}`;
  }).join("\n\n");

  // Construir encabezado
  const encabezado = `*Nombre:* ${nombre}\n*Empresa:* ${empresa}\n\n`;

  // Mensaje final
  const mensaje = encodeURIComponent(
    `${encabezado}*Nuevo pedido semanal:*\n\n${detalle}\n\n*Total:* $${total} MXN\n\n¡Gracias por tu pedido!`
  );

  // Enviar por WhatsApp
  const telefono = "5537017294"; // <-- tu número
  const url = `https://wa.me/${telefono}?text=${mensaje}`;
  window.open(url, "_blank");
});



