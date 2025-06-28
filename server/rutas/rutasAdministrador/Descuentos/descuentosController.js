/*
CONTROLADOR DE DESCUENTOS - descuentosController.js
Este archivo contiene las funciones para gestionar descuentos, incluyendo la obtención
de datos para filtros, la creación, lectura, actualización y eliminación de descuentos.
*/

/*
IMPORTACIONES Y CONFIGURACIÓN
*/
const express = require("express");
const router = express.Router();
const db = require("../../../conexion");
/*
FUNCIÓN: OBTENER PROVEEDORES PARA EL FILTRO
Obtiene todos los proveedores de la base de datos para ser utilizados en un filtro.
Retorna un arreglo de objetos con los campos 'value' (id_proveedor) y 'label' (nombre).
*/

const getProveedoresParaFiltro = async (req, res) => {
    console.log("Backend: Solicitud GET /datos-filtros/proveedores recibida.");
    try {
        const query = 'SELECT id_proveedor AS value, nombre AS label FROM proveedores ORDER BY nombre';
        const result = await db.query(query);
        console.log(`Backend: Devolviendo ${result.rows.length} proveedores formateados.`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error en getProveedoresParaFiltro:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener proveedores.', detalle: error.message });
    }
};

/*
FUNCIÓN: OBTENER CATEGORÍAS PARA EL FILTRO
Obtiene todas las categorías de la base de datos para ser utilizadas en un filtro.
Si se proporciona una marca, filtra las categorías por esa marca utilizando un JOIN con productos.
Retorna un arreglo de objetos con los campos 'value' (id_categoria) y 'label' (nombre).
*/

const getCategoriasParaFiltro = async (req, res) => {
    const { marca } = req.query;

    try {
        let queryText = '';
        const queryParams = [];

        if (marca) {
            queryText = `
                SELECT DISTINCT c.id_categoria AS value, c.nombre AS label
                FROM categorias c
                JOIN productos p ON c.id_categoria = p.categoria_id
                WHERE p.marca = $1 -- Filtra por la marca proporcionada
                ORDER BY c.nombre;
            `;
            queryParams.push(marca);
            console.log("Backend: Ejecutando consulta de categorías filtradas por marca.");
        } else {
            queryText = 'SELECT id_categoria AS value, nombre AS label FROM categorias ORDER BY nombre';
            console.log("Backend: Ejecutando consulta de todas las categorías.");
        }

        const result = await db.query(queryText, queryParams);

        res.json(result.rows);

    } catch (error) {
        console.error('Error en getCategoriasParaFiltro:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener categorías.', detalle: error.message });
    }
};


/*
FUNCIÓN: OBTENER PRODUCTOS FILTRADOS
Obtiene productos filtrados por categoría, término de búsqueda y marca.
Retorna un arreglo de objetos con los datos de los productos.
*/

const getProductosFiltrados = async (req, res) => {
    const { categoriaId, searchTerm, marca, page = 1, limit = 10 } = req.query;

    try {
        const offset = (page - 1) * limit;
        
        let baseQuery = `FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id_categoria WHERE 1=1`;
        const queryParams = [];
        let paramIndex = 1;

        if (searchTerm) {
            const searchCondition = ` AND (LOWER(p.nombre) LIKE LOWER($${paramIndex}) OR LOWER(p.descripcion) LIKE LOWER($${paramIndex}))`;
            baseQuery += searchCondition;
            queryParams.push(`%${searchTerm}%`);
            paramIndex++;
        }

        const countQueryText = `SELECT COUNT(*) ${baseQuery}`;

        const dataQueryText = `
            SELECT
                p.id_producto, p.nombre, p.descripcion, p.precio_venta,
                p.categoria_id, c.nombre AS categoria_nombre,
                p.marca
            ${baseQuery}
            ORDER BY p.nombre
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
        `;
        
        const totalResult = await db.query(countQueryText, queryParams);
        const totalItems = parseInt(totalResult.rows[0].count, 10);

        const result = await db.query(dataQueryText, [...queryParams, limit, offset]);

        res.json({
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: parseInt(page, 10),
            productos: result.rows
        });

    } catch (error) {
        console.error("Error en getProductosFiltrados:", error);
        res.status(500).json({ message: 'Error interno del servidor al obtener productos.', detalle: error.message });
    }
};


const verificarDescuentoActivo = async (req, res) => {
    const { id_producto } = req.query;

    if (!id_producto) {
        return res.status(400).json({ error: "El id_producto es requerido." });
    }

    try {
        const query = `
            SELECT 
                d.id_descuento,
                d.nombre,
                d.activo,
                d.fecha_fin
            FROM descuentos d
            JOIN tipos_descuento td ON d.id_descuento = td.id_descuento
            JOIN aplicaciones_descuento ad ON td.id_tipo_descuento = ad.id_tipo_descuento
            WHERE ad.id_producto = $1
              AND d.activo = TRUE
              AND d.eliminado = FALSE
              AND d.fecha_fin >= CURRENT_DATE;
        `;
        
        const result = await db.query(query, [parseInt(id_producto, 10)]);

        if (result.rows.length > 0) {
            res.json({ activo: true, descuento: result.rows[0] });
        } else {
            res.json({ activo: false });
        }
    } catch (error) {
        console.error("Error al verificar descuento activo:", error);
        res.status(500).json({ error: "Error interno al verificar el descuento activo", detalle: error.message });
    }
};

/*
FUNCIÓN: CREAR DESCUENTO
Crea un nuevo descuento utilizando un procedimiento almacenado.
Valida los datos de entrada y retorna un mensaje de éxito o error.
*/

const createDescuento = async (req, res) => {
    const {
        nombre,
        descripcion,
        fecha_inicio,
        fecha_fin,
        id_producto,
        tipo_descuento,
        valor
    } = req.body;

    const activo = true;
    const eliminado = false;

    try {
        const productoResult = await db.query(
            'SELECT precio_venta FROM productos WHERE id_producto = $1 AND eliminado = false',
            [id_producto]
        );

        if (productoResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }


        const descuentoExistente = await db.query(`
            SELECT 1
            FROM descuentos d
            JOIN aplicaciones_descuento ad ON d.id_descuento = ad.id_descuento
            WHERE ad.id_producto = $1 AND d.activo = true AND d.eliminado = false
        `, [id_producto]);

        if (descuentoExistente.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un descuento activo para este producto.'
            });
        }

        const precioOriginal = parseFloat(productoResult.rows[0].precio_venta);
        let nuevoPrecio = precioOriginal;

        if (tipo_descuento === 'porcentaje') {
            nuevoPrecio -= (precioOriginal * (valor / 100));
        } else if (tipo_descuento === 'monto_fijo') {
            nuevoPrecio -= valor;
        }

        if (nuevoPrecio < 0) nuevoPrecio = 0;
        const descuentoInsert = await db.query(
            `INSERT INTO descuentos (
                nombre, descripcion, fecha_inicio, fecha_fin, activo, eliminado
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id_descuento`,
            [nombre, descripcion, fecha_inicio, fecha_fin, activo, eliminado]
        );

        const id_descuento = descuentoInsert.rows[0].id_descuento;

        await db.query(
            'CALL insertar_tipos_descuento($1, $2, $3)',
            [
                id_descuento,
                tipo_descuento === 'porcentaje' ? valor : null,
                tipo_descuento === 'monto_fijo' ? valor : null
            ]
        );

        await db.query(
            'CALL insertar_aplicaciones_descuento($1, $2, NULL, $3)',
            [id_descuento, id_producto, 'producto']
        );
        await db.query(
            `UPDATE productos SET precio_descuento = $1 WHERE id_producto = $2`,
            [nuevoPrecio, id_producto]
        );

        return res.status(201).json({
            success: true,
            message: 'Descuento creado correctamente.',
            id_descuento,
            nuevo_precio: nuevoPrecio
        });

    } catch (error) {
        console.error('Error al crear y aplicar descuento:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al crear el descuento.',
            detalle: error.message
        });
    }
};



/*
FUNCIÓN: OBTENER TODOS LOS DESCUENTOS
Obtiene todos los descuentos de la base de datos.
Retorna un arreglo de objetos con los datos de los descuentos, incluyendo
los nombres de los productos y categorías asociadas.
*/

const getDescuentos = async (req, res) => {

    try {
        const query = `
            SELECT
                d.*,
                p.nombre AS producto_nombre,
                c.nombre AS categoria_nombre,
                COALESCE(p.marca, d.marca_producto) AS marca_aplicada -- Asumiendo que 'descuentos' también puede tener 'marca_producto'
            FROM descuentos d
            LEFT JOIN productos p ON d.id_producto = p.id_producto
            LEFT JOIN categorias c ON d.id_categoria = c.id_categoria
            ORDER BY d.id_descuento DESC;
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor al obtener descuentos.', detalle: error.message });
    }
};

/*
FUNCIÓN: OBTENER UN DESCUENTO POR ID
Obtiene un descuento específico por su ID.
Retorna un objeto con los datos del descuento, incluyendo los nombres
de los productos y categorías asociadas.
*/

const getDescuentoById = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT
                d.*,
                p.nombre AS producto_nombre,
                c.nombre AS categoria_nombre,
                 COALESCE(p.marca, d.marca_producto) AS marca_aplicada
            FROM descuentos d
            LEFT JOIN productos p ON d.id_producto = p.id_producto
            LEFT JOIN categorias c ON d.id_categoria = c.id_categoria
            WHERE d.id_descuento = $1;
        `;
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Descuento no encontrado.' });
        }
        res.json(result.rows[0]);

    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor al obtener el descuento.', detalle: error.message });
    }
};

/*
FUNCIÓN: ACTUALIZAR UN DESCUENTO
Actualiza un descuento existente utilizando un procedimiento almacenado.
Valida los datos de entrada y retorna un mensaje de éxito o error.
*/

const updateDescuento = async (req, res) => {
    const { id } = req.params;
    const {
        nombre, descripcion, tipo_descuento, valor,
        fecha_inicio, fecha_fin, id_producto, id_categoria,
        marca_producto, estado 
    } = req.body;

    if (!nombre || !tipo_descuento || valor === undefined || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios.' });
    }

    try {

        const query = `CALL gestionar_descuentos(
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        );`; 
        const values = [
            'actualizar',
            id,
            nombre,
            descripcion || null,
            tipo_descuento, 
            valor,
            fecha_inicio,
            fecha_fin,
            id_producto || null,
            id_categoria || null,
            null, 
            estado || 'activo', 
            marca_producto || null 
        ];

        await db.query(query, values);

        res.json({ success: true, message: 'Descuento actualizado exitosamente via SP.', id_descuento: id });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar.', detalle: error.message });
    }
};

/*
FUNCIÓN: ELIMINAR DESCUENTO
Elimina un descuento existente utilizando un procedimiento almacenado.
Retorna un código 204 (No Content) en caso de éxito.
*/

const deleteDescuento = async (req, res) => {
    const { id } = req.params;
    try {
        const query = 'CALL gestionar_descuentos($1, $2);'; 
        const values = ['eliminar', id];

        await db.query(query, values);

        res.status(204).send(); 

    } catch (error) {

        res.status(500).json({ success: false, message: 'Error interno del servidor al eliminar.', detalle: error.message });
    }
};

// Exportar todas las funciones
module.exports = {
    getProveedoresParaFiltro,
    getCategoriasParaFiltro, 
    getProductosFiltrados, 
    createDescuento,
    getDescuentos,
    getDescuentoById,
    updateDescuento,
    deleteDescuento,
    verificarDescuentoActivo
};