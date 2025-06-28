/*
RUTAS DE VERIFICACIÓN DE CORREO - rutasVerificacionCorreo.js
Este archivo contiene las rutas para verificación de correos electrónicos,
incluyendo envío de códigos, verificación y gestión de estados.
*/

/*
IMPORTACIONES Y CONFIGURACIÓN
*/
const express = require("express"); // Framework web para Node.js
const router = express.Router(); // Router de Express para definir rutas
const nodemailer = require('nodemailer'); // Para envío de correos electrónicos
const crypto = require('crypto'); // Para generación de códigos seguros
const bcrypt = require('bcrypt'); // Para hasheo de códigos

// Almacenamiento temporal en memoria
const verificacionesTemporales = new Map();

// Configuración del transporter de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_CRED,
    pass: process.env.EMAIL_PASSWORD // Corregido: era EMAIL_PASS, ahora EMAIL_PASSWORD
  }
});

/*
FUNCIONES AUXILIARES
*/

// Función para generar código de verificación
const generarCodigoVerificacion = () => {
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

// Función para validar formato de correo
const validarFormatoCorreo = (correo) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(correo);
};

// Función para limpiar códigos expirados
const limpiarCodigosExpirados = () => {
  const ahora = Date.now();
  for (const [correo, datos] of verificacionesTemporales.entries()) {
    if (ahora - datos.timestamp > 600000) {
      verificacionesTemporales.delete(correo);
    }
  }
};

// Función para crear contenido del correo
const crearContenidoCorreo = (codigo, tipo = 'registro') => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2; text-align: center;">Código de Verificación</h2>
      <p>Hola,</p>
      <p>Has solicitado verificar tu correo electrónico. Tu código de verificación es:</p>
      <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
        <h1 style="color: #1976d2; font-size: 36px; margin: 0; letter-spacing: 5px;">${codigo}</h1>
      </div>
      <p><strong>Este código expira en 10 minutos.</strong></p>
      <p>Si no solicitaste este código, puedes ignorar este mensaje.</p>
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
RUTA GET: HEALTH CHECK
Verifica que el servicio esté funcionando correctamente.
*/
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    mensaje: 'Servicio de verificación de correo funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

/*
RUTA GET: OBTENER ESTADO DE VERIFICACIÓN
Obtiene el estado actual de verificación de un correo.
*/
router.get("/estado-verificacion/:correo", (req, res) => {
  try {
    const correo = decodeURIComponent(req.params.correo);

    if (!correo) {
      return res.status(400).json({
        success: false,
        mensaje: 'El correo es requerido'
      });
    }

    if (!validarFormatoCorreo(correo)) {
      return res.status(400).json({
        success: false,
        mensaje: 'El formato del correo no es válido'
      });
    }

    const datosVerificacion = verificacionesTemporales.get(correo);
    
    if (!datosVerificacion) {
      return res.status(404).json({
        success: false,
        mensaje: 'No se encontró información de verificación para este correo'
      });
    }

    const tiempoTranscurrido = Date.now() - datosVerificacion.timestamp;
    const tiempoRestante = Math.max(0, 600000 - tiempoTranscurrido); // 10 minutos

    res.status(200).json({
      success: true,
      correo,
      verificado: datosVerificacion.verificado,
      intentos: datosVerificacion.intentos,
      tiempoRestante: Math.ceil(tiempoRestante / 1000),
      expirado: tiempoRestante <= 0
    });

  } catch (error) {
    console.error('Error obteniendo estado de verificación:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      details: error.message
    });
  }
});

/*
RUTA POST: VERIFICAR EXISTENCIA DE CORREO
Verifica si un correo electrónico ya existe en el sistema o está en proceso de verificación.
*/
router.post("/verificar-correo-existencia", async (req, res) => {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({
        success: false,
        mensaje: 'El correo es requerido'
      });
    }

    if (!validarFormatoCorreo(correo)) {
      return res.status(400).json({
        success: false,
        mensaje: 'El formato del correo no es válido'
      });
    }

    const existeEnVerificacion = verificacionesTemporales.has(correo);
    
    res.status(200).json({
      success: true,
      existe: existeEnVerificacion,
      mensaje: existeEnVerificacion ? 'Correo en proceso de verificación' : 'Correo disponible'
    });

  } catch (error) {
    console.error('Error verificando existencia del correo:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      details: error.message
    });
  }
});

/*
RUTA POST: ENVIAR CÓDIGO DE VERIFICACIÓN
Genera y envía un código de verificación de 6 dígitos al correo especificado.
*/
router.post("/enviar-codigo-verificacion", async (req, res) => {
  try {
    const { correo, tipo = 'registro' } = req.body;

    if (!correo) {
      return res.status(400).json({
        success: false,
        mensaje: 'El correo es requerido'
      });
    }

    if (!validarFormatoCorreo(correo)) {
      return res.status(400).json({
        success: false,
        mensaje: 'El formato del correo no es válido'
      });
    }

    // Verificar límite de tiempo para reenvío
    const datosExistentes = verificacionesTemporales.get(correo);
    if (datosExistentes) {
      const tiempoTranscurrido = Date.now() - datosExistentes.timestamp;
      if (tiempoTranscurrido < 60000) {
        const tiempoRestante = Math.ceil((60000 - tiempoTranscurrido) / 1000);
        return res.status(429).json({
          success: false,
          mensaje: `Debes esperar ${tiempoRestante} segundos antes de solicitar un nuevo código`
        });
      }
    }

    // Generar y hashear código
    const codigo = generarCodigoVerificacion();
    const codigoHasheado = await hashearCodigo(codigo);

    // Almacenar en memoria temporal
    verificacionesTemporales.set(correo, {
      codigoHasheado,
      timestamp: Date.now(),
      tipo,
      intentos: 0,
      verificado: false
    });

    // Configurar y enviar correo
    const mailOptions = {
      from: process.env.EMAIL_CRED, // Corregido: usamos EMAIL_CRED directamente
      to: correo,
      subject: 'Código de Verificación - Registro',
      html: crearContenidoCorreo(codigo, tipo)
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      mensaje: 'Código de verificación enviado exitosamente',
      correo: correo
    });

  } catch (error) {
    console.error('Error enviando código de verificación:', error);
    verificacionesTemporales.delete(req.body.correo);
    
    res.status(500).json({
      success: false,
      mensaje: 'Error al enviar el código de verificación',
      details: error.message
    });
  }
});

/*
RUTA POST: REENVIAR CÓDIGO DE VERIFICACIÓN
Reenvía un código de verificación al correo especificado.
*/
router.post("/reenviar-codigo", async (req, res) => {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({
        success: false,
        mensaje: 'El correo es requerido'
      });
    }

    if (!validarFormatoCorreo(correo)) {
      return res.status(400).json({
        success: false,
        mensaje: 'El formato del correo no es válido'
      });
    }

    // Verificar si existe una verificación previa
    const datosExistentes = verificacionesTemporales.get(correo);
    if (datosExistentes) {
      const tiempoTranscurrido = Date.now() - datosExistentes.timestamp;
      if (tiempoTranscurrido < 60000) {
        const tiempoRestante = Math.ceil((60000 - tiempoTranscurrido) / 1000);
        return res.status(429).json({
          success: false,
          mensaje: `Debes esperar ${tiempoRestante} segundos antes de solicitar un nuevo código`
        });
      }
    }

    // Generar y hashear nuevo código
    const codigo = generarCodigoVerificacion();
    const codigoHasheado = await hashearCodigo(codigo);

    // Actualizar o crear datos de verificación
    verificacionesTemporales.set(correo, {
      codigoHasheado,
      timestamp: Date.now(),
      tipo: datosExistentes?.tipo || 'registro',
      intentos: 0,
      verificado: false
    });

    // Configurar y enviar correo
    const mailOptions = {
      from: process.env.EMAIL_CRED, // Corregido: usamos EMAIL_CRED directamente
      to: correo,
      subject: 'Código de Verificación - Reenvío',
      html: crearContenidoCorreo(codigo, 'reenvio')
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      mensaje: 'Código de verificación reenviado exitosamente',
      correo: correo
    });

  } catch (error) {
    console.error('Error reenviando código de verificación:', error);
    
    res.status(500).json({
      success: false,
      mensaje: 'Error al reenviar el código de verificación',
      details: error.message
    });
  }
});

/*
RUTA POST: VERIFICAR CÓDIGO
Verifica si el código ingresado por el usuario es correcto y válido.
*/
router.post("/verificar-codigo", async (req, res) => {
  try {
    const { correo, codigo, tipo = 'registro' } = req.body;

    if (!correo || !codigo) {
      return res.status(400).json({
        success: false,
        mensaje: 'Correo y código son requeridos'
      });
    }

    if (codigo.length !== 6) {
      return res.status(400).json({
        success: false,
        mensaje: 'El código debe tener 6 dígitos'
      });
    }

    const datosVerificacion = verificacionesTemporales.get(correo);
    
    if (!datosVerificacion) {
      return res.status(404).json({
        success: false,
        mensaje: 'No se encontró un código de verificación para este correo'
      });
    }

    // Verificar expiración
    const tiempoTranscurrido = Date.now() - datosVerificacion.timestamp;
    if (tiempoTranscurrido > 600000) {
      verificacionesTemporales.delete(correo);
      return res.status(410).json({
        success: false,
        mensaje: 'El código de verificación ha expirado'
      });
    }

    // Verificar intentos máximos
    if (datosVerificacion.intentos >= 3) {
      verificacionesTemporales.delete(correo);
      return res.status(429).json({
        success: false,
        mensaje: 'Demasiados intentos fallidos. Solicita un nuevo código'
      });
    }

    // Verificar el código
    const codigoValido = await verificarCodigoHasheado(codigo, datosVerificacion.codigoHasheado);
    
    if (!codigoValido) {
      datosVerificacion.intentos += 1;
      verificacionesTemporales.set(correo, datosVerificacion);
      
      return res.status(400).json({
        success: false,
        mensaje: `Código incorrecto. Te quedan ${3 - datosVerificacion.intentos} intentos.`
      });
    }

    // Código verificado correctamente
    datosVerificacion.verificado = true;
    verificacionesTemporales.set(correo, datosVerificacion);
    
    res.status(200).json({
      success: true,
      mensaje: 'Código verificado exitosamente',
      correo: correo
    });

  } catch (error) {
    console.error('Error verificando código:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
      details: error.message
    });
  }
});

module.exports = router;