/*
RUTAS DE BODEGAS - rutasBodegas.js
Este archivo contiene las rutas para gestionar bodegas (obtener, crear, actualizar, eliminar)
mediante endpoints REST que interactúan con la base de datos.
*/

/*
IMPORTACIONES Y CONFIGURACIÓN
*/
const express = require("express");
const router = express.Router();
const db = require("../../../conexion");

/*
RUTA GET: OBTENER TODAS LAS BODEGAS
Devuelve todas las bodegas con información completa incluyendo:
- id_bodega, nombre, encargado_nombre, telefono, ubicacion, rol, departamento, municipio
*/
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        b.id_bodega,
        b.nombre         AS bodega_nombre,
        u.nombre         AS encargado_nombre,
        b.telefono,
        b.ubicacion,
        r.nombre         AS rol,
        b.departamento,
        b.municipio
      FROM bodegas b
      LEFT JOIN usuarios u
        ON b.encargado_id = u.id_usuario
      LEFT JOIN rol r
        ON b.rol_id = r.id_rol
      ORDER BY b.id_bodega DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener bodegas:", error);
    res.status(500).json({ error: "Error al obtener bodegas" });
  }
});

/*
RUTA POST: CREAR NUEVA BODEGA
Requiere: nombre, encargado_id, telefono, ubicacion, rol, departamento, municipio.
*/
router.post("/", async (req, res) => {
  const {
    nombre,
    encargado_id,
    telefono,
    ubicacion,
    rol,
    departamento,
    municipio,
  } = req.body;

  // Validar que todos los campos vengan
  if (
    !nombre ||
    !encargado_id ||
    !telefono ||
    !ubicacion ||
    !rol ||
    !departamento ||
    !municipio
  ) {
    return res
      .status(400)
      .json({ error: "Todos los campos son obligatorios" });
  }

  try {
    await db.query(
      `CALL insertar_bodegas($1, $2, $3, $4, $5, $6, $7)`,
      [
        nombre,
        encargado_id,
        telefono,
        ubicacion,
        rol,
        departamento,
        municipio,
      ]
    );

    res.status(201).json({ mensaje: "Bodega creada correctamente" });
  } catch (error) {
    console.error("Error al crear bodega:", error);
    res.status(400).json({ error: error.message });
  }
});

/*
RUTA PUT: ACTUALIZAR BODEGA EXISTENTE
Actualiza una bodega existente por su ID.
Requiere en el body: nombre, encargado_id, telefono, ubicacion, rol, departamento, municipio.
*/
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    encargado_id,
    telefono,
    ubicacion,
    rol,
    departamento,
    municipio,
  } = req.body;

  const id_bodega = parseInt(id, 10);
  if (isNaN(id_bodega) || id_bodega <= 0) {
    return res
      .status(400)
      .json({ error: "El ID de la bodega en la URL no es válido." });
  }

  if (
    !nombre ||
    !encargado_id ||
    !telefono ||
    !ubicacion ||
    !rol ||
    !departamento ||
    !municipio
  ) {
    return res.status(400).json({
      error: "Todos los campos son obligatorios en el cuerpo de la solicitud",
    });
  }

  try {
    await db.query(
      `CALL actualizar_bodegas($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id_bodega,
        nombre,
        encargado_id,
        telefono,
        ubicacion,
        rol,
        departamento,
        municipio,
      ]
    );

    res
      .status(200)
      .json({ mensaje: "Bodega actualizada correctamente." });
  } catch (error) {
    console.error("Error al actualizar bodega:", error);
    res.status(500).json({
      error: "Error interno del servidor al actualizar bodega",
      detalle: error.message,
    });
  }
});

/*
RUTA DELETE: ELIMINAR BODEGA
(Se mantiene igual, asume que el SP no cambió)
*/
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const id_bodega = parseInt(id, 10);

  if (isNaN(id_bodega) || id_bodega <= 0) {
    return res
      .status(400)
      .json({ error: "El ID de la bodega en la URL no es válido" });
  }

  try {
    await db.query(
      `CALL gestionar_bodegas($1, $2, NULL, NULL, NULL, NULL, NULL)`,
      ["eliminar", id_bodega]
    );

    res.status(200).json({ mensaje: "Bodega eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar bodega:", error);
    if (error.code === "23503") {
      res.status(409).json({
        error: "No se puede eliminar la bodega",
        detalle: "Está siendo referenciada por otros registros",
      });
    } else {
      res.status(500).json({
        error: "Error al eliminar la bodega",
        detalle: error.message,
      });
    }
  }
});

/*
RUTA GET: CLIENTES-NOMBRES
(Se mantiene igual)
*/
router.get("/clientes-nombres", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        c.id_cliente, 
        c.nombre, 
        c.usuario_id
      FROM clientes c
      JOIN usuarios u ON u.id_usuario = c.usuario_id
      WHERE c.eliminado = false
      ORDER BY c.nombre ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener nombres de clientes:", error);
    res.status(500).json({ error: "Error al obtener nombres de clientes" });
  }
});

module.exports = router;
