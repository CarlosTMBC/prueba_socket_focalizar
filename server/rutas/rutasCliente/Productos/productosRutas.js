/*
RUTAS DE PRODUCTOS CLIENTE - server\rutas\rutasCliente\Productos\productosRutas.js
Este archivo contiene las rutas para consultar productos, productos por categoría,
nueva colección y el producto más vendido, incluyendo imágenes en base64.
CORREGIDO: Ahora todas las rutas filtran por productos con stock disponible.
*/

/*
IMPORTACIONES Y CONFIGURACIÓN
*/
const express = require("express");//Framework web para Node.js
const db = require("../../../conexion"); // Conexión a la base de datos
const router = express.Router();//Router de Express para definir rutas

// ✅ CONSULTA BASE PARA VERIFICAR STOCK - ELIMINADA
// const STOCK_JOIN = `
//   INNER JOIN bodega_producto bp ON p.id_producto = bp.producto_id
//   INNER JOIN bodega_stock bs ON bs.bodega_producto_id = bp.id
// `;

// const STOCK_CONDITION = `AND bs.stock_actual > 0`;

/*
RUTA GET: OBTENER TODOS LOS PRODUCTOS (ORDEN ALEATORIO)
✅ CORREGIDO: Ahora solo muestra productos con stock disponible
*/
router.get("/", async (req, res) => {
  try {
    const resultado = await db.query(`
      SELECT * FROM (
        SELECT DISTINCT ON (p.id_producto)
          p.id_producto,
          p.nombre AS nombre_producto,
          p.descripcion,
          p.precio_venta,
          p.precio_descuento,
          p.marca,
          p.fecha_de_vencimiento,
          m.img_video,
          m.tipo_archivo,
          td.porcentaje,
          CASE 
            WHEN td.porcentaje IS NOT NULL THEN 'porcentaje'
            WHEN td.monto_fijo IS NOT NULL THEN 'monto'
            ELSE NULL
          END AS tipo_descuento
        FROM productos p
        INNER JOIN bodega_producto bp ON p.id_producto = bp.producto_id
        INNER JOIN bodega_stock bs ON bs.bodega_producto_id = bp.id
        LEFT JOIN producto_multimedia pm ON p.id_producto = pm.producto_id
        LEFT JOIN multimedia m ON m.id_multimedia = pm.multimedia_id AND m.tipo_asociacion = 'principal'
        LEFT JOIN aplicaciones_descuento ad ON ad.id_producto = p.id_producto
        LEFT JOIN tipos_descuento td ON ad.id_tipo_descuento = td.id_tipo_descuento
        WHERE 
          p.eliminado = FALSE
          AND bs.stock_actual > 0
        ORDER BY p.id_producto, pm.multimedia_id ASC 
      ) AS final_results
      ORDER BY RANDOM();
    `);

    const productosConImagen = resultado.rows.map((producto) => ({
      id_producto: producto.id_producto,
      nombre: producto.nombre_producto,
      descripcion: producto.descripcion,
      precio_venta: parseFloat(producto.precio_venta),
      precio_descuento: parseFloat(producto.precio_descuento),
      marca: producto.marca,
      fecha_de_vencimiento: producto.fecha_de_vencimiento,
      porcentaje: parseFloat(producto.porcentaje) || null,
      tipo_descuento: producto.tipo_descuento || null,
      img_video: producto.img_video
        ? `data:${producto.tipo_archivo};base64,${producto.img_video.toString("base64")}`
        : null,
    }));

    res.json(productosConImagen);

  } catch (error) {
    console.error("Error al consultar BD:", error);
    res.status(500).json({ error: "Error interno al obtener productos aleatorios" });
  }
});

/*
RUTA GET: OBTENER PRODUCTOS POR CATEGORÍA
✅ CORREGIDO: Ahora solo muestra productos con stock disponible
*/
router.get("/categoria/:id", async (req, res) => {
  const categoriaId = parseInt(req.params.id);

  try {
    const resultado = await db.query(`
      SELECT DISTINCT ON (p.id_producto)
        p.id_producto,
        p.nombre,
        p.descripcion,
        p.precio_venta,
        p.precio_descuento,
        p.marca,
        p.categoria_id,
        m.img_video,
        m.tipo_archivo,
        td.porcentaje,       
        CASE 
          WHEN td.porcentaje IS NOT NULL THEN 'porcentaje'
          WHEN td.monto_fijo IS NOT NULL THEN 'monto'
        END AS tipo_descuento
      FROM 
        productos p
      INNER JOIN bodega_producto bp ON p.id_producto = bp.producto_id
      INNER JOIN bodega_stock bs ON bs.bodega_producto_id = bp.id
      LEFT JOIN 
        producto_multimedia pm ON p.id_producto = pm.producto_id
      LEFT JOIN 
        multimedia m ON pm.multimedia_id = m.id_multimedia AND m.tipo_asociacion = 'principal'
      LEFT JOIN aplicaciones_descuento ad ON ad.id_producto = p.id_producto
      LEFT JOIN tipos_descuento td ON ad.id_tipo_descuento = td.id_tipo_descuento
      WHERE 
        p.categoria_id = $1
        AND p.eliminado = FALSE
        AND bs.stock_actual > 0
      ORDER BY p.id_producto DESC, pm.multimedia_id ASC
    `, [categoriaId]);

    const productosConImagen = resultado.rows.map((producto) => ({
      ...producto, 
      precio_descuento: parseFloat(producto.precio_descuento),
      porcentaje: parseFloat(producto.porcentaje) || null,
      tipo_descuento: producto.tipo_descuento || null,
      img_video: producto.img_video
        ? `data:${producto.tipo_archivo};base64,${producto.img_video.toString("base64")}`
        : null,
    }));

    res.json(productosConImagen);
  } catch (error) {
    console.error("❌ Error al obtener productos por categoría:", error);
    res.status(500).json({ error: "Error interno al obtener productos relacionados" });
  }
});

/*
RUTA GET: OBTENER NUEVA COLECCIÓN DE PRODUCTOS
✅ CORREGIDO: Ahora solo muestra productos con stock disponible
*/
router.get("/nuevaColeccion", async (req, res) => {
  try {
    const resultado = await db.query(`
      SELECT DISTINCT ON (p.id_producto)
        p.id_producto,
        p.nombre,
        p.descripcion,
        p.precio_venta,
        p.precio_descuento,
        p.marca,
        m.img_video,
        m.nombre_archivo,
        m.tipo_archivo,
        td.porcentaje,
        CASE 
          WHEN td.porcentaje IS NOT NULL THEN 'porcentaje'
          WHEN td.monto_fijo IS NOT NULL THEN 'monto'
        END AS tipo_descuento
      FROM productos p
      INNER JOIN bodega_producto bp ON p.id_producto = bp.producto_id
      INNER JOIN bodega_stock bs ON bs.bodega_producto_id = bp.id
      LEFT JOIN producto_multimedia pm ON p.id_producto = pm.producto_id
      LEFT JOIN multimedia m ON pm.multimedia_id = m.id_multimedia AND m.tipo_asociacion = 'principal'
      LEFT JOIN aplicaciones_descuento ad ON ad.id_producto = p.id_producto
      LEFT JOIN tipos_descuento td ON ad.id_tipo_descuento = td.id_tipo_descuento
      WHERE p.eliminado = FALSE
        AND bs.stock_actual > 0
      ORDER BY p.id_producto DESC, pm.multimedia_id ASC
      LIMIT 10
    `);

    const productosConImagen = resultado.rows.map((producto) => ({
      ...producto,
      precio_descuento: parseFloat(producto.precio_descuento),
      porcentaje: parseFloat(producto.porcentaje) || null,
      tipo_descuento: producto.tipo_descuento || null,
      img_video: producto.img_video
        ? `data:${producto.tipo_archivo};base64,${producto.img_video.toString("base64")}`
        : null,
    }));

    res.json(productosConImagen);

  } catch (error) {
    console.error("Error al consultar nueva colección:", error);
    res.status(500).json({ error: "Error interno al obtener productos nuevos" });
  }
});

/*
RUTA GET: OBTENER PRODUCTO MÁS VENDIDO
✅ CORREGIDO: Ahora solo considera productos con stock disponible
*/
router.get("/MasVendido", async (req, res) => {
  try {
    const resultado = await db.query(`
      SELECT DISTINCT ON (p.id_producto)
        p.id_producto,
        p.nombre,
        p.descripcion,
        p.precio_venta,
        p.precio_descuento,
        p.marca,
        SUM(pp.cantidad) AS total_vendido,
        m.img_video,
        m.tipo_archivo
      FROM 
        pedido_productos pp
      JOIN 
        productos p ON p.id_producto = pp.id_producto
      INNER JOIN bodega_producto bp ON p.id_producto = bp.producto_id
      INNER JOIN bodega_stock bs ON bs.bodega_producto_id = bp.id
      LEFT JOIN 
        producto_multimedia pm ON pm.producto_id = p.id_producto
      LEFT JOIN 
        multimedia m ON m.id_multimedia = pm.multimedia_id AND m.tipo_asociacion = 'principal'
      WHERE p.eliminado = FALSE
        AND bs.stock_actual > 0
      GROUP BY 
        p.id_producto, m.img_video, m.tipo_archivo, pm.multimedia_id
      ORDER BY 
        p.id_producto, pm.multimedia_id ASC, total_vendido DESC
      LIMIT 1
    `);

    const productosConImagen = resultado.rows.map((producto) => ({
      id_producto: producto.id_producto,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio_venta: parseFloat(producto.precio_venta),
      precio_descuento: parseFloat(producto.precio_descuento),
      marca: producto.marca,
      total_vendido: parseInt(producto.total_vendido) || 0,
      img_video: producto.img_video
        ? `data:${producto.tipo_archivo};base64,${producto.img_video.toString("base64")}`
        : null,
    }));

    res.json(productosConImagen);
  } catch (error) {
    console.error("Error al obtener el producto más vendido:", error);
    res.status(500).json({ error: "Error interno al obtener producto más vendido" });
  }
});

// Búsqueda avanzada de productos para clientes
// ✅ CORREGIDO: Ahora solo muestra productos con stock disponible
router.get("/buscar-avanzado", async (req, res) => {
  try {
    const { termino, marca, categoria, precioMin, precioMax } = req.query;

    let query = `
      SELECT DISTINCT p.*
      FROM productos p
      INNER JOIN bodega_producto bp ON p.id_producto = bp.producto_id
      INNER JOIN bodega_stock bs ON bs.bodega_producto_id = bp.id
      WHERE p.eliminado = FALSE
      AND bs.stock_actual > 0
    `;
    const params = [];

    if (termino) {
      params.push(`%${termino}%`);
      query += ` AND (p.nombre ILIKE ${params.length} OR p.descripcion ILIKE ${params.length} OR p.marca ILIKE ${params.length})`;
    }

    if (marca) {
      params.push(marca);
      query += ` AND p.marca ILIKE ${params.length}`;
    }

    if (categoria) {
      params.push(categoria);
      query += ` AND CAST(p.categoria_id AS TEXT) = ${params.length}`;
    }

    if (precioMin) {
      params.push(precioMin);
      query += ` AND p.precio_venta >= ${params.length}`;
    }

    if (precioMax) {
      params.push(precioMax);
      query += ` AND p.precio_venta <= ${params.length}`;
    }

    query += ` ORDER BY p.id_producto ASC`;

    const result = await db.query(query, params);
    const productos = result.rows.map((producto) => ({
      ...producto,
      precio_descuento: parseFloat(producto.precio_descuento),
    }));

    res.json(productos);
  } catch (error) {
    console.error("Error en /buscar-avanzado:", error);
    res.status(500).json({ error: "Error al buscar productos" });
  }
});

router.get("/imagenes/:id", async (req, res) => {
  const productoId = parseInt(req.params.id);

  try {
    const resultado = await db.query(
      `SELECT 
        p.id_producto,
        p.nombre,
        m.img_video,
        m.nombre_archivo,
        m.tipo_archivo,
        m.tipo_asociacion,
        pm.multimedia_id
      FROM 
        productos p
      LEFT JOIN 
        producto_multimedia pm ON p.id_producto = pm.producto_id
      LEFT JOIN 
        multimedia m ON pm.multimedia_id = m.id_multimedia
      WHERE 
        p.id_producto = $1 
        AND m.img_video IS NOT NULL
        AND m.eliminado = FALSE
      ORDER BY 
        CASE WHEN m.tipo_asociacion = 'principal' THEN 0 ELSE 1 END,
        pm.multimedia_id ASC`,
      [productoId]
    );

    // 🚀 Convertir todas las imágenes a base64
    const imagenesProducto = resultado.rows.map((imagen, index) => ({
      id: imagen.multimedia_id || index,
      img_video: `data:${imagen.tipo_archivo};base64,${imagen.img_video.toString("base64")}`,
      nombre_archivo: imagen.nombre_archivo,
      tipo_archivo: imagen.tipo_archivo,
      es_principal: imagen.tipo_asociacion === 'principal'
    }));

    // Si no hay imágenes, devolver array vacío
    if (imagenesProducto.length === 0) {
      return res.json([]);
    }

    res.json(imagenesProducto);
  } catch (error) {
    console.error("❌ Error al obtener imágenes del producto:", error);
    res.status(500).json({ error: "Error interno al obtener imágenes del producto" });
  }
});

// ✅ NUEVA FUNCIÓN: Obtener stock de producto por bodegas
router.get("/stock/:id", async (req, res) => {
  const productoId = parseInt(req.params.id);

  try {
    const resultado = await db.query(`
SELECT 
    p.id_producto,
    p.nombre AS nombre_producto,
    b.id_bodega,
    b.nombre AS nombre_bodega,
    b.ubicacion,
    b.telefono,
    bs.stock_actual,
    CASE 
        WHEN bs.stock_actual > 10 THEN 'Alto'
        WHEN bs.stock_actual > 5 THEN 'Medio'
        WHEN bs.stock_actual > 0 THEN 'Bajo'
        ELSE 'Agotado'
    END AS nivel_stock
FROM productos p
JOIN bodega_producto bp ON p.id_producto = bp.producto_id
JOIN bodegas b ON bp.bodega_id = b.id_bodega
JOIN bodega_stock bs ON bp.id = bs.bodega_producto_id
WHERE p.id_producto = $1 
    AND p.eliminado = FALSE 
  
ORDER BY bs.stock_actual DESC, b.nombre ASC;
    `, [productoId]);

    if (resultado.rows.length === 0) {
      return res.json([]);
    }

    // Formatear la respuesta
    const stockPorBodegas = resultado.rows.map((fila) => ({
      id_bodega: fila.id_bodega,
      nombre_bodega: fila.nombre_bodega,
      ubicacion: fila.ubicacion,
      telefono: fila.telefono,
      direccion: fila.direccion,
      stock_actual: parseInt(fila.stock_actual) || 0,
      nivel_stock: fila.nivel_stock,
      disponible: parseInt(fila.stock_actual) > 0
    }));

    res.json(stockPorBodegas);

  } catch (error) {
    console.error("❌ Error al obtener stock por bodegas:", error);
    res.status(500).json({ error: "Error interno al obtener stock del producto" });
  }
});

/*
RUTA GET: OBTENER UN PRODUCTO ESPECÍFICO POR SU ID
Obtiene los detalles actuales de un producto, incluyendo precios y la imagen principal.
*/
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      `
      SELECT
        p.id_producto, p.nombre, p.descripcion, p.marca,
        p.precio_venta, p.precio_descuento,
        (SELECT m.img_video 
         FROM multimedia m 
         JOIN producto_multimedia pm ON m.id_multimedia = pm.multimedia_id
         WHERE pm.producto_id = p.id_producto AND m.tipo_asociacion = 'principal'
         LIMIT 1) as img_video_buffer,
        (SELECT m.tipo_archivo
         FROM multimedia m 
         JOIN producto_multimedia pm ON m.id_multimedia = pm.multimedia_id
         WHERE pm.producto_id = p.id_producto AND m.tipo_asociacion = 'principal'
         LIMIT 1) as tipo_archivo
      FROM productos p
WHERE p.id_producto = $1 AND p.eliminado = FALSE
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado o no disponible." });
    }

    const producto = result.rows[0];
    if (producto.img_video_buffer) {
      producto.img_video = `data:${producto.tipo_archivo || 'image/jpeg'};base64,${producto.img_video_buffer.toString("base64")}`;
    }
    delete producto.img_video_buffer;
    delete producto.tipo_archivo;

    res.json(producto);
  } catch (error) {
    console.error("Error al obtener producto por ID:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;