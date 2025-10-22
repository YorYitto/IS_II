const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/dashboard", async (req, res) => {
  const [envios, camiones] = await Promise.all([
    db.query("SELECT * FROM envios ORDER BY fecha_creacion DESC"),
    db.query("SELECT * FROM camiones ORDER BY creado_en DESC"),
  ]);
  res.json({ envios: envios.rows, camiones: camiones.rows });
});

module.exports = router;
