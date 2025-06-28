/*
RUTAS DE PUBLICIDAD - rutasPublicidad.js
Este archivo contiene las rutas para gestionar campañas publicitarias (obtener, registrar, actualizar, eliminar, buscar)
mediante endpoints REST que interactúan con la base de datos.
*/

/*
IMPORTACIONES Y CONFIGURACIÓN
*/
const express = require("express");//Framework web para Node.js
const router = express.Router();//Router de Express para definir rutas
const db = require("../../../conexion"); // Conexión a la base de datos

/*
RUTA GET: OBTENER TODAS LAS CAMPAÑAS PUBLICITARIAS
Realiza una consulta a la base de datos para obtener todos los registros
de la tabla publicidad (donde eliminado = false) y devolverlos como un arreglo en formato JSON.
*/
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM publicidad WHERE eliminado = false ORDER BY id_publicidad DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener publicidad:", error);
    res.status(500).json({ error: "Error al obtener publicidad" });
  }
});

/*
RUTA POST: REGISTRAR PUBLICIDAD
Permite insertar una nueva campaña publicitaria en la base de datos.
Llama al procedimiento almacenado `insertar_publicidad`.
*/
router.post("/publicidad", async (req, res) => {
  const {
    nombre_campaña,
    descripcion,
    costo,
    fecha_inicial,
    fecha_final,
    activo,
  } = req.body;

  try {
    // Validación básica
    if (!nombre_campaña || !descripcion || !costo || !fecha_inicial || !fecha_final) {
      return res.status(400).json({ error: "Todos los campos obligatorios deben ser proporcionados" });
    }

    // Validar que la fecha inicial sea anterior a la fecha final
    if (new Date(fecha_inicial) >= new Date(fecha_final)) {
      return res.status(400).json({ error: "La fecha inicial debe ser anterior a la fecha final" });
    }

    // Llamada al procedimiento almacenado de la base de datos
    await db.query(
      `CALL insertar_publicidad($1, $2, $3, $4, $5, $6)`,
      [nombre_campaña, descripcion, costo, fecha_inicial, fecha_final, activo || true]
    );
    res.status(201).json({ message: "Publicidad registrada exitosamente" });
  } catch (error) {
    console.error("Error al registrar publicidad:", error);
    res.status(500).json({ error: "Error al registrar publicidad" });
  }
});
  
/*
RUTA PUT: ACTUALIZAR PUBLICIDAD
Actualiza una campaña publicitaria existente en la base de datos.
Llama al procedimiento almacenado `actualizar_publicidad`.
*/
router.put("/publicidad/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre_campaña, descripcion, costo, fecha_inicial, fecha_final } = req.body;
  
  try {
    // Validación básica
    if (!nombre_campaña || !descripcion || !costo || !fecha_inicial || !fecha_final) {
      return res.status(400).json({ error: "Todos los campos obligatorios deben ser proporcionados" });
    }

    // Validar que la fecha inicial sea anterior a la fecha final
    if (new Date(fecha_inicial) >= new Date(fecha_final)) {
      return res.status(400).json({ error: "La fecha inicial debe ser anterior a la fecha final" });
    }
    
    // Llamada al procedimiento almacenado de la base de datos
    const result = await db.query(
      `CALL actualizar_publicidad($1, $2, $3, $4, $5, $6)`,
      [id, nombre_campaña, descripcion, costo, fecha_inicial, fecha_final]
    );

 

    res.status(200).json({ message: "Publicidad actualizada exitosamente" });
  } catch (error) {
    console.error("Error al actualizar publicidad:", error);
    // Un error podría indicar que la campaña no existe o no se pudo actualizar
    res.status(500).json({ error: "Error al actualizar publicidad" });
  }
});

/*
RUTA DELETE: ELIMINAR PUBLICIDAD (SOFT DELETE)
Realiza un "soft delete" de una campaña publicitaria llamando a `eliminar_publicidad`.
Este procedimiento actualiza el campo "eliminado" a true y "activo" a false.
*/
router.delete("/publicidad/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    // Llamada al procedimiento almacenado de la base de datos
    const result = await db.query(
      `CALL eliminar_publicidad($1)`,
      [id]
    );


    res.status(200).json({ message: "Publicidad eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar publicidad:", error);
    res.status(500).json({ error: "Error al eliminar publicidad" });
  }
});


/*
RUTA PATCH: ACTIVAR/DESACTIVAR PUBLICIDAD
Cambia el estado de una campaña publicitaria (activo/inactivo).
*/
router.patch("/publicidad/:id/toggle", async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await db.query(
      `UPDATE publicidad SET activo = NOT activo WHERE id_publicidad = $1 AND eliminado = false RETURNING activo`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Publicidad no encontrada o ya eliminada" });
    }

    const nuevoEstado = result.rows[0].activo;
    res.status(200).json({ 
      message: `Publicidad ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`,
      activo: nuevoEstado 
    });
  } catch (error) {
    console.error("Error al cambiar estado de publicidad:", error);
    res.status(500).json({ error: "Error al cambiar estado de publicidad" });
  }
});

/*
RUTA GET: BUSCAR POR FILTROS
Busca campañas publicitarias en la base de datos según los criterios de búsqueda proporcionados.
Permite buscar por diferentes campos y devolver los resultados en formato JSON.
*/
router.get("/buscar", async (req, res) => {
  try {
    const { query, campo } = req.query;
    
    let consulta;
    let parametros;

    if (!query) {
      // Si no hay consulta, devolver toda la publicidad no eliminada
      consulta = "SELECT * FROM publicidad WHERE eliminado = false ORDER BY id_publicidad ASC";
      parametros = [];
    } else if (campo && campo !== "todos") {
      // Búsqueda por campo específico
      const columna = campo === "id" 
        ? "id_publicidad" 
        : campo === "nombre" 
          ? "nombre_campaña" 
          : campo === "fecha_inicial" 
            ? "fecha_inicial" 
            : campo === "fecha_final"
              ? "fecha_final"
              : campo === "activo"
                ? "activo"
                : campo;
            
      if (campo === "activo") {
        // Búsqueda especial para el campo booleano activo
        const valorBooleano = query.toLowerCase() === "activo" || query.toLowerCase() === "true";
        consulta = `SELECT * FROM publicidad WHERE ${columna} = $1 AND eliminado = false ORDER BY id_publicidad ASC`;
        parametros = [valorBooleano];
      } else {
        consulta = `SELECT * FROM publicidad WHERE CAST(${columna} AS TEXT) ILIKE $1 AND eliminado = false ORDER BY id_publicidad ASC`;
        parametros = [`%${query}%`];
      }
    } else {
      // Búsqueda en todos los campos
      consulta = `
        SELECT * FROM publicidad 
        WHERE eliminado = false AND (
          CAST(id_publicidad AS TEXT) ILIKE $1 OR 
          nombre_campaña ILIKE $1 OR 
          descripcion ILIKE $1 OR 
          CAST(costo AS TEXT) ILIKE $1 OR 
          CAST(fecha_inicial AS TEXT) ILIKE $1 OR 
          CAST(fecha_final AS TEXT) ILIKE $1 OR
          CASE WHEN activo THEN 'activo' ELSE 'inactivo' END ILIKE $1
        )
        ORDER BY id_publicidad ASC
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

/*
RUTA GET: OBTENER PUBLICIDAD ACTIVA Y EN RANGO DE FECHAS
Obtiene todas las campañas publicitarias que están activas y dentro del rango de fechas actual.
*/
router.get("/activa", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM publicidad 
      WHERE activo = true 
        AND eliminado = false 
        AND fecha_inicial <= CURRENT_DATE 
        AND fecha_final >= CURRENT_DATE 
      ORDER BY id_publicidad ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener publicidad activa:", error);
    res.status(500).json({ error: "Error al obtener publicidad activa" });
  }
});

/*
RUTA GET: OBTENER ESTADÍSTICAS DE PUBLICIDAD
Obtiene estadísticas sobre las campañas publicitarias, como el total, activas, inactivas, eliminadas,
costo total de las activas y campañas en curso.
*/
router.get("/estadisticas", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN activo = true AND eliminado = false THEN 1 END) as activas,
        COUNT(CASE WHEN activo = false AND eliminado = false THEN 1 END) as inactivas,
        COUNT(CASE WHEN eliminado = true THEN 1 END) as eliminadas,
        SUM(CASE WHEN activo = true AND eliminado = false THEN costo ELSE 0 END) as costo_total_activas,
        COUNT(CASE WHEN activo = true AND eliminado = false AND fecha_inicial <= CURRENT_DATE AND fecha_final >= CURRENT_DATE THEN 1 END) as en_curso
      FROM publicidad
    `);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener estadísticas de publicidad:", error);
    res.status(500).json({ error: "Error al obtener estadísticas de publicidad" });
  }
});

module.exports = router;