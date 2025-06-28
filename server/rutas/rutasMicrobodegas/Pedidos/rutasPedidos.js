// routes/Pedidos/rutasPedidos.js

const express = require("express");
const router = express.Router();
const db = require("../../../conexion");

/**
 * GET /pedidos/:usuarioId
 * Devuelve los pedidos de la bodega cuyo encargado_id = usuarioId
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
        p.id_pedido,
        c.nombre      AS nombre_cliente,
        b.nombre      AS nombre_bodega,
        p.fecha_pedido,
        p.comentarios,
        p.estado,
        p.total
      FROM pedidos p
      JOIN clientes c ON p.cliente_id = c.id_cliente
      JOIN bodegas b  ON p.bodega_id = b.id_bodega
      WHERE b.encargado_id = $1
      ORDER BY p.fecha_pedido DESC
      `,
      [usuarioId]
    );

    return res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    return res
      .status(500)
      .json({ success: false, mensaje: "Error interno al obtener pedidos." });
  }
});

module.exports = router;
