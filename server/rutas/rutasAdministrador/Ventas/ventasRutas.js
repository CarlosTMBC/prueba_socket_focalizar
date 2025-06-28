/*
RUTAS DE VENTAS - rutasVentas.js
Este archivo contiene las rutas para gestionar ventas (obtener, crear, actualizar, eliminar)
mediante endpoints REST que interactúan con la base de datos.
*/

/*
IMPORTACIONES Y CONFIGURACIÓN
*/
const express = require("express");
const router = express.Router();
const db = require("../../../conexion");
const { VentaListadoModel } = require("../../../../modelos/modelosAdministrador/Ventas/modelVentas");

// ======================
// Obtener todas las ventas con cliente y bodega
// ======================
/*
RUTA GET: OBTENER TODAS LAS VENTAS
Obtiene todos los registros de ventas almacenados en la base de datos.
Retorna un arreglo con todas las ventas o un arreglo vacío si no hay registros.
*/
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        v.id_venta,
        c.nombre AS nombre_cliente,
        b.nombre AS nombre_bodega,
        v.total,
        v.fecha_venta,
        v.eliminado
      FROM ventas v
      JOIN clientes c ON v.cliente_id = c.id_cliente
      JOIN bodegas b ON v.bodega_id = b.id_bodega
      ORDER BY v.fecha_venta DESC
    `);

    const ventas = result.rows.map(VentaListadoModel.desdeFilaBD);
    res.json(ventas);
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    res.status(500).json({ error: "Error al obtener ventas" });
  }
});


module.exports = router;
