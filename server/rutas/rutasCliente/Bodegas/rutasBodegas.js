const express = require("express");//Framework web para Node.js
const router = express.Router();//Router de Express para definir rutas
const db = require("../../../conexion");//Conexión a la base de datos

router.get("/", async (req, res) => {
  const { id_cliente, pagina = 1, limite = 4, busqueda = '' } = req.query;

  if (!id_cliente) {
    return res.status(400).json({ error: "id_cliente es requerido como query param." });
  }

  try {
    const clienteResult = await db.query(
      `SELECT departamento FROM clientes WHERE id_cliente = $1`,
      [id_cliente]
    );

    if (clienteResult.rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado." });
    }

    const departamentoCliente = clienteResult.rows[0].departamento;
    const offset = (parseInt(pagina) - 1) * parseInt(limite);
    const textoBusqueda = `%${busqueda.toLowerCase()}%`;

    const bodegasQuery = `
      SELECT 
        id_bodega,
        nombre,
        ubicacion,
        departamento,
        municipio,
        CASE 
          WHEN departamento = $2 THEN 'Cercana'
          ELSE 'Lejana'
        END AS proximidad
      FROM bodegas
      WHERE eliminado = FALSE
        AND (
          LOWER(nombre) LIKE $1 OR
          LOWER(ubicacion) LIKE $1 OR
          LOWER(municipio) LIKE $1
        )
      ORDER BY 
        (departamento = $2) DESC,  -- Prioriza las bodegas cercanas
        nombre ASC
      LIMIT $3 OFFSET $4
    `;

    const conteoQuery = `
      SELECT COUNT(*) AS total
      FROM bodegas
      WHERE eliminado = FALSE
        AND (
          LOWER(nombre) LIKE $1 OR
          LOWER(ubicacion) LIKE $1 OR
          LOWER(municipio) LIKE $1
        )
    `;

    const [bodegasResult, conteoResult] = await Promise.all([
      db.query(bodegasQuery, [textoBusqueda, departamentoCliente, limite, offset]),
      db.query(conteoQuery, [textoBusqueda])
    ]);

    res.json({
      total: parseInt(conteoResult.rows[0].total),
      bodegas: bodegasResult.rows // cada una incluirá "proximidad": "Cercana" o "Lejana"
    });

  } catch (error) {
    console.error("[BODEGAS POR CLIENTE - PAGINADO] Error:", error);
    res.status(500).json({ error: "Error interno al obtener bodegas." });
  }
});



router.post("/verificar-stock", async (req, res) => {
  const { bodega_id, productos } = req.body;

  if (!bodega_id || !Array.isArray(productos)) {
    return res.status(400).json({ error: "Datos inválidos." });
  }

  try {
    // Buscar stock de cada producto en esa bodega
    const idsProductos = productos.map(p => p.id).join(",");
    const query = `
      SELECT
        bp.producto_id,
        bs.stock_actual
      FROM bodega_producto bp
      JOIN bodega_stock bs ON bs.bodega_producto_id = bp.id
      WHERE bp.bodega_id = $1 AND bp.producto_id = ANY($2::int[])
    `;

    const { rows } = await db.query(query, [bodega_id, productos.map(p => p.id)]);
    const stockMap = {};

    rows.forEach(row => {
      stockMap[row.producto_id] = row.stock_actual;
    });

    const resultado = productos.map(prod => {
      const disponible = stockMap[prod.id] || 0;
      return {
        id: prod.id,
        cantidad: prod.cantidad,
        disponible,
        hayStock: disponible >= prod.cantidad
      };
    });

    res.json({ success: true, resultado });
  } catch (err) {
    console.error("[Error verificar-stock]:", err);
    res.status(500).json({ error: "Error al verificar el stock." });
  }
});


module.exports = router;