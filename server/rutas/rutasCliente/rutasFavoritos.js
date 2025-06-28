/*
RUTAS DE FAVORITOS CLIENTE - rutasFavoritos.js
Este archivo contiene las rutas para gestionar productos favoritos de un cliente,
incluyendo agregar, obtener y eliminar favoritos.
*/

/*
IMPORTACIONES Y CONFIGURACIÓN
*/

const express = require("express");
const router = express.Router();
const db = require("../../conexion");
const { FavoritoModel } = require("../../../modelos/modelFavoritos");

/*
RUTA POST: AGREGAR PRODUCTO A FAVORITOS
Marca un producto como favorito para el cliente especificado.
Valida los datos y utiliza el modelo para validación antes de insertar en la base de datos.
*/
router.post("/:id_cliente", async (req, res) => {
  const { id_producto } = req.body;
  const id_cliente = req.params.id_cliente;

  console.log("ID de cliente:", id_cliente);
  console.log("ID de producto:", id_producto);

  if (!id_cliente || !id_producto) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  try {
    await FavoritoModel.crearFavoritoValidado(id_cliente, id_producto);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  try {
    await db.query("CALL insertar_favorito($1, $2)", [id_producto,id_cliente]);
    res.status(201).json({ mensaje: "Favorito agregado correctamente" });
  } catch (error) {
    console.error("Error al insertar favorito:", error);
    res.status(500).json({ error: "Error al crear favorito", detalle: error.message });
  }
});


/*
RUTA GET: OBTENER FAVORITOS POR CLIENTE
Obtiene la lista de productos favoritos de un cliente específico.
Incluye información del producto y la imagen en base64 si existe.
*/
router.get("/:cliente_id", async (req, res) => {
  const { cliente_id } = req.params;

  try {
  const resultado = await db.query(
  `SELECT DISTINCT ON (p.id_producto) 
    p.id_producto,
    p.nombre,
    p.descripcion,
    p.precio_venta,
    p.precio_descuento,
    p.marca,
    p.fecha_de_vencimiento,
    p.categoria_id,
    m.img_video,
    m.nombre_archivo,
    m.tipo_archivo
  FROM 
    favoritos f
  JOIN 
    productos p ON f.id_productos = p.id_producto
  LEFT JOIN 
    producto_multimedia pm ON p.id_producto = pm.producto_id
  LEFT JOIN 
    multimedia m ON pm.multimedia_id = m.id_multimedia
  WHERE 
    f.id_cliente = $1
  ORDER BY 
    p.id_producto, m.id_multimedia;`,
  [cliente_id]
);
    const productosConImagen = resultado.rows.map((producto) => ({
      ...producto,
      img_video: producto.img_video
        ? `data:${producto.tipo_archivo};base64,${producto.img_video.toString("base64")}`
        : null,
    }));

    res.json(productosConImagen);
  } catch (error) {
    console.error("Error al obtener favoritos por cliente:", error);
    res.status(500).json({ error: "Error al obtener favoritos" });
  }
});

/*
RUTA DELETE: ELIMINAR FAVORITO POR CLIENTE Y PRODUCTO
Elimina un producto de la lista de favoritos de un cliente específico.
*/
router.delete("/:id_cliente/:id_producto", async (req, res) => {
  const { id_cliente, id_producto } = req.params;

  if (!id_cliente || !id_producto) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }

  try {
    const resultado = await db.query(
      `DELETE FROM favoritos 
       WHERE id_cliente = $1 AND id_productos = $2`,
      [id_cliente, id_producto]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: "Favorito no encontrado" });
    }

    res.status(200).json({ mensaje: "Favorito eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar favorito:", error);
    res.status(500).json({ error: "Error al eliminar favorito", detalle: error.message });
  }
});


module.exports = router;
