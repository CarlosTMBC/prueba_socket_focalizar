/*
RUTAS DE CATEGORÍAS - categoriasRutas.js
Este archivo contiene las rutas para gestionar categorías (obtener, crear, actualizar y eliminar)
mediante endpoints REST que interactúan con la base de datos.
*/

/*
IMPORTACIONES Y CONFIGURACIÓN
*/
const express = require('express');//Framework web para Node.js
const router = express.Router();//Router de Express para definir rutas
const db = require('../../../conexion'); // Conexión a la base de datos

/*
RUTA GET: OBTENER TODAS LAS CATEGORÍAS
Obtiene las categorías almacenadas en la base de datos y
retorna un arreglo con objetos que representan cada categoría.
*/
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM categorias');
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

/*
RUTA POST: CREAR NUEVA CATEGORÍA
Registra una nueva categoria en la base de datos.
Requiere nombre y descripción en el cuerpo de la solicitud.
Valida que los campos no estén vacíos antes de insertarlos.
*/
router.post('/', async (req, res) => {
  const { nombre, descripcion } = req.body;
  
  // Validación de los campos requeridos
  if (!nombre || !descripcion) {
    return res.status(400).json({ error: 'Nombre y descripción son obligatorios' });
  }
  
  try {
    const result = await db.query(
      'CALL insertar_categorias ($1, $2)',
      [nombre, descripcion]
    );
    
    res.status(201).json({ mensaje: "Categoría creada exitosamente" });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ error: 'Error al crear categoría', detalle: error.message });
  }
});

/*
RUTA PUT: ACTUALIZAR CATEGORÍA
Actualiza una categoría existente mediante su ID.
Requiere nombre y descripción en el cuerpo de la solicitud.
*/
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;
  
  const idCat = parseInt(id, 10);
  
  if (isNaN(idCat) || idCat <= 0) {
    return res.status(400).json({ error: "ID de categoría inválido" });
  }
  
  // Validación de datos requeridos
  if (!nombre || !descripcion) {
    return res.status(400).json({ error: "Nombre y descripción son obligatorios" });
  }
  
  try {
    const result = await db.query(`CALL actualizar_categorias($1, $2, $3)`, [idCat, nombre.trim(), descripcion.trim()]);
    
    res.status(200).json({ mensaje: "Categoría actualizada exitosamente" });
    
  } catch (error) {
    console.error("Error al actualizar categoría:", error);
    res.status(500).json({ 
      error: "Error al actualizar categoría", 
      detalle: error.message
    });
  }
});

/*
RUTA DELETE: ELIMINAR CATEGORÍA
Elimina una categoría de la base de datos mediante su ID.
Utiliza eliminación física (DELETE) en lugar de lógica.
*/
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  
  const idCat = parseInt(id, 10);
  
  if (isNaN(idCat) || idCat <= 0) {
    return res.status(400).json({ error: "ID de categoría inválido" });
  }
  
  try {
    const result = await db.query(`DELETE FROM categorias WHERE id_categoria = $1`, [idCat]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }
    
    res.status(200).json({ mensaje: "Categoría eliminada exitosamente" });
    
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    res.status(500).json({ 
      error: "Error al eliminar categoría", 
      detalle: error.message
    });
  }
});

module.exports = router;