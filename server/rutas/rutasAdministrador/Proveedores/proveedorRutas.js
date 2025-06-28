// rutasAdministrador/Proveedores/proveedorRutas.js
/*
RUTAS DE PROVEEDORES - rutasProveedores.js
Este archivo contiene las rutas para gestionar proveedores (obtener, registrar, actualizar, buscar)
mediante endpoints REST que interactúan con la base de datos.
*/

/*
IMPORTACIONES Y CONFIGURACIÓN
*/
const express = require("express");
const router = express.Router();
const db = require("../../../conexion");
const { Proveedores } = require("../../../../modelos/modelosAdministrador/Proveedores/modelProveedor");







/*
RUTA POST: REGISTRAR LOS PROVEEDORES
Permite insertar un nuevo proveedor en la base de datos.
Los datos se reciben en el cuerpo de la solicitud y se validan antes de realizar la inserción.
Si alguno de los campos está vacío, se retorna un error con código 400.
*/
// POST - Registrar nuevo proveedor
router.post("/proveedores", async (req, res) => {
  const {
    nombre,
    telefono,
    correo_electronico,
    direccion,
    contacto,
    fecha_registro
  } = req.body;

  const proveedor = new Proveedores(
    nombre,
    telefono,
    correo_electronico,
    direccion,
    contacto,
    fecha_registro
  );

  if (!proveedor.esValido()) {
    return res.status(400).json({ error: "Datos del proveedor inválidos o incompletos" });
  }

  try {
    await db.query(
      `CALL insertar_proveedores($1, $2, $3, $4, $5, $6)`,
      [
        proveedor.nombre,
        proveedor.telefono,
        proveedor.correo_electronico,
        proveedor.direccion,
        proveedor.contacto,
        proveedor.fecha_registro
      ]
    );
    res.status(201).json({ message: "Proveedor registrado exitosamente" });
  } catch (error) {
    console.error("Error al registrar proveedor:", error);
    res.status(500).json({ error: "Error al registrar proveedor" });
  }
});


/*
RUTA PUT: ACTUALIZAR PROVEEDOR
Actualiza un proveedor existente en la base de datos.
Recibe el ID del proveedor a actualizar y los nuevos datos del proveedor.
*/
// PUT - Actualizar proveedor existente
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    telefono,
    correo_electronico,
    direccion,
    contacto,
    fecha_registro
  } = req.body;

  const proveedor = new Proveedores(
    nombre,
    telefono,
    correo_electronico,
    direccion,
    contacto,
    fecha_registro,
    id
  );

  if (!proveedor.esValido()) {
    return res.status(400).json({ error: "Datos del proveedor inválidos o incompletos" });
  }

  try {
    await db.query(
      `CALL actualizar_proveedores($1, $2, $3, $4, $5, $6, $7)`,
      [
        proveedor.id_proveedor,
        proveedor.nombre,
        proveedor.telefono,
        proveedor.correo_electronico,
        proveedor.direccion,
        proveedor.contacto,
        proveedor.fecha_registro
      ]
    );
    res.status(200).json({ message: "Proveedor actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar proveedor:", error);
    res.status(500).json({ error: "Error al actualizar proveedor" });
  }
});
/*
RUTA PUT: ELIMINAR PROVEEDOR
Actualiza un proveedor existente en la base de datos.
Recibe el ID del proveedor a actualizar y los nuevos datos del proveedor.
*/
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const idProveedor = parseInt(id, 10);


  if (isNaN(idProveedor) || idProveedor <= 0) {
    return res.status(400).json({ error: "ID de proveedor inválido" });
  }

  try {
    await db.query(`CALL eliminar_proveedores($1)`, [idProveedor]);
    res.status(200).json({ mensaje: "Proveedor eliminado (soft delete)" });
  } catch (error) {
    console.error("Error al eliminar proveedor:", error);
    res.status(500).json({ error: "Error al eliminar proveedor" });
  }
});

/*
RUTA GET: BUSCAR POR FILTROS
Busca proveedores en la base de datos según los criterios de búsqueda proporcionados.
Permite buscar por diferentes campos y devolver los resultados en formato JSON.
*/
// GET - Buscar proveedores por filtros
router.get("/buscar", async (req, res) => {
  try {
    const { query, campo } = req.query;

    if (!query) return res.redirect("/");

    let consulta;
    let parametros = [`%${query}%`];

    if (campo && campo !== "todos") {
      const columna = campo === "id"
        ? "id_proveedor"
        : campo === "correo"
          ? "correo_electronico"
          : campo === "fecha"
            ? "fecha_registro"
            : campo;

      consulta = `SELECT * FROM proveedores WHERE CAST(${columna} AS TEXT) ILIKE $1 ORDER BY id_proveedor ASC`;
    } else {
      consulta = `
        SELECT * FROM proveedores 
        WHERE 
          CAST(id_proveedor AS TEXT) ILIKE $1 OR 
          nombre ILIKE $1 OR 
          telefono ILIKE $1 OR 
          correo_electronico ILIKE $1 OR 
          direccion ILIKE $1 OR 
          contacto ILIKE $1 OR 
          CAST(fecha_registro AS TEXT) ILIKE $1
        ORDER BY id_proveedor ASC
      `;
    }

    const result = await db.query(consulta, parametros);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al buscar proveedores:", error);
    res.status(500).json({ error: "Error al buscar proveedores" });
  }
});


/*
RUTA GET: OBTENER TODOS LOS PROVEEDORES
Realiza una consulta a la base de datos para obtener todos los registros
de la tabla proveedores y devolverlos como un arreglo en formato JSON.
*/
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT *
      FROM proveedores
      WHERE eliminado = FALSE
      ORDER BY id_proveedor ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener proveedores:", error);
    res.status(500).json({ error: "Error al obtener proveedores" });
  }
});

module.exports = router;

