const express = require("express"); //Framework web para Node.js
const router = express.Router(); //Router de Express para definir rutas
const db = require("../../../conexion"); //Conexión a la base de datos


// GET /api/ganancia-microbodega/:usuario_id
router.get("/:id_usuario", async (req, res) => {
  const { id_usuario } = req.params;

  try {
    const resumenTotal = await db.query(`
      SELECT 
        COALESCE(SUM(c.monto_comision), 0) AS ganancia_total,
        COALESCE(SUM(v.total), 0) AS ventas_total,
        ROUND(
          CASE 
            WHEN SUM(v.total) > 0 THEN (SUM(c.monto_comision) * 100.0 / SUM(v.total))
            ELSE 0 
          END,
        2) AS porcentaje
      FROM ventas v
      JOIN comisiones_ventas c ON v.id_venta = c.id_venta
      JOIN bodegas b ON v.bodega_id = b.id_bodega
      WHERE b.encargado_id = $1 AND v.eliminado = false;
    `, [id_usuario]);

    const resumenPorBodega = await db.query(`
      SELECT 
  b.id_bodega,
  b.nombre AS nombre_bodega,
  COALESCE(SUM(c.monto_comision), 0) AS ganancia_total,
  COALESCE(SUM(v.total), 0) AS ventas_total,
  ROUND(
    CASE 
      WHEN SUM(v.total) > 0 THEN (SUM(c.monto_comision) * 100.0 / SUM(v.total))
      ELSE 0 
    END,
  2) AS porcentaje
FROM bodegas b
LEFT JOIN ventas v ON v.bodega_id = b.id_bodega AND v.eliminado = false
LEFT JOIN comisiones_ventas c ON v.id_venta = c.id_venta
WHERE b.encargado_id = $1
GROUP BY b.id_bodega, b.nombre
ORDER BY b.nombre;

    `, [id_usuario]);

    res.json({
      resumen_total: resumenTotal.rows[0],
      bodegas: resumenPorBodega.rows,
    });

  } catch (error) {
    console.error("Error al obtener resumen de ganancias:", error);
    res.status(500).json({ error: "Error al obtener resumen" });
  }
});

module.exports = router;

