/*
RUTAS DE ROLES - rolesRutas.js
Este archivo contiene las rutas para gestionar roles (obtener, crear, actualizar, eliminar)
mediante endpoints REST que interactúan con la base de datos.
*/

/*
IMPORTACIONES Y CONFIGURACIÓN
*/

const express = require("express");
const router = express.Router();
const db = require("../../../conexion");
const { RolModel } = require("../../../../modelos/modelosAdministrador/Roles/modelRol");

/*
RUTA GET: OBTENER TODOS LOS ROLES
Devuelve todos los roles con los campos: id_rol, nombre y tipo.
*/
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        id_rol,
        nombre,
        tipo
      FROM rol
      ORDER BY id_rol
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener roles:", error);
    res.status(500).json({ error: "Error al obtener roles" });
  }
});

/*
RUTA POST: CREAR UN NUEVO ROL
Crea un nuevo rol en la base de datos.
Recibe los campos nombre y tipo en el cuerpo de la solicitud.
Valida los datos antes de la inserción.
*/
router.post("/", async (req, res) => {
  const { nombre, tipo } = req.body;
  if (!nombre || !tipo) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  // Validamos usando el nuevo método estático
  if (!RolModel.validarParaCrear(nombre, tipo)) {
    return res.status(400).json({ error: "Datos inválidos para crear rol" });
  }

  try {
    await db.query(
      "CALL insertar_rol($1, $2)",    // Ajusta el nombre de tu SP si es distinto
      [nombre, tipo]
    );
    res.status(201).json({ mensaje: "Rol creado correctamente" });
  } catch (error) {
    console.error("Error al crear rol:", error);
    res.status(500).json({ error: "Error al crear rol", detalle: error.message });
  }
});

/*
RUTA PUT: ACTUALIZAR UN ROL EXISTENTE
Actualiza un rol existente en la base de datos.
Recibe el ID del rol a actualizar y los nuevos datos (nombre y tipo).
Valida los datos antes de la actualización.
*/
router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { nombre, tipo } = req.body;

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: "ID de rol no válido" });
  }
  if (!nombre || !tipo) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  // Validación usando el modelo
  const rolModel = new RolModel(id, nombre, tipo);
  if (!rolModel.esValido()) {
    return res.status(400).json({ error: "Datos inválidos para actualizar rol" });
  }

  try {
    await db.query(
      "CALL actualizar_rol($1, $2, $3)",  // Asegúrate que tu SP se llame así
      [id, nombre, tipo]
    );
    res.json({ mensaje: "Rol actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar rol:", error);
    res.status(500).json({ error: "Error al actualizar rol", detalle: error.message });
  }
});

/*
RUTA DELETE: ELIMINAR UN ROL
Elimina un rol directamente de la base de datos usando SQL.
Recibe el ID del rol a eliminar.
*/
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: "ID de rol no válido" });
  }

  try {
    const result = await db.query(
      "DELETE FROM rol WHERE id_rol = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Rol no encontrado" });
    }

    res.json({ mensaje: "Rol eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar rol:", error);
    res.status(500).json({ error: "Error al eliminar rol", detalle: error.message });
  }
});

/**
 * RUTA PUT: ASIGNAR ROL A UN USUARIO
 * Actualiza solo el rol_id de un usuario existente usando el procedimiento almacenado actualizar_usuarios.
 * Recibe el ID de usuario como parámetro de ruta y el rol_id en el body.
 */
router.put("/asignar-rol/:id_usuario", async (req, res) => {
  const id_usuario = parseInt(req.params.id_usuario, 10);
  console.log('Ruta asignar-rol, id_usuario recibido:', req.params.id_usuario, '→', id_usuario);
  const { rol_id } = req.body;

  // Validaciones básicas
  if (isNaN(id_usuario) || id_usuario <= 0) {
    return res.status(400).json({ error: "ID de usuario no válido" });
  }
  if (!rol_id || isNaN(parseInt(rol_id, 10))) {
    return res.status(400).json({ error: "rol_id es obligatorio y debe ser numérico" });
  }

  try {
    // Llamada al SP: actualizamos solo rol_id, dejando nombre y password_hash en NULL
    await db.query(
      `CALL actualizar_usuarios(
         $1,       
         NULL,     
         NULL,    
         $2       
       )`,
      [ id_usuario, rol_id ]
    );


    res.json({ mensaje: "Rol asignado correctamente al usuario" });
  } catch (error) {
    console.error("Error al asignar rol al usuario:", error);
    res.status(500).json({
      error: "Error interno al asignar rol",
      detalle: error.message
    });
  }
});


module.exports = router;
