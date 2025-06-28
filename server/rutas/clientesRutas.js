const express = require("express");
const router = express.Router();
const db = require("../conexion"); // Importa el objeto con el método query


const { Cliente } = require("../../modelos/modelClientes");//subir
// Obtener todos los clientes
/* 
  El GET retorna los registros de los clientes desde la base de datos
  La consulta SElECT * FROM clientes y Retorna un arreglo de objetos con los datos de
  los clientes registrados
*/
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM clientes");
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    res.status(500).json({ error: "Error al obtener clientes" });
  }
});

/*
  El POST Registra un nuevo cliente en el sistema
  Requiere contiene campos como nombre, contraseña, telefono y dirreccion
  La funcion es que valida que los campos que existan, luego crea el cliente usando
  la clase cliente y finalmente llama a un  procedimiento almacenado en la base de datos
*/
router.post("/", async (req, res) => {
  console.log("Cuerpo de la solicitud:", req.body);

  const { nombre, correo, contrasena, tel_cliente, direccion } = req.body;

  // Validación de datos obligatorios
  if (!nombre || !correo || !contrasena || !tel_cliente || !direccion) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  try {
    // Crear cliente validado utilizando las funciones de la clase Cliente
    Cliente.crearClienteValidado(nombre,correo,contrasena,tel_cliente,direccion);

    
    // Hashear la contraseña antes de guardar
    //await cliente.hashPassword();

    // Llamar al procedimiento almacenado para insertar el cliente
    await db.query(
      'CALL gestionar_clientes($1, NULL, $2, $3, $4, $5, $6)',
      ['insertar', nombre, correo, contrasena, tel_cliente, direccion]
    );

    res.status(201).json({ mensaje: "Cliente insertado correctamente" });
  } catch (error) {
    console.error("Error al insertar cliente:", error);
    res
      .status(500)
      .json({ error: "Error al insertar cliente", detalle: error.message });
  }
});

module.exports = router;