// rutas/rutasAdministrador/Publicidad/Multimedia/rutasProductoMultimedia.js
const express = require("express");
const router = express.Router();
const db = require("../../../../conexion");

// Insertar asociación producto-multimedia
router.post("/productoMultimedia", async (req, res) => {
  const { id_publicidad, id_producto } = req.body;
  
  // Validar que se proporcionen ambos IDs
  if (!id_publicidad || !id_producto) {
    return res.status(400).json({ 
      error: "Se requieren id_publicidad e id_producto" 
    });
  }

  try {
    // Verificar si la asociación ya existe para evitar duplicados
    const existeAsociacion = await db.query(`
      SELECT * FROM producto_multimedia 
      WHERE producto_id = $1 AND multimedia_id = $2
    `, [id_producto, id_publicidad]);

    if (existeAsociacion.rows.length > 0) {
      return res.status(409).json({ 
        error: "Esta asociación ya existe",
        mensaje: "El producto ya tiene asociado este multimedia"
      });
    }

    // Insertar la nueva asociación
    const result = await db.query(`
      INSERT INTO producto_multimedia (producto_id, multimedia_id)
      VALUES ($1, $2)
      RETURNING *
    `, [id_producto, id_publicidad]);

    res.status(201).json({
      mensaje: "Asociación creada exitosamente",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error al insertar producto-multimedia:", error);
    
    // Manejar errores específicos de base de datos
    if (error.code === '23503') {
      return res.status(400).json({ 
        error: "Referencia inválida: el producto o multimedia no existe" 
      });
    }
    
    res.status(500).json({ 
      error: "Error interno del servidor al crear la asociación" 
    });
  }
});

// Eliminar asociación producto-multimedia
router.delete("/:multimedia_id/:producto_id", async (req, res) => {
  const { multimedia_id, producto_id } = req.params;
  
  try {
    const result = await db.query(`
      DELETE FROM producto_multimedia 
      WHERE multimedia_id = $1 AND producto_id = $2
      RETURNING *
    `, [multimedia_id, producto_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: "Asociación no encontrada" 
      });
    }

    res.json({ 
      mensaje: "Asociación eliminada exitosamente",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error al eliminar asociación:", error);
    res.status(500).json({ 
      error: "Error al eliminar la asociación" 
    });
  }
});

// ========== RUTAS DE MULTIMEDIA OPTIMIZADAS ==========

// Obtener solo las últimas 10 multimedia para productos (NUEVA RUTA OPTIMIZADA)
router.get("/multimedia/recientes", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id_multimedia,
        nombre_archivo,
        tipo_archivo,
        tipo_asociacion,
        destino
      FROM multimedia 
      WHERE eliminado = false 
      AND destino = 'Producto'
      ORDER BY id_multimedia DESC
      LIMIT 10
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener multimedia recientes:", error);
    res.status(500).json({ error: "Error al obtener multimedia recientes" });
  }
});

// Búsqueda optimizada de multimedia para productos
router.get("/multimedia/buscar", async (req, res) => {
  try {
    const { query, campo } = req.query;

    if (!query || !query.trim()) {
      return res.status(400).json({ 
        error: "Se requiere un término de búsqueda" 
      });
    }

    let consulta;
    let parametros;

    if (campo && campo !== "todos") {
      const columna = campo === "id"
        ? "id_multimedia"
        : campo === "tipo"
        ? "tipo_archivo"
        : campo === "asociacion"
        ? "tipo_asociacion"
        : campo === "nombre"
        ? "nombre_archivo"
        : campo;

      consulta = `
        SELECT 
          id_multimedia,
          nombre_archivo,
          tipo_archivo,
          tipo_asociacion,
          destino
        FROM multimedia 
        WHERE eliminado = false 
        AND destino = 'Producto'
        AND CAST(${columna} AS TEXT) ILIKE $1
        ORDER BY id_multimedia DESC
        LIMIT 50
      `;
      parametros = [`%${query}%`];
    } else {
      consulta = `
        SELECT 
          id_multimedia,
          nombre_archivo,
          tipo_archivo,
          tipo_asociacion,
          destino
        FROM multimedia 
        WHERE eliminado = false 
        AND destino = 'Producto'
        AND (
          CAST(id_multimedia AS TEXT) ILIKE $1 OR
          nombre_archivo ILIKE $1 OR
          tipo_archivo ILIKE $1 OR
          tipo_asociacion ILIKE $1
        )
        ORDER BY id_multimedia DESC
        LIMIT 50
      `;
      parametros = [`%${query}%`];
    }

    const result = await db.query(consulta, parametros);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al buscar multimedia:", error);
    res.status(500).json({ error: "Error al buscar multimedia" });
  }
});

// Búsqueda de productos (mantenida para compatibilidad)
router.get("/productos/buscar", async (req, res) => {
  try {
    const { query, campo } = req.query;

    if (!query || !query.trim()) {
      return res.status(400).json({ 
        error: "Se requiere un término de búsqueda" 
      });
    }

    let consulta;
    let parametros;

    if (campo && campo !== "todos") {
      const columna = campo === "id"
        ? "id_producto"
        : campo === "nombre"
        ? "nombre"
        : campo === "marca"
        ? "marca"
        : campo === "descripcion"
        ? "descripcion"
        : campo;

      consulta = `
        SELECT 
          id_producto,
          nombre,
          descripcion,
          marca,
          precio_venta
        FROM productos 
        WHERE eliminado = false 
        AND CAST(${columna} AS TEXT) ILIKE $1
        ORDER BY id_producto DESC
        LIMIT 50
      `;
      parametros = [`%${query}%`];
    } else {
      consulta = `
        SELECT 
          id_producto,
          nombre,
          descripcion,
          marca,
          precio_venta
        FROM productos 
        WHERE eliminado = false AND (
          CAST(id_producto AS TEXT) ILIKE $1 OR
          nombre ILIKE $1 OR
          descripcion ILIKE $1 OR
          marca ILIKE $1
        )
        ORDER BY id_producto DESC
        LIMIT 50
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