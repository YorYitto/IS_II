const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { v4: uuidv4 } = require("uuid");

// Registro
router.post("/register", async (req, res) => {
  const { nombre, correo, contraseña } = req.body;
  if (!nombre || !correo || !contraseña)
    return res.status(400).json({ error: "Campos incompletos" });

  const existe = await db.query("SELECT * FROM usuarios WHERE correo=$1", [correo]);
  if (existe.rowCount > 0)
    return res.status(400).json({ error: "Correo ya registrado" });

  const hash = await bcrypt.hash(contraseña, 10);
  await db.query(
    "INSERT INTO usuarios (id, nombre, correo, contraseña_hash, rol_id) VALUES ($1,$2,$3,$4,$5)",
    [uuidv4(), nombre, correo, hash, 2] // 2 = cliente
  );

  res.json({ ok: true, message: "Usuario registrado con éxito" });
});

// Login
router.post("/login", async (req, res) => {
  const { correo, contraseña } = req.body;
  const result = await db.query(
    "SELECT u.*, r.nombre as rol FROM usuarios u JOIN roles r ON u.rol_id=r.id WHERE correo=$1",
    [correo]
  );

  if (result.rowCount === 0) return res.status(401).send("Error");

  const user = result.rows[0];
  const valid = await bcrypt.compare(contraseña, user.contraseña_hash);
  if (!valid) return res.status(401).send("Error");

  const token = jwt.sign(
    { id: user.id, correo: user.correo, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.json({ ok: true, token, rol: user.rol });
});

module.exports = router;
