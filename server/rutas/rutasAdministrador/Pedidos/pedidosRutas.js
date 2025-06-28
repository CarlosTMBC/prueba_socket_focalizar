
const express = require("express");
const router = express.Router();
const db = require("../../../conexion");
//const { PedidoModel } = require("../../../../modelos/modelosAdministrador/Pedidos/modelPedido"); // <- puedes activarlo si luego usas POST/PUT

/**
 * GET /
 * Devuelve todos los pedidos con:
 *  - id_pedido
 *  - nombre_cliente
 *  - nombre_bodega
 *  - fecha_pedido
 *  - comentarios
 *  - eliminado
 *  - estado
 *  - total
 */
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.id_pedido,
        c.nombre AS nombre_cliente,
        b.nombre AS nombre_bodega,
        p.fecha_pedido,
        p.comentarios,
        p.eliminado,
        p.estado,
        p.total
      FROM pedidos p
      JOIN clientes c ON p.cliente_id = c.id_cliente
      JOIN bodegas b ON p.bodega_id = b.id_bodega
      ORDER BY p.fecha_pedido DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener pedidos:", error.message);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
});

// ======================
// Marcar un pedido como "Completado" usando el procedimiento almacenado
// ======================
// Ruta PUT /pedidos/:id/completar
// No necesita body: la ruta sólo cambiará el campo estado a "Completado".
// Se obtienen los demás campos directamente de la base de datos para pasarlos al proc.
router.put("/:id/completar", async (req, res) => {
  const { id } = req.params;

  try {
    // 1) Obtenemos los valores actuales de ese pedido
    const result = await db.query(
      `SELECT 
         cliente_id,
         fecha_pedido,
         comentarios,
         total,
         bodega_id
       FROM pedidos
       WHERE id_pedido = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: `No existe un pedido con id=${id}` });
    }

    const { cliente_id, fecha_pedido, comentarios, total, bodega_id } =
      result.rows[0];

    // 2) Llamamos al procedimiento pasando "Completado" en el parámetro estado,
    //    y los demás valores tal cual estaban en la fila.
    await db.query(
      `CALL actualizar_pedidos(
         $1, $2, $3, $4, $5, $6, $7
       );`,
      [
        id,
        cliente_id,
        fecha_pedido,
        comentarios,
        "Completado",
        total,
        bodega_id,
      ]
    );

    return res.json({
      success: true,
      message: `Pedido con id=${id} marcado como "Completado".`,
    });
  } catch (error) {
    console.error("Error al ejecutar actualizar_pedidos:", error);
    return res
      .status(500)
      .json({ error: "No se pudo actualizar el estado del pedido." });
  }
});

module.exports = router;
