/*
RUTAS DE MULTIMEDIA - rutasMultimedia.js
Este archivo contiene las rutas para gestionar recursos multimedia (insertar y obtener)
mediante endpoints REST que interactúan con la base de datos.
Incluye manejo de archivos binarios (imágenes y videos) usando multer.
*/

/*
IMPORTACIONES Y CONFIGURACIÓN
*/
const express = require("express");//Framework web para Node.js
const router = express.Router();//Router de Express para definir rutas
const db = require("../../../../conexion"); // Conexión a la base de datos
const multer = require("multer");//Middleware para manejo de archivos multipart/form-data

/*
CONFIGURACIÓN DE MULTER
Se configura multer para almacenar los archivos en memoria y limitar el tamaño máximo a 10MB.
Solo se permiten archivos de tipo PNG, JPEG y MP4.
*/
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // límite 10MB
  },
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = ["image/png", "image/jpeg", "video/mp4", 'image/gif'];
    if (tiposPermitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Formato no permitido"), false);
    }
  },
});

/**
 * POST /
 * Inserta un nuevo recurso multimedia en la base de datos.
 * Recibe multipart/form-data:
 *  - img_video: el archivo binario (imagen o video)
 *  - tipo_archivo: MIME type del archivo (p.ej. "image/png")
 *  - nombre_archivo: nombre del archivo
 *  - tipo_asociacion: tipo de asociación (p.ej. "banner", "thumbnail")
 *  - destino: destino lógico o ruta de uso
 */
router.post(
  "/",
  upload.single("img_video"),
  async (req, res) => {
    try {
      const {
        tipo_archivo,
        nombre_archivo,
        tipo_asociacion,
        destino
      } = req.body;

      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ success: false, error: "No se recibió archivo" });
      }

      const buffer = req.file.buffer;

      const insertQuery = `CALL insertar_multimedia($1, $2, $3, $4, $5);`;
      const result = await db.query(insertQuery, [
        buffer,
        tipo_archivo,
        nombre_archivo,
        tipo_asociacion,
        destino
      ]);

      // ✅ AQUÍ ESTABA EL PROBLEMA: Faltaba retornar respuesta de éxito
      res.status(200).json({ 
        success: true, 
        message: "Multimedia insertada correctamente",
        data: result.rows // En caso de que el stored procedure retorne datos
      });

    } catch (error) {
      console.error("Error al insertar multimedia:", error);
      res.status(500).json({ success: false, error: "Error al insertar multimedia" });
    }
  }
);

/**
 * GET /
 * Obtiene todos los recursos multimedia almacenados.
 * Devuelve un arreglo con:
 *  - id_multimedia
 *  - nombre_archivo
 *  - tipo_archivo
 *  - tipo_asociacion
 *  - destino
 *  - data_base64: la imagen/video codificado en base64
 */
router.get("/", async (req, res) => {
  try {
    const selectQuery = `
      SELECT
        id_multimedia,
        nombre_archivo,
        tipo_archivo,
        tipo_asociacion,
        destino,
        encode(img_video, 'base64') AS data_base64
      FROM multimedia
      ORDER BY id_multimedia DESC
    `;
    const result = await db.query(selectQuery);
    res.json({ multimedia: result.rows });
  } catch (error) {
    console.error("Error al obtener multimedia:", error);
    res.status(500).json({ error: "Error al obtener multimedia" });
  }
});

module.exports = router;