// js/mapa.js
// Mantiene tus funciones de cálculo de ruta (Leaflet + Nominatim) 
// y añade la llamada para registrar el pedido en el backend.

let map;
let controlRouting;

document.addEventListener("DOMContentLoaded", () => {
  // mostrar nombre de usuario si existe
  const user = getUser();
  if (user && user.nombre) document.getElementById("username").textContent = user.nombre;

  initMap();

  document.getElementById("calcular").addEventListener("click", async () => {
    const origen = document.getElementById("origen").value.trim();
    const destino = document.getElementById("destino").value.trim();

    if (!origen || !destino) {
      alert("Por favor ingresa origen y destino.");
      return;
    }

    try {
      await calcularYMostrarRuta(origen, destino);
    } catch (err) {
      console.error(err);
      alert("Error calculando la ruta.");
    }
  });

  document.getElementById("sendRequest").addEventListener("click", async () => {
    const origen = document.getElementById("origen").value.trim();
    const destino = document.getElementById("destino").value.trim();

    if (!origen || !destino) {
      alert("Por favor ingresa origen y destino antes de enviar.");
      return;
    }

    try {
      const user = getUser();
      const body = {
        remitente_id: user?.id || null,
        direccion_origen: origen,
        direccion_destino: destino
      };

      const resp = await fetch(`${API_BASE_URL}/envios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(body)
      });

      if (!resp.ok) {
        const err = await resp.json().catch(()=>null);
        alert(err?.error || "Error al crear el envío");
        return;
      }

      alert("✅ Solicitud enviada correctamente");
    } catch (err) {
      console.error(err);
      alert("⚠️ Error de conexión con el servidor");
    }
  });
});

function initMap() {
  map = L.map('map').setView([4.7110, -74.0721], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
}

async function calcularYMostrarRuta(origen, destino) {
  // geocoding con Nominatim (OpenStreetMap)
  const [origenData, destinoData] = await Promise.all([
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(origen)}`).then(r => r.json()),
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destino)}`).then(r => r.json())
  ]);

  if (!origenData.length || !destinoData.length) {
    throw new Error("No se pudo encontrar origen o destino.");
  }

  const origenCoords = [parseFloat(origenData[0].lat), parseFloat(origenData[0].lon)];
  const destinoCoords = [parseFloat(destinoData[0].lat), parseFloat(destinoData[0].lon)];

  if (controlRouting) map.removeControl(controlRouting);

  controlRouting = L.Routing.control({
    waypoints: [
      L.latLng(...origenCoords),
      L.latLng(...destinoCoords)
    ],
    routeWhileDragging: false,
    show: true
  }).addTo(map);

  map.fitBounds([origenCoords, destinoCoords]);
}
