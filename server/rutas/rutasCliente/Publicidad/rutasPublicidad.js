/*
RUTAS DE API MULTIMEDIA - apiMultimedia.js
Este archivo contiene las rutas para obtener imágenes del carrusel.
*/

/*
IMPORTACIONES Y CONFIGURACIÓN
*/
const express = require("express");//Framework web para Node.js
const router = express.Router();//Router de Express para definir rutas
const db = require("../../../conexion");//Conexión a la base de datos

/*
RUTA GET: OBTENER IMÁGENES DEL CARRUSEL
Obtiene las imágenes del carrusel desde la base de datos.
Convierte las imágenes a base64 para enviarlas listas al frontend.
*/
router.get("/imagenesCarrusel", async (req, res) => {
  try {
    const resultado = await db.query(
      `SELECT 
        m.img_video,
        m.tipo_archivo,
        m.nombre_archivo
      FROM 
        multimedia m
      WHERE 
        m.destino = 'CarruselHome'
        AND m.eliminado = false
    `
    );

    const imagenes = resultado.rows.map((img) => ({
      nombre: img.nombre_archivo,
      tipo_archivo: img.tipo_archivo,
      uri: img.img_video
        ? `data:${img.tipo_archivo};base64,${img.img_video.toString("base64")}`
        : null,
    }));

    res.json(imagenes);
  } catch (error) {
    console.error("Error al obtener imágenes del carrusel:", error);
    res.status(500).json({ error: "Error interno al obtener imágenes" });
  }
});

module.exports = router;