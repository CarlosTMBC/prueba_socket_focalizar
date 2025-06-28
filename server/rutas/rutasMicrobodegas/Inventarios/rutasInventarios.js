// routes/Inventarios/rutasInventarios.js
const express = require("express");
const router = express.Router();
const db = require("../../../conexion");

/**
 * GET /inventarios/:usuarioId
 * Devuelve el inventario (stock) de la bodega cuyo encargado_id = usuarioId
 * usando las tablas: bodega_producto, productos y bodega_stock.
 */
router.get("/:usuarioId", async (req, res) => {
  const usuarioId = parseInt(req.params.usuarioId, 10);
  if (isNaN(usuarioId) || usuarioId <= 0) {
    return res
      .status(400)
      .json({ success: false, mensaje: "ID de usuario inválido." });
  }

  try {
    const result = await db.query(
      `
      SELECT
        bp.id                             AS bodega_producto_id,
        p.nombre                          AS producto_nombre,
        p.fecha_de_vencimiento            AS fecha_vencimiento,
        bs.stock_actual,
        bs.stock_minimo,
        bs.stock_maximo
      FROM bodega_producto bp
      JOIN bodegas b
        ON bp.bodega_id = b.id_bodega
      JOIN productos p
        ON bp.producto_id = p.id_producto
      JOIN bodega_stock bs
        ON bs.bodega_producto_id = bp.id
      WHERE b.encargado_id = $1
      ORDER BY p.nombre
      `,
      [usuarioId]
    );

    return res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error al obtener inventario:", error);
    return res
      .status(500)
      .json({ success: false, mensaje: "Error interno al obtener inventario." });
  }
});

module.exports = router;
