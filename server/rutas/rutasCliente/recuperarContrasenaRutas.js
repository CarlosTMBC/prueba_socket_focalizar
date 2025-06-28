/*
RUTAS DE RECUPERACIÓN DE CONTRASEÑA - rutasRecuperacionContrasena.js
Este archivo contiene las rutas para la recuperación de contraseñas,
incluyendo verificación de usuario/correo, envío de códigos y actualización de contraseña.
ACTUALIZADO PARA USAR PROCEDIMIENTOS ALMACENADOS
*/

const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const express = require("express");
const router = express.Router();
const pool = require("../../conexion");

// Almacenamiento temporal para códigos de recuperación
const codigosRecuperacion = new Map();

// Configuración del transporter de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_CRED,
    pass: process.env.EMAIL_PASSWORD
  }
});

/*
FUNCIONES AUXILIARES
*/

// Función para generar código de recuperación
const generarCodigoRecuperacion = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Función para hashear el código
const hashearCodigo = async (codigo) => {
  const saltRounds = 10;
  return await bcrypt.hash(codigo, saltRounds);
};

// Función para verificar el código hasheado
const verificarCodigoHasheado = async (codigo, codigoHasheado) => {
  return await bcrypt.compare(codigo, codigoHasheado);
};

// Función para hashear la nueva contraseña
const hashearContrasena = async (contrasena) => {
  const saltRounds = 10;
  return await bcrypt.hash(contrasena, saltRounds);
};

// Función para validar formato de correo
const validarFormatoCorreo = (correo) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(correo);
};

// Función para limpiar códigos expirados
const limpiarCodigosExpirados = () => {
  const ahora = Date.now();
  for (const [key, datos] of codigosRecuperacion.entries()) {
    if (ahora - datos.timestamp > 600000) { // 10 minutos
      codigosRecuperacion.delete(key);
    }
  }
};

// Función para crear contenido del correo de recuperación
const crearContenidoCorreoRecuperacion = (codigo, nombreUsuario) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2; text-align: center;">Recuperación de Contraseña</h2>
      <p>Hola <strong>${nombreUsuario}</strong>,</p>
      <p>Has solicitado recuperar tu contraseña. Tu código de verificación es:</p>
      <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
        <h1 style="color: #1976d2; font-size: 36px; margin: 0; letter-spacing: 5px;">${codigo}</h1>
      </div>
      <p><strong>Este código expira en 10 minutos.</strong></p>
      <p>Si no solicitaste este código, puedes ignorar este mensaje de forma segura.</p>
      <hr style="margin: 30px 0;">
      <p style="font-size: 12px; color: #666;">
        Este es un mensaje automático, por favor no responder a este correo.
      </p>
    </div>
  `;
};

// Limpiar códigos expirados cada 5 minutos
setInterval(limpiarCodigosExpirados, 300000);

/*
RUTA POST: VERIFICAR USUARIO Y CORREO
Verifica si el usuario y correo coinciden en la base de datos usando procedimientos almacenados.
*/
router.post("/verificar-usuario-correo", async (req, res) => {
  try {
    const { usuario, correo } = req.body;

    if (!usuario || !correo) {
      return res.status(400).json({
        success: false,
        mensaje: 'Usuario y correo son requeridos'
      });
    }

    if (!validarFormatoCorreo(correo)) {
      return res.status(400).json({
        success: false,
        mensaje: 'El formato del correo no es válido'
      });
    }

    // Usar la función verificar_usuario_para_recuperacion para validar usuario y correo
    const consultaVerificacion = 'SELECT * FROM verificar_usuario_para_recuperacion($1, $2)';
    const resultadoVerificacion = await pool.query(consultaVerificacion, [usuario, correo]);

    if (resultadoVerificacion.rows.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: 'Usuario o correo incorrectos'
      });
    }

    const usuarioData = resultadoVerificacion.rows[0];

    // Verificar si encontró el usuario (la función debe retornar los datos si existe)
    if (!usuarioData.id_usuario) {
      return res.status(404).json({
        success: false,
        mensaje: 'Usuario o correo incorrectos'
      });
    }

    // Generar y hashear código de recuperación
    const codigo = generarCodigoRecuperacion();
    const codigoHasheado = await hashearCodigo(codigo);

    // Almacenar en memoria temporal
    const claveRecuperacion = `${usuarioData.id_usuario}_${correo}`;
    codigosRecuperacion.set(claveRecuperacion, {
      codigoHasheado,
      timestamp: Date.now(),
      intentos: 0,
      verificado: false,
      idUsuario: usuarioData.id_usuario,
      nombre: usuarioData.nombre
    });

    // Configurar y enviar correo
    const mailOptions = {
      from: process.env.EMAIL_CRED,
      to: correo,
      subject: 'Código de Recuperación de Contraseña',
      html: crearContenidoCorreoRecuperacion(codigo, usuarioData.nombre)
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      mensaje: 'Código de recuperación enviado exitosamente',
      claveRecuperacion: claveRecuperacion
    });

  } catch (error) {
    console.error('Error verificando usuario y correo:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      details: error.message
    });
  }
});

/*
RUTA POST: VERIFICAR CÓDIGO DE RECUPERACIÓN
Verifica si el código de recuperación ingresado es correcto.
*/
router.post("/verificar-codigo-recuperacion", async (req, res) => {
  try {
    const { claveRecuperacion, codigo } = req.body;

    if (!claveRecuperacion || !codigo) {
      return res.status(400).json({
        success: false,
        mensaje: 'Clave de recuperación y código son requeridos'
      });
    }

    if (codigo.length !== 6) {
      return res.status(400).json({
        success: false,
        mensaje: 'El código debe tener 6 dígitos'
      });
    }

    const datosRecuperacion = codigosRecuperacion.get(claveRecuperacion);
    
    if (!datosRecuperacion) {
      return res.status(404).json({
        success: false,
        mensaje: 'No se encontró un código de recuperación válido'
      });
    }

    // Verificar expiración
    const tiempoTranscurrido = Date.now() - datosRecuperacion.timestamp;
    if (tiempoTranscurrido > 600000) { // 10 minutos
      codigosRecuperacion.delete(claveRecuperacion);
      return res.status(410).json({
        success: false,
        mensaje: 'El código de recuperación ha expirado'
      });
    }

    // Verificar intentos máximos
    if (datosRecuperacion.intentos >= 3) {
      codigosRecuperacion.delete(claveRecuperacion);
      return res.status(429).json({
        success: false,
        mensaje: 'Demasiados intentos fallidos. Solicita un nuevo código'
      });
    }

    // Verificar el código
    const codigoValido = await verificarCodigoHasheado(codigo, datosRecuperacion.codigoHasheado);
    
    if (!codigoValido) {
      datosRecuperacion.intentos += 1;
      codigosRecuperacion.set(claveRecuperacion, datosRecuperacion);
      
      return res.status(400).json({
        success: false,
        mensaje: `Código incorrecto. Te quedan ${3 - datosRecuperacion.intentos} intentos.`
      });
    }

    // Código verificado correctamente
    datosRecuperacion.verificado = true;
    codigosRecuperacion.set(claveRecuperacion, datosRecuperacion);
    
    res.status(200).json({
      success: true,
      mensaje: 'Código verificado exitosamente',
      claveRecuperacion: claveRecuperacion
    });

  } catch (error) {
    console.error('Error verificando código de recuperación:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      details: error.message
    });
  }
});

/*
RUTA POST: ACTUALIZAR CONTRASEÑA
Actualiza la contraseña del usuario después de verificar el código usando procedimientos almacenados.
*/
router.post("/actualizar-contrasena", async (req, res) => {
  try {
    const { claveRecuperacion, nuevaContrasena, confirmarContrasena } = req.body;

    if (!claveRecuperacion || !nuevaContrasena || !confirmarContrasena) {
      return res.status(400).json({
        success: false,
        mensaje: 'Todos los campos son requeridos'
      });
    }

    if (nuevaContrasena !== confirmarContrasena) {
      return res.status(400).json({
        success: false,
        mensaje: 'Las contraseñas no coinciden'
      });
    }

    if (nuevaContrasena.length < 6) {
      return res.status(400).json({
        success: false,
        mensaje: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const datosRecuperacion = codigosRecuperacion.get(claveRecuperacion);
    
    if (!datosRecuperacion) {
      return res.status(404).json({
        success: false,
        mensaje: 'Sesión de recuperación no válida'
      });
    }

    if (!datosRecuperacion.verificado) {
      return res.status(400).json({
        success: false,
        mensaje: 'Debes verificar el código antes de cambiar la contraseña'
      });
    }

    // Verificar expiración
    const tiempoTranscurrido = Date.now() - datosRecuperacion.timestamp;
    if (tiempoTranscurrido > 900000) { // 15 minutos para cambiar contraseña
      codigosRecuperacion.delete(claveRecuperacion);
      return res.status(410).json({
        success: false,
        mensaje: 'La sesión de recuperación ha expirado'
      });
    }

    // Hashear nueva contraseña
    const nuevaContrasenaHasheada = await hashearContrasena(nuevaContrasena);

    // Usar el procedimiento actualizar_usuarios para cambiar la contraseña
    const consultaActualizacion = 'CALL actualizar_usuarios($1, NULL, $2, NULL)';
    
    await pool.query(consultaActualizacion, [
      datosRecuperacion.idUsuario,
      nuevaContrasenaHasheada
    ]);

    // Verificar que la actualización fue exitosa usando obtener_cliente_por_id
    const consultaVerificacion = 'SELECT * FROM obtener_cliente_por_id($1)';
    const resultadoVerificacion = await pool.query(consultaVerificacion, [datosRecuperacion.idUsuario]);

    if (resultadoVerificacion.rows.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: 'Error al verificar la actualización de contraseña'
      });
    }

    // Limpiar datos de recuperación
    codigosRecuperacion.delete(claveRecuperacion);

    res.status(200).json({
      success: true,
      mensaje: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando contraseña:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      details: error.message
    });
  }
});

/*
RUTA POST: REENVIAR CÓDIGO DE RECUPERACIÓN
Reenvía un código de recuperación.
*/
router.post("/reenviar-codigo-recuperacion", async (req, res) => {
  try {
    const { claveRecuperacion } = req.body;

    if (!claveRecuperacion) {
      return res.status(400).json({
        success: false,
        mensaje: 'Clave de recuperación es requerida'
      });
    }

    const datosRecuperacion = codigosRecuperacion.get(claveRecuperacion);
    
    if (!datosRecuperacion) {
      return res.status(404).json({
        success: false,
        mensaje: 'Sesión de recuperación no encontrada'
      });
    }

    // Verificar límite de tiempo para reenvío
    const tiempoTranscurrido = Date.now() - datosRecuperacion.timestamp;
    if (tiempoTranscurrido < 60000) { // 1 minuto
      const tiempoRestante = Math.ceil((60000 - tiempoTranscurrido) / 1000);
      return res.status(429).json({
        success: false,
        mensaje: `Debes esperar ${tiempoRestante} segundos antes de solicitar un nuevo código`
      });
    }

    // Generar nuevo código
    const codigo = generarCodigoRecuperacion();
    const codigoHasheado = await hashearCodigo(codigo);

    // Actualizar datos
    datosRecuperacion.codigoHasheado = codigoHasheado;
    datosRecuperacion.timestamp = Date.now();
    datosRecuperacion.intentos = 0;
    datosRecuperacion.verificado = false;
    codigosRecuperacion.set(claveRecuperacion, datosRecuperacion);

    // Obtener correo de la clave
    const correo = claveRecuperacion.split('_')[1];

    // Configurar y enviar correo
    const mailOptions = {
      from: process.env.EMAIL_CRED,
      to: correo,
      subject: 'Código de Recuperación de Contraseña - Reenvío',
      html: crearContenidoCorreoRecuperacion(codigo, datosRecuperacion.nombre)
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      mensaje: 'Código de recuperación reenviado exitosamente'
    });

  } catch (error) {
    console.error('Error reenviando código de recuperación:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      details: error.message
    });
  }
});

/*
RUTA GET: HEALTH CHECK
*/
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    mensaje: 'Servicio de recuperación de contraseña funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;


