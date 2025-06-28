/*
RUTAS DE PRODUCTOS CLIENTE - rutasProductosCliente.js
Este archivo contiene las rutas para que los clientes puedan consultar productos,
incluyendo búsqueda por categoría, búsqueda con términos y obtención de detalles específicos.
*/

/*
IMPORTACIONES Y CONFIGURACIÓN
*/
const express = require("express");//Framework web para Node.js
const router = express.Router();//Router de Express para definir rutas
const db = require("../../../conexion");//Conexión a la base de datos

/*
RUTA GET: OBTENER PRODUCTOS POR CATEGORÍA
Obtiene todos los productos que pertenecen a una categoría específica.
Incluye información multimedia asociada a cada producto.
Convierte las imágenes binarias a formato base64 para su visualización.
*/

router.get("/categoria/:categoriaId", async (req, res) => {
    const { categoriaId } = req.params;

    if (!categoriaId || isNaN(parseInt(categoriaId))) {
        return res.status(400).json({ error: "ID de categoría inválido" });
    }

    try {
        const query = `
            SELECT 
                p.id_producto,
                p.nombre AS nombre_producto,
                p.descripcion,
                p.precio_venta,
                p.marca,
                p.fecha_de_vencimiento,
                p.precio_descuento,
                p.categoria_id,
                pm.multimedia_id,
                m.img_video,
                m.nombre_archivo,
                m.tipo_archivo
            FROM productos p
            LEFT JOIN producto_multimedia pm ON p.id_producto = pm.producto_id
            LEFT JOIN multimedia m ON pm.multimedia_id = m.id_multimedia
            WHERE p.categoria_id = $1
        `;

        const result = await db.query(query, [parseInt(categoriaId)]);

        const productos = result.rows.map(producto => {
            // Convertir imagen binaria a base64 si existe
            if (producto.img_video && Buffer.isBuffer(producto.img_video)) {
                producto.img_video = producto.img_video.toString('base64');
            } else {
                producto.img_video = null; 
            }
            return producto;
        });

        // Siempre devolver 200, incluso si array está vacío
        res.status(200).json(productos);

    } catch (error) {
        console.error("Error al obtener productos por categoría:", error);
        res.status(500).json({
            error: "Error al obtener productos por categoría",
            details: error.message,
        });
    }
});

/*
RUTA GET: BUSCAR PRODUCTOS EN UNA CATEGORÍA ESPECÍFICA
Busca productos dentro de una categoría específica usando un término de búsqueda.
Filtra por nombre, descripción o marca del producto.
*/
router.get("/buscar", async (req, res) => {
  const { categoria_id, termino } = req.query;

  if (!categoria_id || isNaN(parseInt(categoria_id))) {
    return res.status(400).json({ error: "ID de categoría inválido" });
  }

  if (!termino || !termino.trim()) {
    return res.redirect(`/productos-cliente/categoria/${categoria_id}`);
  }

  try {
    const query = `
      SELECT 
        p.id_producto,
        p.nombre AS nombre_producto,
        p.descripcion,
        p.precio_venta,
        p.marca,
        p.fecha_de_vencimiento,
        p.precio_descuento,
        pm.multimedia_id,
        m.img_video,
        m.nombre_archivo,
        m.tipo_archivo
      FROM productos p
      LEFT JOIN producto_multimedia pm ON p.id_producto = pm.producto_id
      LEFT JOIN multimedia m ON pm.multimedia_id = m.id_multimedia
      WHERE p.categoria_id = $1
    `;
    const result = await db.query(query, [parseInt(categoria_id)]);

    const filtrados = result.rows.filter(
      (producto) =>
        producto.nombre_producto
          .toLowerCase()
          .includes(termino.toLowerCase()) ||
        (producto.descripcion &&
          producto.descripcion.toLowerCase().includes(termino.toLowerCase())) ||
        (producto.marca &&
          producto.marca.toLowerCase().includes(termino.toLowerCase()))
    );

    res.json(filtrados);
  } catch (error) {
    console.error("Error al buscar productos:", error);
    res.status(500).json({
      error: "Error al buscar productos",
      details: error.message,
    });
  }
});

/*
RUTA GET: OBTENER DETALLES DE UN PRODUCTO ESPECÍFICO
Obtiene información detallada de un producto específico por su ID.
Incluye información multimedia y convierte las imágenes a formato Data URL.
*/
router.get("/producto/:productoId", async (req, res) => {
  const { productoId } = req.params;

  if (!productoId || isNaN(parseInt(productoId))) {
    return res.status(400).json({ error: "ID de producto inválido" });
  }

  try {
    const query = `
      SELECT 
        p.id_producto,
        p.nombre AS nombre_producto,
        p.descripcion,
        p.precio_venta,
        p.marca,
        p.fecha_de_vencimiento,
        p.precio_descuento,
        pm.multimedia_id,
        m.img_video,
        m.nombre_archivo,
        m.tipo_archivo
      FROM productos p
      LEFT JOIN producto_multimedia pm ON p.id_producto = pm.producto_id
      LEFT JOIN multimedia m ON pm.multimedia_id = m.id_multimedia
      WHERE p.id_producto = $1
    `;
    const result = await db.query(query, [parseInt(productoId)]);

    if (result.rows.length > 0) {
      const producto = result.rows[0];

      // Si img_video es un buffer (bytea), convertirlo a Base64
      if (producto.img_video && Buffer.isBuffer(producto.img_video)) {
        const mimeType = producto.tipo_archivo || 'image/jpeg'; // Ajusta si usas otro formato
        producto.img_video = `data:${mimeType};base64,${producto.img_video.toString('base64')}`;
      }

      res.json(producto);
    } else {
      res.status(404).json({ error: "Producto no encontrado" });
    }
  } catch (error) {
    console.error("Error al obtener detalles del producto:", error);
    res.status(500).json({
      error: "Error al obtener detalles del producto",
      details: error.message,
    });
  }
});


// RUTA GET: Búsqueda avanzada con filtros múltiples
router.get("/buscar-avanzado", async (req, res) => {
  const { termino, categoria, producto, color } = req.query;
  const params = [];
  let query = `
    SELECT 
      p.id_producto,
      p.nombre AS nombre_producto,
      p.descripcion,
      p.precio_venta,
      p.marca,
      p.fecha_de_vencimiento,
      p.precio_descuento,
      p.categoria_id,
      pm.multimedia_id,
      m.img_video,
      m.nombre_archivo,
      m.tipo_archivo,
      p.color
    FROM productos p
    LEFT JOIN producto_multimedia pm ON p.id_producto = pm.producto_id
    LEFT JOIN multimedia m ON pm.multimedia_id = m.id_multimedia
    WHERE 1=1
  `;

  if (termino) {
    query += ` AND (p.nombre ILIKE $${params.length + 1} OR p.descripcion ILIKE $${params.length + 1} OR p.marca ILIKE $${params.length + 1})`;
    params.push(`%${termino}%`);
  }

  if (categoria) {
    query += ` AND p.categoria_id = $${params.length + 1}`;
    params.push(categoria);
  }

  if (producto) {
    query += ` AND p.nombre ILIKE $${params.length + 1}`;
    params.push(`%${producto}%`);
  }

  if (color) {
    query += ` AND p.color ILIKE $${params.length + 1}`;
    params.push(`%${color}%`);
  }

  try {
    const result = await db.query(query, params);
    const productos = result.rows.map(p => {
      if (p.img_video && Buffer.isBuffer(p.img_video)) {
        const mimeType = p.tipo_archivo || 'image/jpeg';
        p.img_video = `data:${mimeType};base64,${p.img_video.toString('base64')}`;
      }
      return p;
    });
    res.json(productos);
  } catch (error) {
    console.error("Error en búsqueda avanzada:", error);
    res.status(500).json({ error: "Error en búsqueda avanzada", details: error.message });
  }
});


module.exports = router;
