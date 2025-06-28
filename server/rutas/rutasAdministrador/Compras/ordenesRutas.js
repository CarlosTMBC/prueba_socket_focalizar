/*
RUTAS DE ÓRDENES DE COMPRA - rutasOrdenesCompra.js
Este archivo contiene las rutas para gestionar órdenes de compra y sus detalles,
incluyendo operaciones CRUD (Crear, Leer, Actualizar, Eliminar)
mediante endpoints REST que interactúan con la base de datos.
*/

/*
IMPORTACIONES Y CONFIGURACIÓN
*/
const express = require("express");//Framework web para Node.js
const router = express.Router();// Router de Express para definir rutas 
const db = require("../../../conexion"); // Importa el objeto con el método query

// ---------- O R D E N E S  ----------

// GET todo: listar órdenes con filtros
// query params: estado=activas|eliminadas, aprobado=true|false
router.get("/", async (req, res) => {
  const { estado = 'activas', aprobado } = req.query;
  let where = "WHERE o.eliminado = FALSE";
  if (estado === "eliminadas") where = "WHERE o.eliminado = TRUE";
  if (aprobado === 'true') where += " AND o.aprobado = TRUE";
  else if (aprobado === 'false') where += " AND o.aprobado = FALSE";
  try {
    const result = await db.query(
      `SELECT
         o.id_orden, o.fecha_orden, o.bodega_id, o.proveedor_id, o.aprobado,
         b.nombre AS nombre_bodega,
         p.nombre AS nombre_proveedor
       FROM ordenes_compra o
       JOIN bodegas b ON o.bodega_id = b.id_bodega
       JOIN proveedores p ON o.proveedor_id = p.id_proveedor
       ${where}
       ORDER BY o.id_orden ASC;`
    );
    res.json(result.rows || []);
  } catch (error) {
    console.error("Error al obtener órdenes:", error);
    res.status(500).json({ error: "Error al obtener órdenes" });
  }
});

// POST /compraCompleta: inserta orden y detalles en transacción
router.post("/compraCompleta", async (req, res) => {
  const { orden, detalles } = req.body;

  try {
    // Insertar orden de compra
    await db.query(
      `CALL insertar_ordenes_compra($1, $2, $3, $4)`,
      [orden.bodega_id, orden.proveedor_id, orden.fecha_orden, orden.aprobado]
    );

    // Obtener el último ID insertado
    const { rows } = await db.query(`SELECT LASTVAL() AS id_orden`);
    const newOrderId = rows[0].id_orden;

    // Insertar detalles
    for (const d of detalles) {
      await db.query(
        `CALL insertar_detalles_compra($1, $2, $3, $4, $5)`,
        [newOrderId, d.producto_id, d.cantidad, d.precio_unitario, d.subtotal]
      );
    }

    res.status(201).json({ success: true, id_orden: newOrderId });
  } catch (error) {
    console.error("Error en compraCompleta:", error);
    res.status(500).json({
      success: false,
      error: "No se pudo registrar la compra completa",
      detalle: error.message
    });
  }
});

// PUT: actualizar orden existente
router.put("/:id_orden", async (req, res) => {
  const { id_orden } = req.params;
  const { fecha_orden, bodega_id, proveedor_id, aprobado } = req.body;
  try {
    await db.query(
      `UPDATE ordenes_compra
       SET fecha_orden=$1, bodega_id=$2, proveedor_id=$3, aprobado=$4
       WHERE id_orden=$5`,
      [fecha_orden, bodega_id, proveedor_id, aprobado, id_orden]
    );
    res.json({ message: "Orden actualizada exitosamente" });
  } catch (error) {
    console.error("Error al actualizar Orden:", error);
    res.status(500).json({ error: "Error al actualizar Orden" });
  }
});

// DELETE: marcar orden como eliminada
router.delete("/:id_orden", async (req, res) => {
  const { id_orden } = req.params;
  try {
    const result = await db.query(
      `UPDATE ordenes_compra SET eliminado=TRUE WHERE id_orden=$1`,
      [id_orden]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Orden no encontrada" });
    res.json({ mensaje: "Orden marcada como eliminada" });
  } catch (error) {
    console.error("Error al eliminar la orden:", error);
    res.status(500).json({ error: "Error al eliminar la orden" });
  }
});

// ---------- D E T A L L E S  ----------

// GET detalles por orden
router.get("/compraPorOrden/:id_orden", async (req, res) => {
  const { id_orden } = req.params;
  try {
    const result = await db.query(
      `SELECT d.id_detalles, d.orden_id, d.producto_id, d.cantidad,
              d.precio_unitario, d.subtotal, p.nombre AS nombre_producto
       FROM detalles_compra d
       JOIN productos p ON d.producto_id = p.id_producto
       WHERE d.orden_id=$1
       ORDER BY d.id_detalles ASC;`,
      [id_orden]
    );
    res.json(result.rows || []);
  } catch (error) {
    console.error("Error al obtener detalles:", error);
    res.status(500).json({ error: "Error al obtener detalles" });
  }
});

// PUT detalle
router.put("/detallesCompra/:id_detalles", async (req, res) => {
  const { id_detalles } = req.params;
  const { orden_id, producto_id, cantidad, precio_unitario, subtotal } = req.body;
  try {
    await db.query(
      `UPDATE detalles_compra
         SET orden_id=$1, producto_id=$2, cantidad=$3,
             precio_unitario=$4, subtotal=$5
       WHERE id_detalles=$6`,
      [orden_id, producto_id, cantidad, precio_unitario, subtotal, id_detalles]
    );
    res.json({ message: "Detalle actualizado" });
  } catch (error) {
    console.error("Error al actualizar detalle:", error);
    res.status(500).json({ error: "Error al actualizar detalle" });
  }
});

// DELETE detalle
router.delete("/detallesCompra/:id_detalles", async (req, res) => {
  const { id_detalles } = req.params;
  try {
    await db.query(`DELETE FROM detalles_compra WHERE id_detalles=$1`, [id_detalles]);
    res.json({ mensaje: "Detalle eliminado" });
  } catch (error) {
    console.error("Error al eliminar detalle:", error);
    res.status(500).json({ error: "Error al eliminar detalle" });
  }
});

// ---------- P I C K E R S / D A T O S  A P O Y O  ----------

// GET nombres de proveedores
router.get("/proveedores-nombres", async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT id_proveedor, nombre AS nombre_proveedor FROM proveedores`);
    res.json(rows);
  } catch (error) {
    console.error("Error proveedores:", error);
    res.status(500).json({ error: "Error al obtener proveedores" });
  }
});

// GET nombres de bodegas
router.get("/bodegas-nombres", async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT id_bodega, nombre FROM bodegas`);
    res.json(rows);
  } catch (error) {
    console.error("Error bodegas:", error);
    res.status(500).json({ error: "Error al obtener bodegas" });
  }
});

// GET productos por proveedor de orden
router.get("/nombresProductos/:id_orden", async (req, res) => {
  const { id_orden } = req.params;
  try {
    const { rows } = await db.query(
      `SELECT p.id_producto, p.nombre
       FROM productos p
       WHERE p.proveedor_id = (
         SELECT proveedor_id FROM ordenes_compra WHERE id_orden=$1
       )
       ORDER BY p.id_producto ASC;`,
      [id_orden]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error productos:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});


router.put("/aprobar/:id_orden", async (req, res) => {
  try {
    const id_orden = parseInt(req.params.id_orden);
    const aprobado = true;

    await db.query(
      "CALL actualizar_orden_compra($1, $2, $3, $4, $5)",
      [id_orden, null, null, null, aprobado]
    );

    res.json({ success: true, mensaje: "Orden aprobada correctamente" });
  } catch (error) {
    console.error("Error al aprobar la orden:", error);
    res.status(500).json({ success: false, mensaje: "Error al aprobar la orden" });
  }
});
  module.exports = router;