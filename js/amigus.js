const PRECIO = 85;
let menu = {};
const container = document.getElementById("personasContainer");
const totalEl = document.getElementById("total");
const diaGeneral = document.getElementById("diaGeneral");

// CARGA JSON
fetch("menu.json")
    .then(r => r.json())
    .then(data => {
        menu = data.menu;
        cargarDias();
        inicializarPersonas();
    })
    .catch(err => console.error("Error cargando menú:", err));


// CARGAR DÍAS EN SELECT GENERAL
function cargarDias() {
    Object.keys(menu).forEach(dia => {
        const opt = document.createElement("option");
        opt.value = dia;
        opt.textContent = dia;
        diaGeneral.appendChild(opt);
    });
}


// PERSONAS BASE
function inicializarPersonas() {
    for (let i = 0; i < 3; i++) agregarPersona();
    actualizarTotal();
}


// AGREGAR PERSONA
function agregarPersona() {
    const total = document.querySelectorAll("#personasContainer > div").length;
    const numero = total + 1;

    const div = document.createElement("div");
    div.className = "bg-white p-4 rounded-xl shadow relative";

    div.innerHTML = `
    <button class="eliminar absolute top-2 right-2 text-red-500 text-sm font-bold">✖</button>

    <h3 class="font-semibold mb-2">Persona ${numero}</h3>

    <input 
      type="text" 
      placeholder="Nombre de la persona"
      class="nombre w-full border p-2 rounded mb-3"
    />

    <select class="entrada w-full border p-2 rounded mb-2" disabled>
      <option>Entrada</option>
    </select>

    <select class="guarnicion w-full border p-2 rounded mb-2" disabled>
      <option>Guarnición</option>
    </select>

    <select class="fuerte w-full border p-2 rounded mb-2" disabled>
      <option>Plato fuerte</option>
    </select>
  `;

    div.querySelector(".eliminar").addEventListener("click", () => {
        eliminarPersona(div);
    });

    container.appendChild(div);
    actualizarTotal();
}



// CUANDO CAMBIA EL DÍA GENERAL
diaGeneral.addEventListener("change", () => {

    const dia = diaGeneral.value;
    if (!menu[dia]) return;

    const cards = document.querySelectorAll("#personasContainer > div");

    cards.forEach(card => {
        cargarOpciones(card.querySelector(".entrada"), menu[dia].entrada);
        cargarOpciones(card.querySelector(".guarnicion"), menu[dia].guarnicion);
        cargarOpciones(card.querySelector(".fuerte"), menu[dia].fuerte);

        card.querySelector(".entrada").disabled = false;
        card.querySelector(".guarnicion").disabled = false;
        card.querySelector(".fuerte").disabled = false;
    });
});


// CARGAR OPCIONES
function cargarOpciones(select, opciones) {
    select.innerHTML = `<option value="">Selecciona</option>` +
        opciones.map(op => `<option>${op}</option>`).join("");
}


// TOTAL DINÁMICO
function actualizarTotal() {
    const personas = document.querySelectorAll("#personasContainer > div").length;
    totalEl.textContent = `$${personas * PRECIO} MXN`;
}


// BOTÓN AGREGAR
document.getElementById("agregarPersona").addEventListener("click", () => {
    agregarPersona();
    if (diaGeneral.value) diaGeneral.dispatchEvent(new Event("change"));
});


// WHATSAPP
document.getElementById("confirmar").addEventListener("click", () => {

    if (!validarNombres()) return;

    const dia = diaGeneral.value;
    if (!dia) return alert("Elige el día de entrega");

    const cards = document.querySelectorAll("#personasContainer > div");
    let valido = true;

    let mensaje = `*PLAN AMIGUS*\n\nDía de entrega: ${dia}\n\n`;

    cards.forEach((card, i) => {

        const nombre = card.querySelector(".nombre").value || `Persona ${i + 1}`;
        const entrada = card.querySelector(".entrada").value;
        const guarnicion = card.querySelector(".guarnicion").value;
        const fuerte = card.querySelector(".fuerte").value;

        if (!entrada || !guarnicion || !fuerte) valido = false;
        mensaje += `\n👤 ${nombre}\n- Entrada: ${entrada}\n- Guarnición: ${guarnicion}\n- Fuerte: ${fuerte}\n`;
    });

    if (!valido) return alert("Todos deben elegir su comida.");

    mensaje += `TOTAL: $${cards.length * PRECIO} MXN`;

    window.open(
        `https://wa.me/5537017294?text=${encodeURIComponent(mensaje)}`,
        "_blank"
    );
});

function eliminarPersona(card) {
    const personas = document.querySelectorAll("#personasContainer > div");

    if (personas.length <= 3) {
        alert("Debes mantener mínimo 3 personas");
        return;
    }

    card.remove();
    renumerarPersonas();
    actualizarTotal();
}


function renumerarPersonas() {
    const cards = document.querySelectorAll("#personasContainer > div");
    cards.forEach((card, i) => {
        card.querySelector("h3").textContent = `Persona ${i + 1}`;
    });
}


function actualizarTotal() {
    const personas = document.querySelectorAll("#personasContainer > div").length;
    totalEl.textContent = `$${personas * PRECIO} MXN`;
}

function validarNombres() {
    const nombres = document.querySelectorAll(".nombre");
    for (let input of nombres) {
        if (input.value.trim() === "") {
            alert("Por favor escribe el nombre de todas las personas");
            input.focus();
            return false;
        }
    }
    return true;
}

