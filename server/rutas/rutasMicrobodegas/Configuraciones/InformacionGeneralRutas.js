const express = require("express"); //Framework web para Node.js
const router = express.Router(); //Router de Express para definir rutas
const db = require("../../../conexion"); //Conexión a la base de datos

// Obtener información del usuario y bodegas a cargo
router.get("/:id_usuario", async (req, res) => {
  const { id_usuario } = req.params;

  try {
    const result = await db.query(
      `
      SELECT 
  u.nombre AS nombre_usuario,
  u.rol_id AS rol_usuario,
  c.nombre AS nombre_cliente,
  c.correo_electronico,
  c.telefono AS telefono_cliente,
  c.departamento,
  c.municipio,
   c.direccion,
  COALESCE(
    json_agg(
      json_build_object(
        'id_bodega', b.id_bodega,
        'nombre_bodega', b.nombre,
        'telefono_bodega', b.telefono,
        'ubicacion', b.ubicacion
      )
    ) FILTER (WHERE b.id_bodega IS NOT NULL),
    '[]'
  ) AS bodegas
FROM usuarios u
LEFT JOIN clientes c ON c.usuario_id = u.id_usuario AND c.eliminado = false
LEFT JOIN bodegas b ON b.encargado_id = u.id_usuario AND b.eliminado = false
WHERE u.id_usuario = $1 AND u.eliminado = false
GROUP BY 
  u.id_usuario,
  u.nombre,
  u.rol_id,
  c.nombre,
  c.correo_electronico,
  c.telefono,
  c.departamento,
  c.municipio, c.direccion;
      `,
      [id_usuario]
    );

    res.json(result.rows[0] || {});
  } catch (error) {
    console.error("Error al obtener info del usuario con bodegas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});



module.exports = router;

