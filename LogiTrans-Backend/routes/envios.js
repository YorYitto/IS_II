const express = require("express");
const router = express.Router();
const db = require("../db");
const { v4: uuidv4 } = require("uuid");

// 🚚 Listar camiones
router.get("/camiones", async (req, res) => {
  const result = await db.query("SELECT * FROM camiones ORDER BY creado_en DESC");
  res.json(result.rows);
});

// 📦 Listar pedidos pendientes
router.get("/pendientes", async (req, res) => {
  const result = await db.query(
    "SELECT id, origen, destino, estado FROM envios WHERE estado='Pendiente' ORDER BY fecha_creacion DESC"
  );
  res.json(result.rows);
});

// 🧭 Asignar recorrido
router.post("/asignar", async (req, res) => {
  const { camionId, pedidoId } = req.body;
  if (!camionId || !pedidoId)
    return res.status(400).json({ error: "Datos incompletos" });

  await db.query("UPDATE envios SET camion_id=$1, estado='En ruta' WHERE id=$2", [
    camionId,
    pedidoId,
  ]);
  res.json({ ok: true, message: "Recorrido asignado correctamente" });
});

// ✉️ Crear solicitud desde el mapa
router.post("/", async (req, res) => {
  const { origen, destino } = req.body;
  if (!origen || !destino)
    return res.status(400).json({ error: "Datos incompletos" });

  await db.query(
    "INSERT INTO envios (id, origen, destino, estado, fecha_creacion) VALUES ($1,$2,$3,'Pendiente',NOW())",
    [uuidv4(), origen, destino]
  );
  res.json({ ok: true });
});

module.exports = router;
