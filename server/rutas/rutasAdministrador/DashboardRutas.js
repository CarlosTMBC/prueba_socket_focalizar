/*
RUTAS DE DASHBOARD - DashboardRutas.js
Este archivo contiene las rutas para obtener métricas y datos estadísticos del dashboard,
incluyendo métricas generales, ventas mensuales y listado de bodegas.
*/

/*
IMPORTACIONES Y CONFIGURACIÓN
*/

const express = require("express");
const router = express.Router();
const db = require("../../../server/conexion");

/*
RUTA GET: OBTENER MÉTRICAS DEL DASHBOARD
Consulta y devuelve las métricas generales del dashboard.
Utiliza la función ObtenerEstadisticas() y retorna un arreglo de objetos con:
- descripcion_metrica: descripción de la métrica
- valor_calculado: valor numérico de la métrica
*/
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM obtener_resumen_operativo()");
    const metricas = result.rows.map(row => ({
      descripcion_metrica: row.descripcion,
      valor_calculado: parseFloat(row.total_valor)
    }));

    res.json(metricas);
  } catch (error) {
    console.error("Error al obtener métricas del dashboard:", error);
    res.status(500).json({
      error: "Error al obtener métricas",
      detalle: error.message
    });
  }
});


/*
RUTA GET: OBTENER VENTAS MENSUALES
Consulta y devuelve el detalle de ventas mensuales, opcionalmente filtrado por bodega.
Utiliza la función obtener_ventas_mensuales_detalle(bodega).
Retorna un arreglo de objetos con:
- año
- mes
- bodega
- monto
- cantidad
*/

router.get("/ventas-mensuales", async (req, res) => {
  const { bodega } = req.query;
  try {
    const result = await db.query("SELECT * FROM obtener_pedidos_mensuales_detalle($1)", [bodega || '']);
     res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener ventas mensuales" });
  }
});

/*
RUTA GET: OBTENER LISTADO DE BODEGAS
Obtiene el listado de bodegas activas (no eliminadas) con sus IDs y nombres.
*/
router.get("/bodegas", async (req, res) => {
  try {
    const result = await db.query("SELECT id_bodega, nombre FROM bodegas WHERE eliminado = false");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener bodegas" });
  }
});


// GET /productos-mas-vendidos
router.get("/productos-mas-vendidos", async (req, res) => {
  const { bodega } = req.query;
  try {
  const result = await db.query("SELECT * FROM obtener_producto_mas_vendido_pedidos($1)", [bodega || '']);

    const datos = result.rows.map(row => ({
      año: row.año,
      mes: row.mes,
      nombre: row.nombre_producto,
      cantidad: parseInt(row.cantidad_total_vendida),
      bodega: row.bodega_referencia
    }));

    res.json(datos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener productos más vendidos" });
  }
});

// GET /progreso-por-categoria
router.get("/progreso-por-categoria", async (req, res) => {
  const { bodega } = req.query;
  try {
    const result = await db.query("SELECT * FROM obtener_pedidos_producto_categoria_mensual($1)", [bodega || '']);
     res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener progreso por categoría", detalle: error.message });
  }
});

/*
RUTA GET: CLIENTES TOP
Consulta los 10 clientes con más compras (por total gastado).
Función: obtener_clientes_top()
*/
router.get("/clientes-top", async (req, res) => {
  const { bodega } = req.query;

  try {
    const result = await db.query("SELECT * FROM obtener_clientes_top_por_bodega($1)", [bodega || null]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener clientes top:", error);
    res.status(500).json({ error: "Error al obtener clientes top", detalle: error.message });
  }
});


/*
RUTA GET: PRODUCTOS CON DESCUENTOS
Consulta los 10 productos a los que más veces se les aplicó descuentos.
Función: obtener_productos_con_descuentos()
*/
router.get("/productos-con-descuentos", async (req, res) => {
  const { bodega } = req.query;

  try {
    const result = await db.query("SELECT * FROM obtener_productos_con_descuentos_por_bodega($1)", [bodega || null]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener productos con descuentos:", error);
    res.status(500).json({ error: "Error al obtener productos con descuentos", detalle: error.message });
  }
});


/*
RUTA GET: MOTIVOS DE DEVOLUCIÓN
Consulta los 5 motivos más frecuentes por los cuales se realizaron devoluciones.
Función: obtener_motivos_devolucion()
*/
router.get("/motivos-devolucion", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM obtener_motivos_devolucion()");
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener motivos de devolución:", error);
    res.status(500).json({ error: "Error al obtener motivos de devolución", detalle: error.message });
  }
});

/*
RUTA GET: MOVIMIENTOS POR ESTADO
Consulta cuántos movimientos existen por cada estado.
Función: obtener_movimientos_por_estado()
*/
router.get("/movimientos-por-estado", async (req, res) => {
  const { bodega } = req.query;

  try {
    const result = await db.query("SELECT * FROM fn_movimientos_por_estado($1)", [bodega || null]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener movimientos por estado:", error);
    res.status(500).json({ error: "Error al obtener movimientos por estado", detalle: error.message });
  }
});


/*
RUTA GET: ESTADO DE SUSCRIPCIONES
Consulta cuántas suscripciones hay por estado.
Función: obtener_estado_suscripciones()
*/
router.get("/estado-suscripciones", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM obtener_estado_suscripciones()");
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener estado de suscripciones:", error);
    res.status(500).json({ error: "Error al obtener estado de suscripciones", detalle: error.message });
  }
});



router.get("/clientes-nuevos-mes", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM fn_clientes_nuevos_por_mes()");
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener clientes nuevos por mes:", error);
    res.status(500).json({ error: "Error al obtener clientes nuevos por mes", detalle: error.message });
  }
});


router.get("/movimientos-mensuales", async (req, res) => {
  const { bodega } = req.query;

  try {
    const result = await db.query("SELECT * FROM fn_movimientos_por_mes($1)", [bodega || null]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener movimientos por mes:", error);
    res.status(500).json({ error: "Error al obtener movimientos por mes", detalle: error.message });
  }
});


router.get("/ordenes-compra-estado", async (req, res) => {
  const { bodega } = req.query;

  try {
    const result = await db.query("SELECT * FROM fn_ordenes_aprobadas_por_bodega($1)", [bodega || null]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener estado de órdenes de compra:", error);
    res.status(500).json({ error: "Error al obtener estado de órdenes de compra", detalle: error.message });
  }
});


router.get("/pedidos-por-estado", async (req, res) => {
  const { bodega } = req.query;

  try {
    const result = await db.query("SELECT * FROM fn_pedidos_por_estado($1)", [bodega || null]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener pedidos por estado:", error);
    res.status(500).json({ error: "Error al obtener pedidos por estado", detalle: error.message });
  }
});

router.get("/productos-mas-devueltos", async (req, res) => {
  const { bodega } = req.query;

  try {
    const result = await db.query("SELECT * FROM fn_productos_mas_devueltos($1)", [bodega || null]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener productos más devueltos:", error);
    res.status(500).json({ error: "Error al obtener productos más devueltos", detalle: error.message });
  }
});



router.get("/productos-stock-bajo", async (req, res) => {
  const { bodega } = req.query;

  try {
    const result = await db.query("SELECT * FROM fn_productos_stock_bajo($1)", [bodega || null]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener productos con stock bajo:", error);
    res.status(500).json({ error: "Error al obtener productos con stock bajo", detalle: error.message });
  }
});

module.exports = router;
