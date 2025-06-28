// rutas/rutasAdministrador/Publicidad/Multimedia/rutasPublicidadMultimedia.js
const express = require("express");
const router = express.Router();
const db = require("../../../../conexion");

// Insertar asociación publicidad-multimedia
router.post("/publicidadMultimedia", async (req, res) => {
  const { id_publicidad, id_multimedia } = req.body;
  
  // Validar que se proporcionen ambos IDs
  if (!id_publicidad || !id_multimedia) {
    return res.status(400).json({ 
      error: "Se requieren id_publicidad e id_multimedia" 
    });
  }

  try {
    // Verificar si la asociación ya existe para evitar duplicados
    const existeAsociacion = await db.query(`
      SELECT * FROM publicidad_multimedia 
      WHERE id_publicidad = $1 AND id_multimedia = $2
    `, [id_publicidad, id_multimedia]);

    if (existeAsociacion.rows.length > 0) {
      return res.status(409).json({ 
        error: "Esta asociación ya existe",
        mensaje: "La publicidad ya tiene asociado este multimedia"
      });
    }

    // Insertar la nueva asociación usando el procedimiento almacenado
    await db.query(`
      CALL insertar_publicidad_multimedia($1, $2)
    `, [id_publicidad, id_multimedia]);

    // Obtener el registro insertado para la respuesta
    const result = await db.query(`
      SELECT * FROM publicidad_multimedia 
      WHERE id_publicidad = $1 AND id_multimedia = $2
    `, [id_publicidad, id_multimedia]);

    res.status(201).json({
      mensaje: "Asociación creada exitosamente",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error al insertar publicidad-multimedia:", error);
    
    // Manejar errores específicos de base de datos
    if (error.code === '23503') {
      return res.status(400).json({ 
        error: "Referencia inválida: la publicidad o multimedia no existe" 
      });
    }
    
    res.status(500).json({ 
      error: "Error interno del servidor al crear la asociación" 
    });
  }
});

// Eliminar asociación publicidad-multimedia
router.delete("/:publicidad_id/:multimedia_id", async (req, res) => {
  const { publicidad_id, multimedia_id } = req.params;
  
  try {
    const result = await db.query(`
      DELETE FROM publicidad_multimedia 
      WHERE id_publicidad = $1 AND id_multimedia = $2
      RETURNING *
    `, [publicidad_id, multimedia_id]);

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

// Obtener solo las últimas 10 multimedia para publicidad (excluyendo destino "Producto")
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
      AND destino != 'Producto'
      ORDER BY id_multimedia DESC
      LIMIT 10
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener multimedia recientes:", error);
    res.status(500).json({ error: "Error al obtener multimedia recientes" });
  }
});

// Búsqueda optimizada de multimedia para publicidad (excluyendo destino "Producto")
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
        : campo === "destino"
        ? "destino"
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
        AND destino != 'Producto'
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
        AND destino != 'Producto'
        AND (
          CAST(id_multimedia AS TEXT) ILIKE $1 OR
          nombre_archivo ILIKE $1 OR
          tipo_archivo ILIKE $1 OR
          tipo_asociacion ILIKE $1 OR
          destino ILIKE $1
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

// ========== RUTAS DE PUBLICIDAD ==========

// Búsqueda de publicidad
router.get("/publicidad/buscar", async (req, res) => {
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
        ? "id_publicidad"
        : campo === "nombre"
        ? "nombre_campaña"
        : campo === "descripcion"
        ? "descripcion"
        : campo === "costo"
        ? "costo"
        : campo === "activo"
        ? "activo"
        : campo;

      consulta = `
        SELECT 
          id_publicidad,
          nombre_campaña,
          descripcion,
          costo,
          fecha_inicial,
          fecha_final,
          activo
        FROM publicidad 
        WHERE eliminado = false 
        AND CAST(${columna} AS TEXT) ILIKE $1
        ORDER BY id_publicidad DESC
        LIMIT 50
      `;
      parametros = [`%${query}%`];
    } else {
      consulta = `
        SELECT 
          id_publicidad,
          nombre_campaña,
          descripcion,
          costo,
          fecha_inicial,
          fecha_final,
          activo
        FROM publicidad 
        WHERE eliminado = false AND (
          CAST(id_publicidad AS TEXT) ILIKE $1 OR
          nombre_campaña ILIKE $1 OR
          descripcion ILIKE $1 OR
          CAST(costo AS TEXT) ILIKE $1
        )
        ORDER BY id_publicidad DESC
        LIMIT 50
      `;
      parametros = [`%${query}%`];
    }

    const result = await db.query(consulta, parametros);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al buscar publicidad:", error);
    res.status(500).json({ error: "Error al buscar publicidad" });
  }
});

// ========== RUTAS ADICIONALES ==========

// Obtener todas las asociaciones publicidad-multimedia
router.get("/asociaciones", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        pm.id_publicidad,
        pm.id_multimedia,
        p.nombre_campaña,
        p.descripcion as publicidad_descripcion,
        p.costo,
        p.activo,
        m.nombre_archivo,
        m.tipo_archivo,
        m.tipo_asociacion,
        m.destino
      FROM publicidad_multimedia pm
      JOIN publicidad p ON pm.id_publicidad = p.id_publicidad
      JOIN multimedia m ON pm.id_multimedia = m.id_multimedia
      WHERE p.eliminado = false AND m.eliminado = false
      ORDER BY pm.publicidad_id DESC, pm.multimedia_id DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener asociaciones:", error);
    res.status(500).json({ error: "Error al obtener asociaciones" });
  }
});

// Obtener multimedia asociado a una publicidad específica
router.get("/publicidad/:id_publicidad/multimedia", async (req, res) => {
  try {
    const { id_publicidad } = req.params;
    
    const result = await db.query(`
      SELECT 
        m.id_multimedia,
        m.nombre_archivo,
        m.tipo_archivo,
        m.tipo_asociacion,
        m.destino,
        pm.id_publicidad
      FROM multimedia m
      JOIN publicidad_multimedia pm ON m.id_multimedia = pm.id_multimedia
      WHERE pm.id_publicidad = $1 AND m.eliminado = false
      ORDER BY m.id_multimedia DESC
    `, [id_publicidad]);
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener multimedia de publicidad:", error);
    res.status(500).json({ error: "Error al obtener multimedia de publicidad" });
  }
});

// Obtener publicidad asociada a un multimedia específico
router.get("/multimedia/:id_multimedia/publicidad", async (req, res) => {
  try {
    const { id_multimedia } = req.params;
    
    const result = await db.query(`
      SELECT 
        p.id_publicidad,
        p.nombre_campaña,
        p.descripcion,
        p.costo,
        p.fecha_inicial,
        p.fecha_final,
        p.activo,
        pm.id_multimedia
      FROM publicidad p
      JOIN publicidad_multimedia pm ON p.id_publicidad = pm.id_publicidad
      WHERE pm.id_multimedia = $1 AND p.eliminado = false
      ORDER BY p.id_publicidad DESC
    `, [id_multimedia]);
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener publicidad de multimedia:", error);
    res.status(500).json({ error: "Error al obtener publicidad de multimedia" });
  }
});

module.exports = router;