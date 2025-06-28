const express = require("express");
const router = express.Router();
const db = require("../../../conexion");
const { PedidoProductoModel } = require("../../../../modelos/modelosAdministrador/Pedidos/modelPedidoProductos");

/**
 * GET /:id_pedido
 * Devuelve los productos asociados a un pedido específico
 */
router.get("/notiPedido", async (req, res) => {
  const { desde } = req.query;

  // Validar el parámetro de fecha
  if (!desde) {
    return res.status(400).json({ error: "Falta el parámetro 'desde'" });
  }

  try {
    const result = await db.query(
      `
      SELECT 
        p.id_pedido, 
        c.nombre AS nombre_cliente, 
        p.fecha_pedido,
        p.total
      FROM pedidos p
      JOIN clientes c ON c.id_cliente = p.cliente_id
      WHERE p.eliminado = false
        AND p.fecha_pedido >= $1
      ORDER BY p.fecha_pedido DESC
      LIMIT 5
      `,
      [desde]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener notificaciones de pedidos rutas:", error.message);
    res.status(500).json({ error: "Error interno al obtener notificaciones" });
  }
});

router.get("/:id_pedido", async (req, res) => {
  const idPedido = parseInt(req.params.id_pedido, 10);
  if (isNaN(idPedido) || idPedido <= 0) {
    return res.status(400).json({ error: "ID de pedido inválido" });
  }

  try {
    const result = await db.query(
      `
      SELECT 
        pp.id_pedido,
        p.nombre,
        pp.cantidad,
        pp.precio,
        pp.subtotal
      FROM pedido_productos pp
      JOIN productos p ON pp.id_producto = p.id_producto
      WHERE pp.id_pedido = $1
      `,
      [idPedido]
    );

    console.log("🔎 Datos crudos desde PostgreSQL:", result.rows);

    const productos = result.rows.map(PedidoProductoModel.desdeFilaBD);

    console.log("📦 Productos formateados:", productos);

    res.json(productos); // debe ser un array
  } catch (error) {
    console.error("❌ Error al obtener productos del pedido:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});



module.exports = router;
