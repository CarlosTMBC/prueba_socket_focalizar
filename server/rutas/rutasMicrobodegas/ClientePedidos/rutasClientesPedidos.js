/*
RUTAS DE PEDIDOS PENDIENTES - pedidosPendientesRutas.js
Este archivo contiene las rutas para gestionar pedidos pendientes de clientes
en bodegas específicas mediante endpoints REST que interactúan con la base de datos.
*/

/*
IMPORTACIONES Y CONFIGURACIÓN
*/
const express = require("express"); // Framework web para Node.js
const router = express.Router(); // Router de Express para definir rutas
const db = require("../../../conexion"); // Conexión a la base de datos

/*
RUTA GET: OBTENER PEDIDOS PENDIENTES POR CLIENTE Y BODEGA
Realiza una consulta a la base de datos para obtener todos los pedidos
de un cliente específico en una bodega específica, excluyendo los eliminados.
*/
router.get("/pendientes", async (req, res) => {
  try {
    const { cliente_id, bodega_id } = req.query;

    if (!cliente_id || !bodega_id) {
      return res.status(400).json({ 
        error: "Se requieren los parámetros cliente_id y bodega_id" 
      });
    }

    const result = await db.query(`
      SELECT 
        id_pedido,
        cliente_id,
        fecha_pedido,
        comentarios,
        eliminado,
        estado,
        total,
        bodega_id
      FROM pedidos 
      WHERE cliente_id = $1 
        AND bodega_id = $2 
        AND eliminado = false
      ORDER BY fecha_pedido DESC
    `, [cliente_id, bodega_id]);

    console.log(`Pedidos encontrados para cliente ${cliente_id} en bodega ${bodega_id}:`, result.rows.length);
    res.json(result.rows);
    
  } catch (error) {
    console.error("Error al obtener pedidos pendientes:", error);
    res.status(500).json({ error: "Error al obtener pedidos pendientes" });
  }
});

/*
RUTA PUT: ACTUALIZAR ESTADO DE PEDIDO
Actualiza únicamente el estado de un pedido específico.
Valida que el pedido exista y que el nuevo estado sea válido.
*/
router.put("/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({ error: "El estado es requerido" });
    }

    // Validar que el estado sea uno de los permitidos
    const estadosValidos = ['Pendiente', 'En proceso', 'Enviado', 'Completado', 'Cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ 
        error: "Estado no válido. Estados permitidos: " + estadosValidos.join(', ')
      });
    }

    const result = await db.query(
      `UPDATE pedidos 
       SET estado = $1 
       WHERE id_pedido = $2 
         AND eliminado = false
       RETURNING *`,
      [estado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    console.log(`Estado del pedido ${id} actualizado a: ${estado}`);
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error("Error al actualizar estado del pedido:", error);
    res.status(500).json({ error: "Error al actualizar estado del pedido" });
  }
});

/*
RUTA GET: OBTENER DETALLES COMPLETOS DE UN PEDIDO
Obtiene información detallada de un pedido específico incluyendo
productos asociados y datos del cliente.
*/
router.get("/:id/detalles", async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener información básica del pedido
    const pedidoResult = await db.query(`
      SELECT 
        p.id_pedido,
        p.cliente_id,
        p.fecha_pedido,
        p.comentarios,
        p.eliminado,
        p.estado,
        p.total,
        p.bodega_id,
        c.nombre as cliente_nombre,
        c.email as cliente_email,
        b.nombre as bodega_nombre
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id_cliente
      LEFT JOIN bodegas b ON p.bodega_id = b.id_bodega
      WHERE p.id_pedido = $1 AND p.eliminado = false
    `, [id]);

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    // Obtener productos del pedido (si existe tabla pedido_productos)
    let productosResult = { rows: [] };
    try {
      productosResult = await db.query(`
        SELECT 
          pp.producto_id,
          pp.cantidad,
          pp.precio_unitario,
          pp.subtotal,
          pr.nombre as producto_nombre,
          pr.descripcion as producto_descripcion
        FROM pedido_productos pp
        LEFT JOIN productos pr ON pp.producto_id = pr.id_producto
        WHERE pp.pedido_id = $1
      `, [id]);
    } catch (productosError) {
      console.log("Tabla pedido_productos no existe o no hay productos asociados");
    }

    const pedido = pedidoResult.rows[0];
    const productos = productosResult.rows;

    res.json({
      ...pedido,
      productos: productos
    });
    
  } catch (error) {
    console.error("Error al obtener detalles del pedido:", error);
    res.status(500).json({ error: "Error al obtener detalles del pedido" });
  }
});

/*
RUTA GET: BUSCAR PEDIDOS CON FILTROS
Busca pedidos en la base de datos según criterios específicos
como rango de fechas, estado, o término de búsqueda.
*/
router.get("/buscar", async (req, res) => {
  try {
    const { 
      clienteId, 
      bodegaId, 
      query, 
      estado, 
      fechaInicio, 
      fechaFin 
    } = req.query;

    if (!clienteId || !bodegaId) {
      return res.status(400).json({ 
        error: "Se requieren los parámetros clienteId y bodegaId" 
      });
    }

    let consulta = `
      SELECT 
        id_pedido,
        cliente_id,
        fecha_pedido,
        comentarios,
        eliminado,
        estado,
        total,
        bodega_id
      FROM pedidos 
      WHERE cliente_id = $1 
        AND bodega_id = $2 
        AND eliminado = false
    `;
    
    let parametros = [clienteId, bodegaId];
    let paramIndex = 3;

    // Filtrar por estado si se proporciona
    if (estado && estado !== 'todos') {
      consulta += ` AND LOWER(estado) = LOWER($${paramIndex})`;
      parametros.push(estado);
      paramIndex++;
    }

    // Filtrar por rango de fechas
    if (fechaInicio) {
      consulta += ` AND fecha_pedido >= $${paramIndex}`;
      parametros.push(fechaInicio);
      paramIndex++;
    }

    if (fechaFin) {
      consulta += ` AND fecha_pedido <= $${paramIndex}`;
      parametros.push(fechaFin);
      paramIndex++;
    }

    // Búsqueda por término general
    if (query) {
      consulta += ` AND (
        CAST(id_pedido AS TEXT) ILIKE $${paramIndex} OR 
        comentarios ILIKE $${paramIndex} OR 
        estado ILIKE $${paramIndex} OR
        CAST(total AS TEXT) ILIKE $${paramIndex}
      )`;
      parametros.push(`%${query}%`);
      paramIndex++;
    }

    consulta += ` ORDER BY fecha_pedido DESC`;

    const result = await db.query(consulta, parametros);
    
    console.log(`Búsqueda de pedidos - Encontrados: ${result.rows.length}`);
    res.json(result.rows);
    
  } catch (error) {
    console.error("Error al buscar pedidos:", error);
    res.status(500).json({ error: "Error al buscar pedidos" });
  }
});

/*
RUTA GET: OBTENER ESTADÍSTICAS DE PEDIDOS
Obtiene estadísticas básicas de los pedidos de un cliente en una bodega específica.
*/
router.get("/estadisticas", async (req, res) => {
  try {
    const { cliente_id, bodega_id } = req.query;

    if (!cliente_id || !bodega_id) {
      return res.status(400).json({ 
        error: "Se requieren los parámetros cliente_id y bodega_id" 
      });
    }

    const result = await db.query(`
      SELECT 
        COUNT(*) as total_pedidos,
        COUNT(CASE WHEN estado = 'Pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN estado = 'En proceso' THEN 1 END) as en_proceso,
        COUNT(CASE WHEN estado = 'Enviado' THEN 1 END) as enviados,
        COUNT(CASE WHEN estado = 'Completado' THEN 1 END) as completados,
        COUNT(CASE WHEN estado = 'Cancelado' THEN 1 END) as cancelados,
        COALESCE(SUM(total), 0) as monto_total,
        COALESCE(AVG(total), 0) as promedio_pedido
      FROM pedidos 
      WHERE cliente_id = $1 
        AND bodega_id = $2 
        AND eliminado = false
    `, [cliente_id, bodega_id]);

    res.json(result.rows[0]);
    
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

module.exports = router;