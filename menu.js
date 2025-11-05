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
  const nombre = document.getElementById("nombre").value.trim();
  const empresa = document.getElementById("empresa").value.trim();

  if (!nombre) {
    alert("Por favor, ingresa tu nombre completo antes de enviar el pedido.");
    return;
  }
  if (dias.length === 0) {
    alert("Selecciona al menos un día para continuar.");
    return;
  }

  const precio = calcularPrecio(dias.length);
  const total = dias.length * precio;

  let detalle = dias.map(day => {
    const contenedor = document.getElementById(`menu-${day}`);
    const entrada = contenedor.querySelector(".entrada").value;
    const guarnicion = contenedor.querySelector(".guarnicion").value;
    const fuerte = contenedor.querySelector(".fuerte").value;
    return ` *${day}*\n ${entrada} |  ${guarnicion} |  ${fuerte}`;
  }).join("\n\n");

  const encabezado = empresa
    ? ` *Nombre:* ${nombre}\n *Empresa:* ${empresa}\n\n`
    : ` *Nombre:* ${nombre}\n\n`;

  const mensaje = encodeURIComponent(
    `${encabezado} *Nuevo pedido semanal:*\n\n${detalle}\n\n *Total:* $${total} MXN\n\n¡Gracias por tu pedido!`
  );

  const telefono = "5537017294"; // <-- cambia por tu número de WhatsApp
  const url = `https://wa.me/${telefono}?text=${mensaje}`;
  window.open(url, "_blank");
});


