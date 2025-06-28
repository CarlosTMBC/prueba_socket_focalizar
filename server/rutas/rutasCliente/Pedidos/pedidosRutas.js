/*
RUTAS DE PEDIDOS CLIENTE - rutasPedidosCliente.js
Este archivo contiene las rutas para gestionar pedidos de clientes (obtener resumen, productos, detalles y crear pedidos)
mediante endpoints REST que interactúan con la base de datos.
*/

/*
IMPORTACIONES Y CONFIGURACIÓN
*/
const express = require("express");
const router = express.Router();
const db = require("../../../conexion");

const bcrypt = require("bcrypt");
const { Pool } = require("pg");
require("dotenv").config();

// Creamos pool para operaciones con transacción
const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

/*
RUTA GET: OBTENER RESUMEN DE PEDIDOS
Obtiene un resumen de todos los pedidos de un cliente específico,
incluyendo ID del pedido, fecha y subtotal agrupado.
*/
// GET /notiPedidoCliente?cliente_id=5&desde=2025-06-16T00:00:00
router.get("/notiPedidoCliente", async (req, res) => {
  const cliente_id = parseInt(req.query.cliente_id, 10);

  if (isNaN(cliente_id)) {
    return res.status(400).json({ error: "Parámetro 'cliente_id' inválido" });
  }

  

  try {
    const result = await db.query(
      `
      SELECT 
        id_pedido,
        cliente_id,
        estado,
        fecha_pedido
      FROM pedidos
      WHERE eliminado = false
        AND cliente_id = $1
        AND estado = 'En proceso'
      `,
      [cliente_id] 
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener notificaciones del cliente:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/:cliente_id", async (req, res) => {
  const { cliente_id } = req.params;

  const estadosQuery = req.query.estados || '';
  const estados = estadosQuery.split(',').filter(Boolean);

  if (estados.length === 0) {
    return res.json([]);
  }

  try {
    const result = await db.query(
      `
      SELECT
        p.id_pedido,
        p.fecha_pedido,
        p.estado,
        (SELECT SUM(pp.subtotal) FROM pedido_productos pp WHERE pp.id_pedido = p.id_pedido) AS total
      FROM
        pedidos p
      WHERE
        p.cliente_id = $1 AND p.estado = ANY($2::text[])
        AND p.eliminado = FALSE
      ORDER BY
        p.fecha_pedido DESC;
    `,
      [cliente_id, estados]
    );
    res.json(result.rows || []);
  } catch (error) {
    console.error("Error al obtener pedidos del cliente en el backend:", error);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
});


/*
RUTA GET: OBTENER PRODUCTOS DE UN PEDIDO ESPECÍFICO
Obtiene todos los productos asociados a un pedido específico de un cliente,
incluyendo ID del producto, nombre y cantidad.
*/
router.get("/:id_pedido/:cliente_id", async (req, res) => {
  const { id_pedido, cliente_id } = req.params;
  try {
    const result = await db.query(
      `
      SELECT
        pp.id_producto,
        p.nombre,
        pp.cantidad
      FROM pedido_productos pp
      JOIN productos p ON pp.id_producto = p.id_producto
      JOIN pedidos pe ON pp.id_pedido = pe.id_pedido
      WHERE pp.id_pedido = $1 AND pe.cliente_id = $2 AND pe.eliminado = FALSE
    `,
      [id_pedido, cliente_id]
    );
    res.json(result.rows || []);
  } catch (error) {
    console.error("Error al obtener productos del pedido:", error);
    res.status(500).json({ error: "Error al obtener productos del pedido" });
  }
});

/*
RUTA GET: OBTENER DETALLE COMPLETO DE UN PRODUCTO EN UN PEDIDO
Obtiene información detallada de un producto específico dentro de un pedido,
incluyendo datos del producto, precio, cantidad, subtotal e imagen multimedia.
*/

router.get("/:id_pedido/:id_producto/:cliente_id", async (req, res) => {
  const { id_pedido, id_producto, cliente_id } = req.params;
  try {
    const result = await db.query(
      `
      SELECT DISTINCT ON (p.id_producto)
        p.nombre,
        p.marca,
        p.descripcion,
        pp.precio,        
        pp.cantidad,      
        pp.subtotal,      
        m.img_video,      
        m.tipo_archivo   
      FROM
          public.pedidos ped
      JOIN
          public.pedido_productos pp ON ped.id_pedido = pp.id_pedido
      JOIN
          public.productos p ON pp.id_producto = p.id_producto

      LEFT JOIN
          public.producto_multimedia pm ON p.id_producto = pm.producto_id
      LEFT JOIN
          public.multimedia m ON pm.multimedia_id = m.id_multimedia
      WHERE
          ped.id_pedido = $1
          AND pp.id_producto = $2
          AND ped.cliente_id = $3
          AND p.eliminado = FALSE 
      ORDER BY
          p.id_producto,

          CASE
              WHEN m.tipo_asociacion = 'principal' THEN 1
              ELSE 2
          END,
          m.id_multimedia; 
    `,
      [id_pedido, id_producto, cliente_id]
    );

    const producto = result.rows[0];
    if (!producto) {
      return res.json({});
    }
    if (producto.img_video) {
      const tipoArchivo = producto.tipo_archivo || 'image/jpeg';
      producto.img_video = `data:${tipoArchivo};base64,${producto.img_video.toString("base64")}`;
    }
    res.json(producto);

  } catch (error) {
    console.error("Error al obtener detalle del producto:", error);
    res.status(500).json({ error: "Error al obtener detalle del producto" });
  }
});


/*
RUTA POST: CREAR UN PEDIDO CON PRODUCTOS ASOCIADOS
Crea un nuevo pedido con productos asociados usando transacciones.
Recibe cliente_id, comentarios y un arreglo de productos con sus cantidades y precios.
*/
router.post("/crear", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const { cliente_id, comentarios, productos, id_bodega } = req.body;

    if (!cliente_id || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: "Datos incompletos o inválidos" });
    }

    const fecha_pedido = new Date();

    const pedidoResult = await client.query(
      `INSERT INTO pedidos (cliente_id, fecha_pedido, comentarios, eliminado, estado, bodega_id)
   VALUES ($1, $2, $3, false, 'En proceso', $4)
   RETURNING id_pedido`,
      [cliente_id, fecha_pedido, comentarios || null, id_bodega]
    );
    const id_pedido = pedidoResult.rows[0].id_pedido;

    let montoTotal = 0;

    for (const producto of productos) {
      const { id_producto, cantidad, precio } = producto;
      if (!id_producto || !cantidad || !precio) {
        throw new Error("Producto inválido en la lista");
      }
      const subtotal = cantidad * precio;

      montoTotal += subtotal;

      await client.query(
        `INSERT INTO pedido_productos (id_pedido, id_producto, cantidad, precio, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [id_pedido, id_producto, cantidad, precio, subtotal]
      );
    }
    await client.query(
      `UPDATE pedidos SET total = $1 WHERE id_pedido = $2`,
      [montoTotal, id_pedido]
    );
    await client.query("COMMIT");
    res.status(201).json({ mensaje: "Pedido creado correctamente", id_pedido });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al crear pedido:", error);
    res.status(500).json({ error: "Error al crear el pedido" });
  } finally {
    client.release();
  }
});




module.exports = router;