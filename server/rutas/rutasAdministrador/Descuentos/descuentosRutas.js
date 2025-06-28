
// rutas/descuentosRutas.js
const express = require('express');
const router = express.Router();
// Asegúrate que la ruta al controlador sea correcta
const descuentosController = require('../../../rutas/rutasAdministrador/Descuentos/descuentosController');

// --- Rutas para obtener datos para los filtros de NuevoDescuento ---

// GET /descuentos/datos-filtros/proveedores - Obtener proveedores para el dropdown
router.get('/datos-filtros/proveedores', descuentosController.getProveedoresParaFiltro);

// GET /descuentos/datos-filtros/categorias - Obtener categorías para el dropdown
router.get('/datos-filtros/categorias', descuentosController.getCategoriasParaFiltro);

// GET /descuentos/datos-filtros/productos - Obtener productos filtrados
// Query Params: ?proveedorId=X&categoriaId=Y&searchTerm=Z
router.get('/datos-filtros/productos', descuentosController.getProductosFiltrados);

router.get('/verificar-descuento-activo', descuentosController.verificarDescuentoActivo);

// --- Ruta para la gestión principal de Descuentos ---

// POST /descuentos - Crear un nuevo descuento (desde agregarDescuento.js)
router.post('/', descuentosController.createDescuento);

// GET /descuentos - Obtener todos los descuentos (para la vista principal de descuentos)
router.get('/', descuentosController.getDescuentos);

// GET /descuentos/:id - Obtener un descuento por ID (para editar)
router.get('/:id', descuentosController.getDescuentoById);

// PUT /descuentos/:id - Actualizar un descuento existente (para editar)
router.put('/:id', descuentosController.updateDescuento);

// DELETE /descuentos/:id - Eliminar un descuento (para editar o lista principal)
router.delete('/:id', descuentosController.deleteDescuento);


module.exports = router;