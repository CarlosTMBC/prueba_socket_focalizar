const express = require("express");
const router = express.Router();
const db = require("../../../conexion");

/**
 * GET /microbodega/movimientos/:usuarioId
 * Devuelve los movimientos cuyo bodega_destino está asignada al usuario (encargado_id)
 */
router.get("/:usuarioId", async (req, res) => {
  const usuarioId = parseInt(req.params.usuarioId, 10);
  if (isNaN(usuarioId) || usuarioId <= 0) {
    return res.status(400).json({ success: false, mensaje: "ID de usuario inválido." });
  }

  try {
    const result = await db.query(
      `
      SELECT 
        m.id_movimiento,
        m.fecha_movimiento,
        m.bodega_origen_id,
        bo.nombre AS bodega_origen_nombre,
        m.bodega_destino_id,
        bd.nombre AS bodega_destino_nombre,
        m.motivo,
        m.estado,
        m.descripcion,
        m.recibido,
        m.fecha_recepcion,
        m.observaciones
      FROM movimientos m
      JOIN bodegas bo
        ON m.bodega_origen_id = bo.id_bodega
      JOIN bodegas bd
        ON m.bodega_destino_id = bd.id_bodega
      WHERE m.eliminado = false
        AND bd.encargado_id = $1
      ORDER BY m.id_movimiento DESC
      `,
      [usuarioId]
    );

    return res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error al obtener movimientos microbodega:", error);
    return res
      .status(500)
      .json({ success: false, mensaje: "Error interno al obtener movimientos." });
  }
});


router.put('/:id_movimiento', async (req, res) => {
  const idMov = parseInt(req.params.id_movimiento, 10);
  const { fecha, mensaje } = req.body;
  if (isNaN(idMov) || idMov <= 0) {
    return res.status(400).json({ success: false, mensaje: 'ID inválido.' });
  }
  if (typeof fecha !== 'string' || typeof mensaje !== 'string') {
    return res.status(400).json({ success: false, mensaje: 'Formato inválido.' });
  }

  try {
    await db.query(
      `CALL actualizar_movimientos(
         $1, NULL, NULL, NULL, NULL,
         $2,     NULL,
         $3,     $4,      $5
       );`,
      [
        idMov,        
        'Entregado',  
        true,         
        fecha,        
        mensaje       
      ]
    );
    return res.json({ success: true, mensaje: 'Actualizado correctamente.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, mensaje: 'Error interno.' });
  }
});


module.exports = router;
