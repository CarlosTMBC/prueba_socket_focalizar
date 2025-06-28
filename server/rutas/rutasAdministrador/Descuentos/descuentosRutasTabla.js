// rutas/rutasAdministrador/Descuentos/descuentosRutasTabla.js 
const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

/*
RUTA GET: OBTENER TODOS LOS DESCUENTOS 
*/
router.get("/", async (req, res) => {
  const { searchTerm, page = 1, limit = 10 } = req.query;

  try {
    const db = require("../../../conexion");
    const offset = (page - 1) * limit;

    let baseQuery = `
      WITH DescuentosAgregados AS (
        SELECT 
          d.id_descuento,
          d.nombre,
          d.descripcion,
          d.fecha_inicio,
          d.fecha_fin,
          d.activo,
          d.eliminado,
          MAX(td.porcentaje) AS porcentaje,
          MAX(td.monto_fijo) AS monto_fijo,
          MAX(ad.id_producto) AS producto_id,
          MAX(COALESCE(ad.id_categoria, p.categoria_id)) AS categoria_id
        FROM descuentos d
        LEFT JOIN tipos_descuento td ON d.id_descuento = td.id_descuento
        LEFT JOIN aplicaciones_descuento ad ON td.id_tipo_descuento = ad.id_tipo_descuento
        LEFT JOIN productos p ON ad.id_producto = p.id_producto
        WHERE d.eliminado = FALSE
        GROUP BY d.id_descuento
      )
      SELECT *,
        CASE 
            WHEN activo = TRUE AND fecha_fin >= CURRENT_DATE THEN 'activo' 
            ELSE 'inactivo' 
        END AS estado
      FROM DescuentosAgregados
    `;

    let whereClause = 'WHERE 1=1';
    const queryParams = [];

    if (searchTerm) {
      whereClause += `
        AND (
          nombre ILIKE $1 OR
          descripcion ILIKE $1 OR
          CAST(id_descuento AS TEXT) ILIKE $1 OR
          CAST(producto_id AS TEXT) ILIKE $1 OR
          CAST(categoria_id AS TEXT) ILIKE $1
        )
      `;
      queryParams.push(`%${searchTerm}%`);
    }

    const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) AS subquery ${whereClause}`;
    const totalResult = await db.query(countQuery, queryParams);
    const totalItems = parseInt(totalResult.rows[0].count, 10);
    const totalPaginas = Math.ceil(totalItems / limit);

    const dataQuery = `
      ${baseQuery}
      ${whereClause}
      ORDER BY id_descuento DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2};
    `;
    
    const result = await db.query(dataQuery, [...queryParams, limit, offset]);

    res.json({
      descuentos: result.rows,
      totalPages: totalPaginas,
      currentPage: parseInt(page, 10)
    });

  } catch (error) {
    console.error("Error al obtener descuentos con paginación:", error);
    res.status(500).json({ error: "Error al obtener descuentos" });
  }
});


/*
RUTA POST (CREAR)
*/
router.post("/descuentosT", async (req, res) => {
  const { nombre, descripcion, porcentaje, monto_fijo, fecha_inicio, fecha_fin, id_producto, id_categoria } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const descuentoResult = await client.query(
      `INSERT INTO descuentos(nombre, descripcion, fecha_inicio, fecha_fin, activo, eliminado) 
       VALUES ($1, $2, $3, $4, TRUE, FALSE) RETURNING id_descuento`,
      [nombre, descripcion, fecha_inicio, fecha_fin]
    );
    const id_descuento_nuevo = descuentoResult.rows[0].id_descuento;

    const tipoDescuentoResult = await client.query(
      `INSERT INTO tipos_descuento(id_descuento, porcentaje, monto_fijo) 
       VALUES ($1, $2, $3) RETURNING id_tipo_descuento`,
      [id_descuento_nuevo, porcentaje, monto_fijo]
    );
    const id_tipo_descuento_nuevo = tipoDescuentoResult.rows[0].id_tipo_descuento;

    const tipo_aplicacion = id_producto ? 'producto' : (id_categoria ? 'categoria' : 'global');
    await client.query(
      `INSERT INTO aplicaciones_descuento(id_tipo_descuento, id_producto, id_categoria, tipo_aplicacion) 
       VALUES ($1, $2, $3, $4)`,
      [id_tipo_descuento_nuevo, id_producto, id_categoria, tipo_aplicacion]
    );

    if (id_producto) {
      const productoResult = await client.query('SELECT precio_venta FROM productos WHERE id_producto = $1', [id_producto]);
      if (productoResult.rows.length > 0) {
        const precioOriginal = parseFloat(productoResult.rows[0].precio_venta);
        let nuevoPrecioConDescuento = precioOriginal;
        if (porcentaje != null) {
          nuevoPrecioConDescuento -= (precioOriginal * (parseFloat(porcentaje) / 100));
        } else if (monto_fijo != null) {
          nuevoPrecioConDescuento -= parseFloat(monto_fijo);
        }
        if (nuevoPrecioConDescuento < 0) nuevoPrecioConDescuento = 0;
        await client.query('UPDATE productos SET precio_descuento = $1 WHERE id_producto = $2', [nuevoPrecioConDescuento, id_producto]);
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: "Descuento creado correctamente" });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al insertar descuento (transacción):", error);
    res.status(500).json({ success: false, message: "Error al insertar descuento", detalle: error.message });
  } finally {
    client.release();
  }
});


/*
RUTA PUT (ACTUALIZAR)
*/
router.put("/descuentosT/:id", async (req, res) => {
  const id = req.params.id;
  const { nombre, descripcion, porcentaje, monto_fijo, fecha_inicio, fecha_fin, estado, producto_id, categoria_id } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const oldData = await client.query(`
        SELECT td.id_tipo_descuento, ad.id_producto 
        FROM descuentos d
        JOIN tipos_descuento td ON d.id_descuento = td.id_descuento
        LEFT JOIN aplicaciones_descuento ad ON td.id_tipo_descuento = ad.id_tipo_descuento
        WHERE d.id_descuento = $1
    `, [id]);

    if (oldData.rows.length > 0) {
      const { id_tipo_descuento, id_producto: producto_id_anterior } = oldData.rows[0];
      if (producto_id_anterior && producto_id_anterior !== producto_id) {
        await client.query('UPDATE productos SET precio_descuento = NULL WHERE id_producto = $1', [producto_id_anterior]);
      }
      await client.query('DELETE FROM aplicaciones_descuento WHERE id_tipo_descuento = $1', [id_tipo_descuento]);
      await client.query('DELETE FROM tipos_descuento WHERE id_descuento = $1', [id]);
    }
    const esActivo = (estado === 'activo');
    await client.query(
      `UPDATE descuentos SET nombre=$1, descripcion=$2, fecha_inicio=$3, fecha_fin=$4, activo=$5 WHERE id_descuento=$6`,
      [nombre, descripcion, fecha_inicio, fecha_fin, esActivo, id]
    );

    const nuevoTipo = await client.query('INSERT INTO tipos_descuento(id_descuento, porcentaje, monto_fijo) VALUES ($1, $2, $3) RETURNING id_tipo_descuento', [id, porcentaje, monto_fijo]);
    const id_tipo_nuevo = nuevoTipo.rows[0].id_tipo_descuento;
    const tipo_aplicacion = producto_id ? 'producto' : 'categoria';
    await client.query('INSERT INTO aplicaciones_descuento(id_tipo_descuento, id_producto, id_categoria, tipo_aplicacion) VALUES ($1, $2, $3, $4)', [id_tipo_nuevo, producto_id, categoria_id, tipo_aplicacion]);

    if (producto_id) {
      if (estado === 'activo') {
        const productoResult = await client.query('SELECT precio_venta FROM productos WHERE id_producto = $1', [producto_id]);
        if (productoResult.rows.length > 0) {
          const precioOriginal = parseFloat(productoResult.rows[0].precio_venta);
          let nuevoPrecioConDescuento = precioOriginal;

          if (porcentaje != null) {
            nuevoPrecioConDescuento -= (precioOriginal * (parseFloat(porcentaje) / 100));
          } else if (monto_fijo != null) {
            nuevoPrecioConDescuento -= parseFloat(monto_fijo);
          }
          
          if (nuevoPrecioConDescuento < 0) nuevoPrecioConDescuento = 0;

          await client.query('UPDATE productos SET precio_descuento = $1 WHERE id_producto = $2', [nuevoPrecioConDescuento, producto_id]);
        }
      } else {
        await client.query('UPDATE productos SET precio_descuento = NULL WHERE id_producto = $1', [producto_id]);
      }
    }

    await client.query('COMMIT');
    res.status(200).json({ success: true, message: 'Descuento actualizado correctamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al actualizar descuento:", error);
    res.status(500).json({ success: false, message: "Error al actualizar el descuento", detalle: error.message });
  } finally {
    client.release();
  }
});


/*
RUTA DELETE
*/
router.delete("/descuentosT/:id", async (req, res) => {
  const id = req.params.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const infoResult = await client.query(`SELECT ad.id_producto FROM descuentos d JOIN tipos_descuento td ON d.id_descuento = td.id_descuento JOIN aplicaciones_descuento ad ON td.id_tipo_descuento = ad.id_tipo_descuento WHERE d.id_descuento = $1 AND ad.id_producto IS NOT NULL`, [id]);
    if (infoResult.rows.length > 0) {
      await client.query('UPDATE productos SET precio_descuento = NULL WHERE id_producto = $1', [infoResult.rows[0].id_producto]);
    }
    await client.query('UPDATE descuentos SET eliminado = TRUE, activo = FALSE WHERE id_descuento = $1', [id]);

    await client.query('COMMIT');
    res.status(200).json({ success: true, message: "Descuento eliminado correctamente" });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al eliminar descuento:", error);
    res.status(500).json({ success: false, message: "Error al eliminar el descuento", detalle: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;