
// server/rutas/administrador/Movimientos/rutasMovimientos.js
/**
 * GET /
 * Devuelve todos los movimientos (no eliminados) con:
 *   - id_movimiento
 *   - fecha_movimiento
 *   - bodega_origen_id
 *   - bodega_destino_id
 *   - motivo
 *   - estado
 *   - descripcion
 *   - recibido
 *   - fecha_recepcion
 *   - observaciones
 *   - bodega_origen_nombre
 *   - bodega_destino_nombre
 *
 * Solo se muestran registros donde eliminado = false, y se ordenan por id_movimiento DESC.
 */
/*
RUTAS DE MOVIMIENTOS - rutasMovimientos.js
Este archivo contiene las rutas para gestionar movimientos (obtener)
mediante endpoints REST que interactúan con la base de datos.
*/

/*
IMPORTACIONES Y CONFIGURACIÓN
*/
const express = require("express");//Framework web para Node.js
const router = express.Router();//Router de Express para definir rutas
const db = require("../../../conexion"); // Conexión a la base de datos
const { MovimientoModel } = require("../../../../modelos/modelosAdministrador/Movimientos/modelMovimientos");//Modelo de Movimientos

/*
RUTA GET: OBTENER TODOS LOS MOVIMIENTOS
Realiza una consulta SQL para obtener todos los movimientos registrados en el sistema.
La consulta incluye JOINs con otras tablas relacionadas como bodegas, productos y usuarios
para mostrar los nombres asociados a cada ID, lo que facilita la lectura y visualización de los datos.
Se ordenan los movimientos de forma descendente según su ID para mostrar los más recientes primero.
*/
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        m.id_movimiento,
        m.fecha_movimiento,
        m.bodega_origen_id,
        m.bodega_destino_id,
        m.motivo,
        m.estado,
        m.descripcion,
        m.recibido,
        m.fecha_recepcion,
        m.observaciones,
        bo.nombre AS bodega_origen_nombre,
        bd.nombre AS bodega_destino_nombre
      FROM movimientos m
      JOIN bodegas bo 
        ON m.bodega_origen_id = bo.id_bodega
      JOIN bodegas bd 
        ON m.bodega_destino_id = bd.id_bodega
      WHERE m.eliminado = false
      ORDER BY m.id_movimiento DESC
    `);

    res.json({ movimientos: result.rows });
  } catch (error) {
    console.error("Error al obtener movimientos desde la ruta:", error);
    res.status(500).json({ error: "Error al obtener movimientos" });
  }
});


// RUTA GET: OBTENER MOVIMIENTO POR ID  
// Esta ruta permite obtener un movimiento específico por su ID.
router.get("/:id_movimiento", async (req, res) => {
  const idMov = parseInt(req.params.id_movimiento, 10);
  if (isNaN(idMov) || idMov <= 0) {
    return res.status(400).json({ success: false, mensaje: "ID inválido." });
  }

  try {
    // 1) Obtener el encabezado del movimiento
    const headerQ = await db.query(
      `
      SELECT
        m.id_movimiento,
        m.fecha_movimiento,
        m.bodega_origen_id,
        bo.nombre   AS bodega_origen_nombre,
        m.bodega_destino_id,
        bd.nombre   AS bodega_destino_nombre,
        m.motivo,
        m.estado,
        m.descripcion,
        m.recibido,
        m.fecha_recepcion,
        m.observaciones
      FROM movimientos m
      JOIN bodegas bo
        ON m.bodega_origen_id = bo.id_bodega
      JOIN bodegas bd
        ON m.bodega_destino_id = bd.id_bodega
      WHERE m.id_movimiento = $1
        AND m.eliminado = false
      `,
      [idMov]
    );

    if (headerQ.rows.length === 0) {
      return res.status(404).json({ success: false, mensaje: "Movimiento no encontrado." });
    }
    const header = headerQ.rows[0];

    // 2) Obtener los productos asociados a ese movimiento
    const itemsQ = await db.query(
      `
      SELECT
        mp.id_producto,
        p.nombre           AS producto_nombre,
        mp.cantidad_transferida
      FROM movimiento_productos mp
      JOIN productos p
        ON mp.id_producto = p.id_producto
      WHERE mp.id_movimiento = $1
      `,
      [idMov]
    );

    return res.json({
      success: true,
      header,
      items: itemsQ.rows
    });
  } catch (error) {
    console.error(`Error al obtener movimiento ${idMov}:`, error);
    return res
      .status(500)
      .json({ success: false, mensaje: "Error interno al obtener movimiento." });
  }
});


// Obtener la bodega de origen asignada a un usuario (encargado_id)
router.get("/origen/:idUsuario", async (req, res) => {
  const idUsuario = parseInt(req.params.idUsuario, 10);
  if (isNaN(idUsuario)) {
    return res.status(400).json({ success: false, mensaje: "ID de usuario inválido" });
  }

  try {
    const { rows } = await db.query(
      "SELECT id_bodega, nombre FROM bodegas WHERE encargado_id = $1",
      [idUsuario]
    );
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, mensaje: "No se encontró bodega para ese encargado" });
    }
    res.json({ success: true, bodegaOrigen: rows[0] });
  } catch (error) {
    console.error("Error al obtener bodega de origen por encargado:", error);
    res.status(500).json({ success: false, mensaje: "Error en el servidor" });
  }
});

/**
 * GET /stock/:bodega_id
 * Devuelve para la bodega indicada todos los productos con:
 *  - bodega_producto_id
 *  - producto_id
 *  - producto_nombre
 *  - stock_actual
 *  - stock_minimo
 *  - stock_maximo
 */
router.get("/stock/:bodega_id", async (req, res) => {
  const { bodega_id } = req.params;
  try {
    const result = await db.query(
      `
      SELECT
        bp.id               AS bodega_producto_id,
        bp.producto_id,
        p.nombre            AS producto_nombre,
        bs.stock_actual,
        bs.stock_minimo,
        bs.stock_maximo
      FROM bodega_producto bp
      JOIN productos p
        ON bp.producto_id = p.id_producto
      LEFT JOIN bodega_stock bs
        ON bs.bodega_producto_id = bp.id
      WHERE bp.bodega_id = $1
      ORDER BY p.nombre;
      `,
      [bodega_id]
    );

    return res.json({ stock: result.rows });
  } catch (error) {
    console.error("Error al obtener stock de bodega:", error);
    return res.status(500).json({ error: "Error al obtener stock de bodega" });
  }
});

/**
 * POST /movimientos
 * Inserta un movimiento y luego sus productos detalle usando SPs.
 */
router.post("/", async (req, res) => {
  const { movimiento, detalle } = req.body;

  // validaciones mínimas
  if (!movimiento || !Array.isArray(detalle) || detalle.length === 0) {
    return res.status(400).json({
      error:
        "Debe enviar 'movimiento' con los campos obligatorios y un array 'detalle' con al menos un elemento.",
    });
  }

  // Crear y validar el modelo
  const model = new MovimientoModel(
    movimiento.fecha_movimiento,
    movimiento.bodega_origen_id,
    movimiento.bodega_destino_id,
    movimiento.motivo,
    movimiento.estado,
    movimiento.descripcion,
    movimiento.recibido,
    movimiento.fecha_recepcion,
    movimiento.observaciones,
    movimiento.eliminado
  );

  if (!model.esValido()) {
    return res.status(400).json({ error: "Datos de movimiento inválidos." });
  }

  try {
    await db.query("BEGIN");

    // Inserción principal
    await db.query(
      `CALL insertar_movimientos(
         $1, $2, $3, $4, $5, $6, $7, $8, $9
       )`,
      model.obtenerParamsInsert()
    );

    // Recuperar ID generado
    const {
      rows: [{ id_movimiento: newId }],
    } = await db.query(
      `SELECT currval(pg_get_serial_sequence('movimientos','id_movimiento')) AS id_movimiento`
    );

    // Detalle
    for (const item of detalle) {
      await db.query(
        `CALL insertar_movimiento_productos($1, $2, $3)`,
        [newId, item.id_producto, item.cantidad_transferida]
      );
    }

    await db.query("COMMIT");
    return res.status(201).json({ success: true, id_movimiento: newId });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Error en creación de movimiento + detalle:", error);
    return res.status(500).json({
      success: false,
      error: "No se pudo completar la operación",
      detalles: error.message,
    });
  }
});

/**
 * PUT /movimientos/:id_movimiento/detalle
 * Actualiza las cantidades de los productos de un movimiento.
 */
router.put("/:id_movimiento/detalle", async (req, res) => {
  const idMov = parseInt(req.params.id_movimiento, 10);
  const items = req.body.items;

  if (isNaN(idMov) || idMov <= 0 || !Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ success: false, mensaje: "ID o items inválidos." });
  }

  try {
    for (const { id_producto, cantidad_transferida } of items) {
      const prodId = parseInt(id_producto, 10);
      const qty = Number(cantidad_transferida);

      if (isNaN(prodId) || prodId <= 0 || isNaN(qty) || qty < 0) {
        return res.status(400).json({
          success: false,
          mensaje: `Detalle inválido: producto ${id_producto}, cantidad ${cantidad_transferida}`,
        });
      }

      await db.query(
        `CALL actualizar_movimiento_productos($1, $2, $3)`,
        [idMov, prodId, qty]
      );
    }

    return res.json({ success: true, mensaje: "Detalle actualizado correctamente." });
  } catch (error) {
    console.error("Error al actualizar detalle de movimiento:", error);
    return res
      .status(500)
      .json({ success: false, mensaje: "Error interno al actualizar detalle." });
  }
});

/**
 * PUT /movimientos/:id_movimiento
 * Actualiza solo motivo, descripción y observaciones del movimiento.
 */
router.put("/:id_movimiento", async (req, res) => {
  const idMov = parseInt(req.params.id_movimiento, 10);
  const { motivo, descripcion, observaciones } = req.body;

  // Validaciones básicas de formato
  if (isNaN(idMov) || idMov <= 0) {
    return res.status(400).json({ success: false, mensaje: "ID de movimiento inválido." });
  }
  if (
    typeof motivo !== "string" ||
    typeof descripcion !== "string" ||
    typeof observaciones !== "string"
  ) {
    return res
      .status(400)
      .json({ success: false, mensaje: "Debe enviar motivo, descripción y observaciones." });
  }

  // Instanciar modelo para sanitizar
  const model = new MovimientoModel(
    null,    // fecha_movimiento (no cambia)
    null,    // bodega_origen_id
    null,    // bodega_destino_id
    motivo,
    null,    // estado
    descripcion,
    null,    // recibido
    null,    // fecha_recepcion
    observaciones,
    null     // eliminado
  );

  // Extraer los campos ya sanitizados
  const mMotivo = model.motivo;
  const mDesc   = model.descripcion;
  const mObs    = model.observaciones;

  // Si tras sanitizar alguno quedó vacío ⇒ caracteres inválidos o nulo
  if (!mMotivo || !mDesc || !mObs) {
    return res.status(400).json({
      success: false,
      mensaje: "Los campos no pueden estar vacíos ni contener caracteres <>/'\"`.",
    });
  }

  try {
    await db.query(
      `CALL actualizar_movimientos(
         $1, NULL, NULL, NULL,
         $2, NULL, $3, NULL, NULL, $4
       )`,
      [idMov, mMotivo, mDesc, mObs]
    );
    return res.json({ success: true, mensaje: "Movimiento actualizado correctamente." });
  } catch (error) {
    console.error("Error al actualizar movimiento:", error);
    return res
      .status(500)
      .json({ success: false, mensaje: "Error interno al actualizar movimiento." });
  }
});

/**
 * DELETE /movimientos/:id_movimiento
 * Marca un movimiento como eliminado llamando al SP eliminar_movimientos.
 */
router.delete("/:id_movimiento", async (req, res) => {
  const idMov = parseInt(req.params.id_movimiento, 10);
  if (isNaN(idMov) || idMov <= 0) {
    return res
      .status(400)
      .json({ success: false, mensaje: "ID de movimiento inválido." });
  }

  try {
    // Llamada al procedimiento almacenado que pone eliminado = true
    await db.query(`CALL eliminar_movimientos($1);`, [idMov]);
    return res.json({
      success: true,
      mensaje: `Movimiento ${idMov} eliminado correctamente.`
    });
  } catch (error) {
    console.error(`Error al eliminar movimiento ${idMov}:`, error);
    return res
      .status(500)
      .json({ success: false, mensaje: "Error interno al eliminar movimiento." });
  }
});

module.exports = router;
