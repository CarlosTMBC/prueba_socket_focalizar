const http = require("http");
const { initSocket } = require("./socket"); // asegúrate de tener socket.js en la raíz de /server

equire('dotenv').config(); // Carga las variables de entorno desde el archivo .env
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000; // Usa el puerto del .env o por defecto el 3000

// Middleware globales
app.use(cors()); // Habilita CORS para permitir peticiones desde otros orígenes (como frontend en otro puerto)
app.use(express.json()); // Permite recibir datos en formato JSON
app.use(express.urlencoded({ extended: true })); // Permite recibir datos codificados en URLs (formulario)
app.use(express.static(path.join(__dirname, 'public')));
// Importa las rutas del sistema
const metricas = require('./rutas/rutasAdministrador/DashboardRutas');
const categoriasRutas = require('./rutas/rutasAdministrador/Categorias/categoriasRutas');
const clientesRutas = require('./rutas/clientesRutas');
const loginRutas = require('./rutas/loginRutas');
const RegistrarUsuariosRutas = require('./rutas/RegistrarUsuarioruta');
const proveedorRutas = require('./rutas/rutasAdministrador/Proveedores/proveedorRutas');
const movimientosRutas = require('./rutas/rutasAdministrador/movimientos/movimientosRutas');
const productoMultimedia = require('./rutas/rutasAdministrador/Publicidad/Multimedia/rutasMultimediaProductos');
const publicidadMultimedia = require('./rutas/rutasAdministrador/Publicidad/Multimedia/rutasMultimediaPublicidad');
const publicidadA = require('./rutas/rutasAdministrador/Publicidad/publicidadARutas');
const productosRutas = require('./rutas/rutasAdministrador/Productos/productosRutas');
const descuentosRutas = require('./rutas/rutasAdministrador/Descuentos/descuentosRutas');
const rolesRutas = require('./rutas/rutasAdministrador/Roles/rolesRutas');
const rutasMultimedia = require('./rutas/rutasAdministrador/Publicidad/Multimedia/rutasMultimedia');
const bodegasRutas = require("./rutas/rutasAdministrador/Bodegas/bodegasRutas");
const ventasRutas = require("./rutas/rutasAdministrador/Ventas/ventasRutas");
const descuentosRutasTabla = require('./rutas/rutasAdministrador/Descuentos/descuentosRutasTabla');
const FavoritosRutas = require('./rutas/rutasCliente/rutasFavoritos');
const pedidosRutas = require('./rutas/rutasAdministrador/Pedidos/pedidosRutas');
const pedidosClientesRutas = require('./rutas/rutasCliente/Pedidos/pedidosRutas');
const pedidoProductos = require('./rutas/rutasAdministrador/Pedidos/pedidosProductosRuta');
const productoCRutas = require('./rutas/rutasCliente/Productos/productosRutas');
const categoriaCRutas = require('./rutas/rutasCliente/Categorias/listProdCategoriaRuta');

const infoCRutas = require('./rutas/rutasCliente/Cliente/rutasCliente');
// Usar rutas
const ordenesRutas = require('./rutas/rutasAdministrador/Compras/ordenesRutas');
const publicidadRutas = require('./rutas/rutasCliente/Publicidad/rutasPublicidad');
const bodegasCRutas = require('./rutas/rutasCliente/Bodegas/rutasBodegas');

//Microbodegas
const pedidosPendientes = require('./rutas/rutasMicrobodegas/ClientePedidos/rutasClientesPedidos');
const infoGeneralMicroRutas = require('./rutas/rutasMicrobodegas/Configuraciones/InformacionGeneralRutas');
const gananciasRutas = require('./rutas/rutasMicrobodegas/Finanzas/finanzasRutas');
const rutasInventarios = require('./rutas/rutasMicrobodegas/Inventarios/rutasInventarios');
const rutasPedidosMicrobodega = require('./rutas/rutasMicrobodegas/Pedidos/rutasPedidos');
const rutasReabastecer = require('./rutas/rutasMicrobodegas/Reabastecer/rutaReabastecer');

//  Verificación de correo
const verificacionCorreoRutas = require('./rutas/rutasCliente/verificacionCorreoRutas');


//recptcha
const verificacionCaptchaRutas = require('./rutas/verificacionCaptchaRutas');


//  Recuperación de contraseña 
const recuperacionContrasenaRutas = require('./rutas/rutasCliente/recuperarContrasenaRutas');

/* 
  Montaje de rutas bajo sus respectivos endpoints.
  Cada endpoint maneja un grupo de funcionalidades relacionadas con su módulo.
*/
app.use('/metricas',metricas);
app.use('/proveedores', proveedorRutas)
app.use('/categorias', categoriasRutas);
app.use('/clientes', clientesRutas);
app.use('/login', loginRutas);
app.use('/RegistrarUsuario', RegistrarUsuariosRutas);
app.use('/nuevoMovimientos', movimientosRutas);
app.use('/pedidos', pedidosRutas);
app.use('/pedidoProductos', pedidoProductos);
app.use('/productos', productosRutas);
app.use('/descuentos', descuentosRutas);
app.use('/multimedia', rutasMultimedia);
app.use('/bodegas', bodegasRutas);
app.use('/ventas', ventasRutas);
app.use('/descuentosT', descuentosRutasTabla);
app.use('/VistaFavoritos', FavoritosRutas);
app.use('/roles', rolesRutas);
app.use('/ordenes', ordenesRutas);
app.use('/publicidad', publicidadA);
app.use('/productoMultimedia', productoMultimedia);
app.use('/publicidadMultimedia', publicidadMultimedia);


// Ruta para los clientes
app.use('/pedidos_clientes', pedidosClientesRutas);
app.use('/productos_cliente', productoCRutas);
app.use('/categorias_cliente', categoriaCRutas);
app.use('/publicidad_cliente', publicidadRutas);
app.use('/bodegas_cliente', bodegasCRutas);
app.use('/infoClientes', infoCRutas); // Ruta para obtener información de clientes
// Ruta de prueba

//Microbodegas
app.use('/pedidosPendientes', pedidosPendientes);
app.use('/infoGeneralMicro', infoGeneralMicroRutas); 
app.use('/ganancias', gananciasRutas); 
app.use('/inventarios', rutasInventarios);
app.use('/pedidosMicrobodega', rutasPedidosMicrobodega); 
app.use('/reabastecer', rutasReabastecer);

//Verificación de correo electrónico
app.use('/verificacion-correo', verificacionCorreoRutas);

// Ruta para verificar reCAPTCHA
app.use('/', verificacionCaptchaRutas);

// RUTA Recuperación de contraseña
app.use('/recuperacion-contrasena', recuperacionContrasenaRutas);

app.get('/', (req, res) => {
  res.send('Servidor funcionando');
});

const server = http.createServer(app);
initSocket(server); // 👈 Inicia socket.io con el servidor HTTP

server.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo con Socket.IO en http://localhost:${port}`);
});
