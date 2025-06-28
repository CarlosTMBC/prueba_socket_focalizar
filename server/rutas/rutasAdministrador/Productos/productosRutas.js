/*
RUTAS DE PRODUCTOS - rutasProductos.js
Este archivo contiene las rutas para gestionar productos (obtener, registrar, actualizar, buscar)
mediante endpoints REST que interactúan con la base de datos.
*/

/*
IMPORTACIONES Y CONFIGURACIÓN
*/
const express = require("express");//Framework web para Node.js
const router = express.Router();//Router de Express para definir rutas
const db = require("../../../conexion"); // Conexión a la base de datos

/*
RUTA GET: OBTENER TODOS LOS PRODUCTOS
Realiza una consulta a la base de datos para obtener todos los registros
de la tabla productos y devolverlos como un arreglo en formato JSON.
*/
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM productos ORDER BY id_producto ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

/**
 * GET /productos/:bpId
 * Devuelve la información completa de un producto
 * dentro de una bodega (usando bodega_producto.id = bpId).
 */
router.get("/:bpId", async (req, res) => {
  const bpId = parseInt(req.params.bpId, 10);
  if (isNaN(bpId) || bpId <= 0) {
    return res
      .status(400)
      .json({ success: false, mensaje: "ID inválido." });
  }

  try {
    const result = await db.query(
      `
      SELECT
        bp.id                 AS bodega_producto_id,
        p.id_producto,
        p.nombre,
        p.descripcion,
        p.precio_venta,
        p.categoria_id,
        p.marca,
        p.id_proveedor,
        p.fecha_de_vencimiento,
        p.precio_descuento,
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
      WHERE bp.id = $1
      `,
      [bpId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, mensaje: "Producto en bodega no encontrado." });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(`Error al obtener detalle bpId=${bpId}:`, error);
    return res
      .status(500)
      .json({ success: false, mensaje: "Error interno al obtener detalle." });
  }
});


/*
RUTA POST: REGISTRAR LOS PRODUCTOS
Registra un nuevo producto en la base de datos.
Recibe los datos del producto y llama a un procedimiento almacenado
para realizar la inserción.
*/
router.post("/productos", async (req, res) => {
  const {
    nombre,
    descripcion,
    precio_venta,
    categoria_id,
    marca,
    fecha_de_vencimiento,
    precio_descuento
  } = req.body;

  try {
    console.log("Recibiendo solicitud para insertar producto:", req.body);
    
    // Llamada al procedimiento almacenado
    await db.query(
      `CALL insertar_productos($1, $2, $3, $4, $5, $6, $7)`,
      [
        nombre, 
        descripcion, 
        precio_venta, 
        categoria_id, 
        marca, 
        fecha_de_vencimiento || null, // Asegurarse de que las fechas vacías sean null
        precio_descuento || null
      ]
    );
    
    res.status(201).json({ message: "Producto registrado exitosamente" });
  } catch (error) {
    console.error("Error detallado al registrar producto:", error);
    // Enviando el mensaje de error completo para debugging
    res.status(500).json({ 
      error: "Error al registrar producto", 
      details: error.message,
      stack: error.stack 
    });
  }
});

/*
RUTA PUT: ACTUALIZAR PRODUCTO
Actualiza un producto existente en la base de datos.
Recibe el ID del producto a actualizar y los nuevos datos del producto.
*/
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      precio_venta,
      categoria_id,
      marca,
      id_proveedor,
      fecha_de_vencimiento,
      precio_descuento
    } = req.body;

    const result = await db.query(
      `UPDATE productos SET 
        nombre = $1, 
        descripcion = $2, 
        precio_venta = $3, 
        categoria_id = $4, 
        marca = $5, 
        id_proveedor = $6, 
        fecha_de_vencimiento = $7, 
        precio_descuento = $8 
      WHERE id_producto = $9 
      RETURNING *`,
      [
        nombre, 
        descripcion, 
        precio_venta, 
        categoria_id, 
        marca, 
        id_proveedor, 
        fecha_de_vencimiento || null, 
        precio_descuento || null, 
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
});

/*
RUTA GET: BUSCAR POR FILTROS
Busca productos en la base de datos según los criterios de búsqueda proporcionados.
Permite buscar por diferentes campos y devolver los resultados en formato JSON.
*/
router.get("/buscar", async (req, res) => {
  try {
    const { query, campo } = req.query;
    
    let consulta;
    let parametros;

    if (!query) {
      // Si no hay consulta, devolver todos los productos
      return res.redirect("/");
    }

    if (campo && campo !== "todos") {
      // Búsqueda por campo específico
      const columna = campo === "id" 
        ? "id_producto" 
        : campo === "precio" 
          ? "precio_venta" 
          : campo === "fecha" 
            ? "fecha_de_vencimiento" 
            : campo;
            
      consulta = `SELECT * FROM productos WHERE CAST(${columna} AS TEXT) ILIKE $1 ORDER BY id_producto ASC`;
      parametros = [`%${query}%`];
    } else {
      // Búsqueda en todos los campos
      consulta = `
        SELECT * FROM productos 
        WHERE 
          CAST(id_producto AS TEXT) ILIKE $1 OR 
          nombre ILIKE $1 OR 
          descripcion ILIKE $1 OR 
          CAST(precio_venta AS TEXT) ILIKE $1 OR 
          CAST(categoria_id AS TEXT) ILIKE $1 OR 
          marca ILIKE $1 OR 
          CAST(id_proveedor AS TEXT) ILIKE $1 OR
          CAST(fecha_de_vencimiento AS TEXT) ILIKE $1 OR
          CAST(precio_descuento AS TEXT) ILIKE $1
        ORDER BY id_producto ASC
      `;
      parametros = [`%${query}%`];
    }

    const result = await db.query(consulta, parametros);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al buscar productos:", error);
    res.status(500).json({ error: "Error al buscar productos" });
  }
});

module.exports = router;