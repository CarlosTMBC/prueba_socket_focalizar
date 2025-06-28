/*
RUTAS DE LOGIN - loginRutas.js
Este archivo contiene las rutas para autenticación de usuarios,
incluyendo validación de credenciales y manejo de roles.
*/

/*
IMPORTACIONES Y CONFIGURACIÓN
*/
const express = require("express");
const router = express.Router();
const db = require("../conexion");
const bcrypt = require("bcrypt");
const { LoginModel } = require("../../modelos/modelLogin");

/*
RUTA POST: AUTENTICACIÓN DE USUARIO
Valida las credenciales del usuario y retorna información de autenticación.
Incluye verificación de contraseña, rotación de hash y detección de tipo de usuario.
*/
router.post("/", async (req, res) => {
  const { nombre, contrasena } = req.body;
  const login = new LoginModel(nombre, contrasena);

  if (!login.esValido()) {
    return res.status(400).json({ success: false, mensaje: "Datos inválidos" });
  }
  const { nombre: usuario, contrasena: clavePlain } = login.obtenerDatos();

  try {
    // Ahora se usa LEFT JOIN para detectar usuarios que no son clientes
    const { rows } = await db.query(
      `
      SELECT
        u.id_usuario,
        u.nombre,
        u.password_hash,
        r.nombre AS rol,
        c.id_cliente
      FROM usuarios u
      JOIN rol r ON u.rol_id = r.id_rol
      LEFT JOIN clientes c ON c.usuario_id = u.id_usuario
      WHERE u.nombre = $1;
      `,
      [usuario]
    );


    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        mensaje: 'No se encontró una cuenta con ese nombre. Regístrate primero.',
        tipo: 'registro'
      });
    }

    const userDB = rows[0];

    // Comparamos la contraseña plana con el hash de la BD
    const match = await bcrypt.compare(clavePlain, userDB.password_hash);
    if (!match) {
      return res.status(401).json({
        success: false,
        mensaje: 'La contraseña es incorrecta. Inténtalo de nuevo.',
        tipo: 'error'
      });
    }

    // Rehasheamos para rotar el salt
    const newHash = await bcrypt.hash(clavePlain, 12);
    await db.query(
      "UPDATE usuarios SET password_hash = $1 WHERE id_usuario = $2",
      [newHash, userDB.id_usuario]
    );

    const esCliente = !!userDB.id_cliente;
    const mensaje = esCliente
      ? "Credenciales válidas"
      : "Inicio de sesión exitoso. No estás registrado como cliente aún.";

    return res.status(200).json({
      success: true,
      mensaje,
      esCliente,
      usuario: {
        id_usuario: userDB.id_usuario,
        id_cliente: userDB.id_cliente,
        nombre_usuario: userDB.nombre,
        rol: userDB.rol,
      },
    });
  } catch (error) {
    console.error("Error en /login:", error);
    return res.status(500).json({
      success: false,
      mensaje: "Error del servidor",
      detalle: error.message,
    });
  }
});

module.exports = router;