// js/admin.js
// Panel admin: cargar pedidos, camiones, asignar camiones y actualizar estados.

document.addEventListener("DOMContentLoaded", () => {
  // proteger la página (si no hay token, vuelve al login)
  if (!getToken()) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("logoutBtn").addEventListener("click", () => {
    removeToken();
    window.location.href = "index.html";
  });

  cargarDatosIniciales();

  // evento asignación manual desde form
  const formAsign = document.getElementById("form-asignar");
  if (formAsign) {
    formAsign.addEventListener("submit", async (e) => {
      e.preventDefault();
      const camionId = document.getElementById("camion-select").value;
      const origen = document.getElementById("origen-asign").value.trim();
      const destino = document.getElementById("destino-asign").value.trim();

      if (!camionId || !origen || !destino) {
        alert("Completa todos los campos para asignar.");
        return;
      }

      try {
        // crear un envío nuevo (administrador puede crear)
        const resCreate = await fetch(`${API_BASE_URL}/envios`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
          },
          body: JSON.stringify({ remitente_id: null, direccion_origen: origen, direccion_destino: destino })
        });

        if (!resCreate.ok) {
          alert("No se pudo crear el envío.");
          return;
        }

        const created = await resCreate.json();
        // Dependiendo del backend, created may include envio id; if not, we fetch list and pick last
        // We'll fetch admin envios and try to find the unassigned one
        await asignarCamionPorEnvioReciente(camionId);
      } catch (err) {
        console.error(err);
        alert("Error al asignar recorrido.");
      }
    });
  }

  // modal buttons
  const btnAssign = document.getElementById("btn-assign");
  const btnCancel = document.getElementById("btn-cancel");
  if (btnAssign) btnAssign.addEventListener("click", async () => {
    const select = document.getElementById("select-pedido");
    const pedidoId = select.value;
    const modal = document.getElementById("modal-asignacion");
    const camionId = modal.dataset.camionId;
    if (!pedidoId || !camionId) return alert("Selecciona pedido y camión.");
    await asignarRecorrido(pedidoId, camionId);
    modal.style.display = "none";
  });
  if (btnCancel) btnCancel.addEventListener("click", () => {
    document.getElementById("modal-asignacion").style.display = "none";
  });
});

// carga inicial
async function cargarDatosIniciales() {
  await cargarCamiones();
  await cargarPedidos();
  renderizarCamiones();
  renderizarPedidos();
}

let camiones = [];
let pedidos = [];

async function cargarCamiones() {
  try {
    const resp = await fetch(`${API_BASE_URL}/camiones`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!resp.ok) throw new Error("No autorizado");
    camiones = await resp.json();
    // llenar select de asignación manual
    const sel = document.getElementById("camion-select");
    if (sel) {
      sel.innerHTML = `<option value="">-- Seleccione camión --</option>` + camiones.map(c => `<option value="${c.id}">${c.placa || c.nombre || c.id} (${c.estado || c.estado})</option>`).join("");
    }
  } catch (err) {
    console.warn(err);
    camiones = [];
  }
}

async function cargarPedidos() {
  try {
    const resp = await fetch(`${API_BASE_URL}/admin/envios`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!resp.ok) throw new Error("No autorizado");
    pedidos = await resp.json();
  } catch (err) {
    console.warn(err);
    pedidos = [];
  }
}

function renderizarCamiones() {
  const cont = document.getElementById("camiones-body");
  if (!cont) return;
  if (!camiones.length) { cont.innerHTML = `<tr><td colspan="6">No hay camiones</td></tr>`; return; }
  cont.innerHTML = camiones.map(c => `
    <tr>
      <td>${c.id}</td>
      <td>${c.placa || c.nombre || "-"}</td>
      <td>${c.conductor || "-"}</td>
      <td>${c.estado || "-"}</td>
      <td>${c.recorrido || "-"}</td>
      <td>
        <button onclick="abrirAsignacionModal('${c.id}')">Asignar</button>
        <button onclick="actualizarEstadoCamion('${c.id}','disponible')">Marcar disponible</button>
      </td>
    </tr>
  `).join("");
}

function renderizarPedidos() {
  const cont = document.getElementById("solicitudes-body");
  if (!cont) return;
  if (!pedidos.length) { cont.innerHTML = `<tr><td colspan="6">No hay solicitudes</td></tr>`; return; }

  // pedidos puede venir como lista de objetos (si /admin/envios devuelve array directly)
  // adaptamos si admin endpoint devuelve { envios: [...], camiones: [...] } then use pedidos = data.envios
  const list = Array.isArray(pedidos) ? pedidos : (pedidos.envios || []);
  cont.innerHTML = list.map(p => `
    <tr>
      <td>${p.id}</td>
      <td>${p.remitente || p.remitente_nombre || "-"}</td>
      <td>${p.origen || p.direccion_origen || "-"}</td>
      <td>${p.destino || p.direccion_destino || "-"}</td>
      <td>${p.estado || "-"}</td>
      <td>
        <button onclick="abrirAsignacionModalForPedido('${p.id}')">Asignar</button>
      </td>
    </tr>
  `).join("");
}

// abrir modal de asignación a partir de camión
window.abrirAsignacionModal = function(camionId) {
  const modal = document.getElementById("modal-asignacion");
  const selectPedidos = document.getElementById("select-pedido");
  selectPedidos.innerHTML = pedidos.length ? (Array.isArray(pedidos) ? pedidos : (pedidos.envios || [])).map(p => `<option value="${p.id}">${p.id} — ${p.origen||p.direccion_origen} → ${p.destino||p.direccion_destino}</option>`).join('') : `<option value="">No hay pedidos</option>`;
  modal.dataset.camionId = camionId;
  modal.style.display = "flex";
};

// abrir modal desde pedido (seleccionar camión)
window.abrirAsignacionModalForPedido = function(pedidoId) {
  const modal = document.getElementById("modal-asignacion");
  const selectPedidos = document.getElementById("select-pedido");
  selectPedidos.innerHTML = `<option value="${pedidoId}">Pedido #${pedidoId}</option>`;
  modal.dataset.camionId = ""; // el usuario debe elegir camión después
  modal.style.display = "flex";
};

// asignar recorrido usando PUT /api/envios/:id/asignar
async function asignarRecorrido(pedidoId, camionId) {
  try {
    const resp = await fetch(`${API_BASE_URL}/envios/${pedidoId}/asignar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ camion_id: camionId })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(()=>null);
      alert(err?.error || "No se pudo asignar el camión");
      return;
    }
    alert("✅ Camión asignado correctamente");
    await cargarDatosIniciales();
  } catch (err) {
    console.error(err);
    alert("Error al asignar recorrido");
  }
}

// helper para buscar envío reciente y asignarle camion (usado por asignación manual)
async function asignarCamionPorEnvioReciente(camionId) {
  try {
    // recuperamos envíos
    const resp = await fetch(`${API_BASE_URL}/envios`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!resp.ok) throw new Error("No se pudo obtener envíos");
    const list = await resp.json();
    // asumimos que el último es el más reciente
    const newest = Array.isArray(list) && list.length ? list[0] : null;
    if (!newest) {
      alert("No encontramos el envío reciente para asignar.");
      return;
    }
    await asignarRecorrido(newest.id, camionId);
  } catch (err) {
    console.error(err);
    alert("Error al asignar camión al envío creado");
  }
}

// Exponer funciones globales para botones inline
window.asignarRecorrido = async function(pedidoId, camionId) {
  // usado por modal btn-assign: we will pick values
  const modal = document.getElementById("modal-asignacion");
  const sel = document.getElementById("select-pedido");
  const selectedPedido = sel.value;
  const camId = modal.dataset.camionId || camionId || document.getElementById("camion-select").value;
  if (!selectedPedido || !camId) return alert("Selecciona pedido y camión");
  await asignarRecorrido(selectedPedido, camId);
  modal.style.display = "none";
};

window.actualizarEstadoCamion = async function(camionId, nuevoEstado) {
  try {
    const resp = await fetch(`${API_BASE_URL}/camiones/${camionId}/estado`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(()=>null);
      alert(err?.error || "Error al actualizar estado");
      return;
    }
    alert("✅ Estado actualizado");
    await cargarCamiones();
    renderizarCamiones();
  } catch (err) {
    console.error(err);
    alert("Error actualizando estado del camión");
  }
};
