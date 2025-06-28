const express = require("express");
const router = express.Router();
const db = require("../../../conexion");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});



// --- UTILIDADES (Se mantienen igual) ---

const processBase64ToBuffer = (imageData) => {
    if (!imageData || Buffer.isBuffer(imageData)) return null;
    try {
        let mimeType = '';
        let cleanBase64 = '';
        if (imageData.includes(',')) {
            const parts = imageData.split(',');
            const header = parts[0];
            cleanBase64 = parts[1];
            const mimeMatch = header.match(/data:image\/([a-zA-Z]+);base64/);
            if (mimeMatch) mimeType = mimeMatch[1].toLowerCase();
        } else {
            cleanBase64 = imageData.replace(/^data:image\/[a-z]+;base64,/, '').trim();
            mimeType = 'unknown';
        }
        if (mimeType !== 'unknown' && !['png', 'jpg', 'jpeg'].includes(mimeType)) {
            throw new Error('Solo se aceptan imágenes PNG y JPG');
        }
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64) || cleanBase64.length % 4 !== 0) {
            throw new Error('Formato de imagen inválido');
        }
        const buffer = Buffer.from(cleanBase64, 'base64');
        if (buffer.length === 0) throw new Error('Imagen vacía');
        return { buffer, mimeType };
    } catch (error) {
        console.error('Error procesando imagen:', error.message);
        throw error;
    }
};

const bufferToDataURL = (buffer) =>
    buffer && Buffer.isBuffer(buffer) ?
    `data:image/jpeg;base64,${buffer.toString('base64')}` :
    null;

const validarTelefono = (telefono) => {
    if (!telefono || telefono.toString().trim() === '') return { valido: true, telefono: null };
    const telefonoLimpio = telefono.toString().replace(/\D/g, '');
    if (telefonoLimpio.length !== 8) return { valido: false, mensaje: "El teléfono debe tener exactamente 8 dígitos numéricos" };
    if (!/^\d{8}$/.test(telefonoLimpio)) return { valido: false, mensaje: "El teléfono solo puede contener números" };
    return { valido: true, telefono: telefonoLimpio };
};


// --- RUTAS ACTUALIZADAS PARA USAR FUNCIONES DE POSTGRESQL ---

// GET - Obtener cliente por ID
router.get("/:id_cliente", async (req, res) => {
    try {
        // AHORA: Llamamos a la función de DB que hace todo el trabajo.
        const result = await db.query('SELECT * FROM obtener_cliente_por_id($1)', [req.params.id_cliente]);

        if (!result.rows.length) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }
        const cliente = result.rows[0];
        cliente.foto_perfil = bufferToDataURL(cliente.foto_perfil_raw);
        delete cliente.foto_perfil_raw;
        res.json(cliente);
    } catch (error) {
        console.error("Error al obtener cliente:", error.message);
        res.status(500).json({ error: "Error al obtener los datos del cliente" });
    }
});

// POST - Verificar contraseña actual
router.post("/verificar-contrasena/:id_cliente", async (req, res) => {
    const { contrasena_actual } = req.body;
    if (!contrasena_actual) {
        return res.status(400).json({ error: "La contraseña actual es requerida" });
    }
    try {
        // AHORA: Llamamos a la función específica para obtener el hash.
        const result = await db.query('SELECT * FROM verificar_contrasena_actual($1)', [req.params.id_cliente]);
        if (!result.rows.length) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }
        const esValida = await bcrypt.compare(contrasena_actual, result.rows[0].password_hash);
        res.json({ es_valida: esValida });
    } catch (error) {
        console.error("Error al verificar contraseña:", error.message);
        res.status(500).json({ error: "Error al verificar la contraseña" });
    }
});

// POST - Verificar disponibilidad de nombre de usuario
router.post("/verificar-nombre-usuario", async (req, res) => {
    const { nombre_usuario, id_cliente } = req.body;
    if (!nombre_usuario || nombre_usuario.trim() === '') {
        return res.status(400).json({ error: "El nombre de usuario es requerido" });
    }
    try {
        // AHORA: Llamamos a la función que maneja toda la lógica de verificación.
        const result = await db.query('SELECT * FROM verificar_disponibilidad_nombre_usuario($1, $2)', [nombre_usuario.trim(), id_cliente || null]);
        // Si la función devuelve 0 filas, el nombre está disponible.
        const disponible = result.rows.length === 0;
        res.json({ disponible });
    } catch (error) {
        console.error("Error al verificar nombre de usuario:", error.message);
        res.status(500).json({ error: "Error al verificar el nombre de usuario" });
    }
});

// POST - Verificar disponibilidad de correo electrónico
router.post("/verificar-correo-electronico", async (req, res) => {
    const { correo_electronico, id_cliente } = req.body;
    if (!correo_electronico || correo_electronico.trim() === '') {
        return res.status(400).json({ error: "El correo electrónico es requerido" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo_electronico.trim())) {
        return res.status(400).json({ error: "El formato del correo electrónico no es válido" });
    }
    try {
        // AHORA: Llamamos a la función que maneja la lógica de verificación.
        const result = await db.query('SELECT * FROM verificar_disponibilidad_correo($1, $2)', [correo_electronico.trim(), id_cliente || null]);
        const disponible = result.rows.length === 0;
        res.json({ disponible });
    } catch (error) {
        console.error("Error al verificar correo electrónico:", error.message);
        res.status(500).json({ error: "Error al verificar el correo electrónico" });
    }
});

// PUT - Actualizar cliente (Ruta simplificada)
router.put("/actualizar/:id_cliente", async (req, res) => {
    const { nombre, correo_electronico, telefono, direccion, departamento, municipio, contrasena, nombre_usuario } = req.body;

    // 1. Validaciones básicas de entrada
    if (!nombre || !correo_electronico || !nombre_usuario) {
        return res.status(400).json({ error: "El nombre, correo electrónico y nombre de usuario son obligatorios" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo_electronico.trim())) {
        return res.status(400).json({ error: "El formato del correo electrónico no es válido" });
    }
    const validacionTelefono = validarTelefono(telefono);
    if (!validacionTelefono.valido) {
        return res.status(400).json({ error: validacionTelefono.mensaje });
    }

    // 2. Hashear contraseña si se proporciona
    let passwordHash = null;
    if (contrasena && contrasena.trim() !== '') {
        if (contrasena.trim().length < 6) {
            return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
        }
        passwordHash = await bcrypt.hash(contrasena.trim(), 12);
    }

    try {
        // 3. AHORA: Se hace UNA SOLA LLAMADA a la base de datos.
        // La función 'actualizar_cliente_completo' se encarga de todo:
        // - Verificar duplicados de correo y usuario
        // - Llamar a los procedimientos de actualización
        // - Devolver el resultado final
        const result = await db.query(
            'SELECT * FROM actualizar_cliente_completo($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [
                req.params.id_cliente,
                nombre.trim(),
                correo_electronico.trim().toLowerCase(),
                validacionTelefono.telefono,
                direccion,
                departamento,
                municipio,
                nombre_usuario.trim(),
                passwordHash
            ]
        );

        const response = result.rows[0];

        // 4. La DB nos dice si la operación fue exitosa.
        if (!response.success) {
            return res.status(400).json({ error: response.message });
        }

        // 5. Si fue exitosa, preparamos y enviamos la respuesta.
        const clienteData = response.cliente_data;
        clienteData.foto_perfil = bufferToDataURL(clienteData.foto_perfil_raw);
        delete clienteData.foto_perfil_raw;

        res.json({
            mensaje: response.message,
            cliente: clienteData
        });

    } catch (error) {
        console.error("Error en la ruta de actualización:", error);
        res.status(500).json({ error: "Error interno al actualizar el perfil" });
    }
});

// PUT - Actualizar foto de perfil (Ruta simplificada)
router.put("/foto-perfil/:id_cliente", async (req, res) => {
    const { imagen } = req.body;
    if (!imagen) {
        return res.status(400).json({ error: "La imagen es requerida" });
    }

    try {
        let imageResult;
        try {
            imageResult = processBase64ToBuffer(imagen);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }

        if (imageResult.buffer.length > 10 * 1024 * 1024) { // Límite de 10MB
            return res.status(400).json({ error: "La imagen es demasiado grande (máximo 10MB)" });
        }

        // AHORA: Llamamos a la función de DB que maneja la lógica de insertar o actualizar.
        const result = await db.query('SELECT * FROM actualizar_foto_perfil_cliente($1, $2)', [req.params.id_cliente, imageResult.buffer]);
        const response = result.rows[0];

        if (!response.success) {
            return res.status(400).json({ error: response.message });
        }
        res.json({ mensaje: response.message });

    } catch (error) {
        console.error("Error al actualizar foto de perfil:", error.message);
        res.status(500).json({ error: "Error interno al actualizar la foto de perfil" });
    }
});

// DELETE - Eliminar foto de perfil (Ruta simplificada)
router.delete("/foto-perfil/:id_cliente", async (req, res) => {
    try {
        // AHORA: La función de DB maneja la verificación y eliminación.
        const result = await db.query('SELECT * FROM eliminar_foto_perfil_cliente($1)', [req.params.id_cliente]);
        const response = result.rows[0];

        if (!response.success) {
            const statusCode = response.message.includes('encontrado') ? 404 : 400;
            return res.status(statusCode).json({ error: response.message });
        }
        res.json({ mensaje: response.message });

    } catch (error) {
        console.error("Error al eliminar foto de perfil:", error.message);
        res.status(500).json({ error: "Error interno al eliminar la foto de perfil" });
    }
});

module.exports = router;