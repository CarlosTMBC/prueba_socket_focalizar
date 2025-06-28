/*
RUTAS DE USUARIOS ADMINISTRADOR - usuariosRutas.js
Este archivo contiene las rutas para gestionar usuarios desde el panel de administrador,
incluyendo registro de usuarios simples y registro completo de cliente-usuario con suscripción.
*/

/*
IMPORTACIONES Y CONFIGURACIÓN
*/
const express = require('express');//Framework web para Node.js
const router = express.Router();//Router de Express para definir rutas
const bcrypt = require('bcrypt');//Librería para hash de contraseñas
const { Pool } = require('pg'); // Pool de conexiones de PostgreSQL
require('dotenv').config();     // Carga variables de entorno
const {RegistroUsuario} = require('../../modelos/modelRegistrarUsuarios'); //Modelo para validación de usuarios
const db = require('../conexion'); // 🔧 Agregado para que funcionen los db.query()

// Creamos pool para operaciones con transacción (sin tocar conexion.js)
const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

/*
RUTA POST: REGISTRAR USUARIO SIMPLE
Registra un nuevo usuario en el sistema con validación de datos.
Verifica que el nombre de usuario no exista y hashea la contraseña.
*/
router.post('/', async (req, res) => {
  // Ahora extraemos password_hash (no `contrasena`)
  const { nombre, password_hash } = req.body;
  const rol_id_por_defecto = 1;

  // 1) Validación de campos
  const nuevoUsuario = new RegistroUsuario(nombre, password_hash, rol_id_por_defecto);
  if (!nuevoUsuario.esValido()) {
    return res.status(400).json({ success: false, mensaje: 'Datos inválidos' });
  }

  // 2) Obtenemos los datos ya sanitizados
  const {
    nombre: cleanNombre,
    password_hash: cleanPass,
    rol_id: cleanRol
  } = nuevoUsuario.obtenerDatos();

  try {
    // 3) Verificar que el nombre no exista ya
    const existe = await db.query(
      'SELECT 1 FROM usuarios WHERE nombre = $1',
      [cleanNombre]
    );
    if (existe.rows.length > 0) {
      return res.status(409).json({ success: false, mensaje: 'Usuario ya en uso, usa otro' });
    }

    // 4) Hashear la contraseña
    const hashedPassword = await bcrypt.hash(cleanPass, 12);

    // 5) Llamar al SP
    await db.query(
      'CALL insertar_usuarios($1, $2, $3)',
      [cleanNombre, hashedPassword, cleanRol]
    );

    return res.status(201).json({
      success: true,
      mensaje: 'Usuario registrado correctamente'
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'Error en el servidor',
      detalle: error.message
    });
  }
});

/*
RUTA POST: REGISTRO COMPLETO CLIENTE-USUARIO CON SUSCRIPCIÓN
Registra un cliente completo con usuario, datos personales, suscripción y pago inicial.
Utiliza transacciones para garantizar la integridad de los datos.
*/
router.post('/registroClienteUsuario', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    console.log('--- INICIO DE TRANSACCIÓN ---');

    const {
      nombre, usuario, correo, contrasena,
      telefono, direccion, plan, periodo, contrato,
      departamento, 
      municipio
    } = req.body;

    console.log('📥 Datos recibidos del frontend:', {
      nombre, usuario, correo, telefono, direccion, plan, periodo, contrato
    });

    const periodoInt = parseInt(periodo);
    if (isNaN(periodoInt) || periodoInt <= 0) {
      throw new Error(`❌ Periodo inválido: ${periodo}`);
    }

    console.log('✅ Periodo numérico validado:', periodoInt);

    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Obtener dinámicamente el rol "cliente"
    const { rows: rolRows } = await client.query(
      `SELECT id_rol FROM rol WHERE LOWER(nombre) = 'cliente' LIMIT 1`
    );
    if (rolRows.length === 0) {
      throw new Error('❌ Rol "cliente" no encontrado en la tabla rol');
    }
    const rol_id_cliente = rolRows[0].id_rol;

    // INSERTAR USUARIO
    console.log('📤 Insertando en USUARIOS...');
    const usuarioResult = await client.query(
      `INSERT INTO usuarios (nombre, password_hash, rol_id, eliminado)
       VALUES ($1, $2, $3, false)
       RETURNING id_usuario`,
      [usuario, hashedPassword, rol_id_cliente]
    );
    const usuario_id = usuarioResult.rows[0].id_usuario;
    console.log('✅ Usuario creado con ID:', usuario_id);

    // INSERTAR CLIENTE
    console.log('📤 Insertando en CLIENTES...');
    const clienteResult = await client.query(
      `INSERT INTO clientes (
        nombre, correo_electronico, password_hash,
        telefono, direccion, tiempo_entrega,
        rol_id, usuario_id, eliminado,
        departamento, municipio
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, $9, $10)
       RETURNING id_cliente`,
      [
        nombre,
        correo,
        hashedPassword,
        telefono,
        direccion,
        periodoInt,
        rol_id_cliente,
        usuario_id,
        departamento, 
        municipio
      ]
    );
    const cliente_id = clienteResult.rows[0].id_cliente;
    console.log('✅ Cliente creado con ID:', cliente_id);

    // INSERTAR SUSCRIPCIÓN
    const fechaInicio = new Date();
    const fechaFin = new Date();
    fechaFin.setMonth(fechaFin.getMonth() + periodoInt);

    console.log('📤 Insertando en SUSCRIPCIONES...');
    const suscripcionResult = await client.query(
      `INSERT INTO suscripciones (
        cliente_id, fecha_inicio, fecha_fin,
        estado, eliminado
      ) VALUES ($1, $2, $3, 'Activa', false)
       RETURNING id_suscripcion`,
      [cliente_id, fechaInicio, fechaFin]
    );
    const suscripcion_id = suscripcionResult.rows[0].id_suscripcion;
    console.log('✅ Suscripción creada con ID:', suscripcion_id);

    // INSERTAR PAGO DE PRUEBA
    console.log('📤 Insertando en PAGOS_SUSCRIPCIÓN...');
    await client.query(
      `INSERT INTO pagos_suscripcion (
        suscripcion_id, monto, fecha_pago,
        tipo_cuota, estado, referencia_transaccion
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        suscripcion_id,
        0.00,
        new Date(),
        periodoInt,
        'Pendiente',
        'N/A'
      ]
    );
    console.log('✅ Pago de prueba registrado');

    await client.query('COMMIT');
    console.log('✅ TRANSACCIÓN COMPLETADA CON ÉXITO');
    res.status(201).json({ mensaje: 'Cliente, usuario y pago de prueba registrados correctamente' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en registro completo:', error);
    res.status(500).json({ error: 'Error al registrar cliente, usuario o suscripción' });
  } finally {
    client.release();
    console.log('🔚 Conexión liberada');
  }
});



/*
RUTA POST: VALIDAR DISPONIBILIDAD DE NOMBRE DE USUARIO
Verifica si el nombre de usuario está disponible.
*/
router.post('/verificar-usuario', async (req, res) => {
  const { usuario, correo } = req.body;

  if ((!usuario || typeof usuario !== 'string' || usuario.trim() === '') &&
      (!correo || typeof correo !== 'string' || correo.trim() === '')) {
    return res.status(400).json({ disponible: false, mensaje: 'Se requiere usuario o correo electrónico válido' });
  }

  try {
    const pool = new Pool({
      user: process.env.DB_USERNAME,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });

    let disponible = true;
    let mensaje = 'Disponible';

    if (usuario) {
      const resultUsuario = await pool.query(
        'SELECT 1 FROM usuarios WHERE LOWER(nombre) = LOWER($1) LIMIT 1',
        [usuario.trim()]
      );
      if (resultUsuario.rows.length > 0) {
        disponible = false;
        mensaje = 'Nombre de usuario no disponible';
      }
    }

    if (correo && disponible) {
      const resultCorreo = await pool.query(
        'SELECT 1 FROM clientes WHERE LOWER(correo_electronico) = LOWER($1) LIMIT 1',
        [correo.trim()]
      );
      if (resultCorreo.rows.length > 0) {
        disponible = false;
        mensaje = 'Correo electrónico ya registrado';
      }
    }

    res.json({ disponible, mensaje });

  } catch (error) {
    console.error('Error al validar nombre de usuario o correo:', error.message);
    res.status(500).json({ disponible: false, mensaje: 'Error del servidor' });
  }
});

module.exports = router;