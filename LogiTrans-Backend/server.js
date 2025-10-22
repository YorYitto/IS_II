// ===============================
// 🌐 LogiTrans Backend (Node + Express + PostgreSQL)
// ===============================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { pool } from "./db/database.js";

dotenv.config();
const app = express();

// ===============================
// 🧰 Middlewares
// ===============================
app.use(express.json());
app.use(
  cors({
    origin: "*", // 🔥 Permite peticiones desde tu frontend (AWS, localhost, etc.)
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// ===============================
// 🧠 Variables globales
// ===============================
const PORT = process.env.PORT || 9090;
const JWT_SECRET = process.env.JWT_SECRET;

// ===============================
// 🧍 Registro de usuario
// ===============================
app.post("/api/register", async (req, res) => {
  try {
    const { nombre, correo, contraseña } = req.body;

    const hashedPassword = await bcrypt.hash(contraseña, 10);
    await pool.query(
      "INSERT INTO usuarios (nombre, correo, contraseña, rol) VALUES ($1, $2, $3, 'cliente')",
      [nombre, correo, hashedPassword]
    );

    res.json({ message: "✅ Usuario registrado exitosamente" });
  } catch (error) {
    console.error("❌ Error al registrar usuario:", error);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

// ===============================
// 🔑 Inicio de sesión
// ===============================
app.post("/api/login", async (req, res) => {
  try {
    const { correo, contraseña } = req.body;

    const result = await pool.query("SELECT * FROM usuarios WHERE correo = $1", [correo]);
    if (result.rows.length === 0) return res.status(401).json({ error: "Usuario no encontrado" });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(contraseña, user.contraseña);
    if (!validPassword) return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user.id, rol: user.rol }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    res.json({
      message: "✅ Login exitoso",
      token,
      rol: user.rol,
      nombre: user.nombre,
    });
  } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({ error: "Error en inicio de sesión" });
  }
});

// ===============================
// 🚛 OBTENER TODOS LOS CAMIONES
// ===============================
app.get("/api/camiones", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM camiones ORDER BY placa ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener camiones:", error);
    res.status(500).json({ error: "Error al obtener camiones" });
  }
});

// ===============================
// 🚛 REGISTRAR NUEVO CAMIÓN
// ===============================
app.post("/api/camiones", async (req, res) => {
  try {
    const { placa, modelo, estado } = req.body;

    if (!placa) {
      return res.status(400).json({ error: "La placa es obligatoria" });
    }

    await pool.query(
      "INSERT INTO camiones (placa, modelo, estado) VALUES ($1, $2, $3)",
      [placa, modelo || null, estado || "disponible"]
    );

    res.json({ message: "✅ Camión registrado correctamente" });
  } catch (error) {
    console.error("❌ Error al registrar camión:", error);
    res.status(500).json({ error: "Error al registrar camión" });
  }
});

// ===============================
// 🚚 ASIGNAR CAMIÓN A UN ENVÍO
// ===============================
app.put("/api/envios/:id/asignar", async (req, res) => {
  try {
    const { camion_id } = req.body;
    const envio_id = req.params.id;

    if (!camion_id) {
      return res.status(400).json({ error: "Se requiere el ID del camión" });
    }

    // Asignar camión al envío
    await pool.query("UPDATE envios SET camion_id = $1, estado = 'en tránsito' WHERE id = $2", [camion_id, envio_id]);

    // Cambiar estado del camión
    await pool.query("UPDATE camiones SET estado = 'en servicio' WHERE id = $1", [camion_id]);

    res.json({ message: "✅ Camión asignado correctamente al envío" });
  } catch (error) {
    console.error("❌ Error al asignar camión:", error);
    res.status(500).json({ error: "Error al asignar camión" });
  }
});

// ===============================
// 🔄 CAMBIAR ESTADO DE UN CAMIÓN
// ===============================
app.put("/api/camiones/:id/estado", async (req, res) => {
  try {
    const { estado } = req.body;
    const camion_id = req.params.id;

    if (!estado) {
      return res.status(400).json({ error: "Debe especificar el nuevo estado" });
    }

    await pool.query("UPDATE camiones SET estado = $1 WHERE id = $2", [estado, camion_id]);
    res.json({ message: "✅ Estado del camión actualizado" });
  } catch (error) {
    console.error("❌ Error al cambiar estado del camión:", error);
    res.status(500).json({ error: "Error al cambiar estado del camión" });
  }
});

// ===============================
// 📋 OBTENER SOLICITUDES (ADMIN)
// ===============================
app.get("/api/admin/envios", async (req, res) => {
  try {
    const query = `
      SELECT 
        e.id,
        e.estado,
        e.fecha_creacion,
        e.fecha_entrega_estimada,
        u.nombre AS remitente,
        d.nombre AS destinatario,
        c.placa AS camion_asignado
      FROM envios e
      LEFT JOIN usuarios u ON e.remitente_id = u.id
      LEFT JOIN usuarios d ON e.destinatario_id = d.id
      LEFT JOIN camiones c ON e.camion_id = c.id
      ORDER BY e.fecha_creacion DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener solicitudes:", error);
    res.status(500).json({ error: "Error al obtener solicitudes" });
  }
});

// ===============================
// 🧭 INICIO DEL SERVIDOR
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 Servidor LogiTrans ejecutándose en el puerto ${PORT}`);
});
