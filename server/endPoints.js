// config.js - Archivo centralizado de configuración

// Configuración base de la API
const API_CONFIG = {
    protocol: 'http',
    host: '192.168.1.10',
    port: 3000,
    baseUrl: function() {
      return `${this.protocol}://${this.host}:${this.port}`;
    }
  };
  

  export const API_URLS = {
    login: `${API_CONFIG.baseUrl()}/login`,
    usuarios: `${API_CONFIG.baseUrl()}/registrarUsuario`,
    clientes: `${API_CONFIG.baseUrl()}/clientes`,
    categoria: `${API_CONFIG.baseUrl()}/categorias`,
    bodegas: `${API_CONFIG.baseUrl()}/bodegas`,
    descuentos: `${API_CONFIG.baseUrl()}/descuentos`,
    descuentosT: `${API_CONFIG.baseUrl()}/descuentosT`,
    nuevoMovimientos: `${API_CONFIG.baseUrl()}/nuevoMovimientos`, 
    productos: `${API_CONFIG.baseUrl()}/productos`,
    proveedores: `${API_CONFIG.baseUrl()}/proveedores`,
    multimedia: `${API_CONFIG.baseUrl()}/multimedia`,
    productoMultimedia: `${API_CONFIG.baseUrl()}/productoMultimedia`,
    publicidadMultimedia: `${API_CONFIG.baseUrl()}/publicidadMultimedia`,    
    ventas: `${API_CONFIG.baseUrl()}/ventas`,
    roles: `${API_CONFIG.baseUrl()}/roles`,
    pedidos: `${API_CONFIG.baseUrl()}/pedidos`,
    favoritos: `${API_CONFIG.baseUrl()}/VistaFavoritos`,
    ordenes: `${API_CONFIG.baseUrl()}/ordenes`,
    proveedoresNombres: `${API_CONFIG.baseUrl()}/ordenes/proveedores-nombres`,
    bodegaNombres: `${API_CONFIG.baseUrl()}/ordenes/bodega-nombres`,
    publicidad: `${API_CONFIG.baseUrl()}/publicidad`,
    metricas: `${API_CONFIG.baseUrl()}/metricas`,
    pedidoProductos: `${API_CONFIG.baseUrl()}/pedidoProductos`,
    pedidosClientes: `${API_CONFIG.baseUrl()}/pedidos_clientes`,
    productosClientes: `${API_CONFIG.baseUrl()}/productos_cliente`,
    categoriasClientes: `${API_CONFIG.baseUrl()}/categorias_cliente`,
    publicidadClientes: `${API_CONFIG.baseUrl()}/publicidad_cliente`,
    clientesBodegas: `${API_CONFIG.baseUrl()}/bodegas/clientes-nombres`,
    infoClientes : `${API_CONFIG.baseUrl()}/infoClientes`,

    bodegasClientes: `${API_CONFIG.baseUrl()}/bodegas_cliente`,
    // Microbodegas
    pedidosPendientes: `${API_CONFIG.baseUrl()}/pedidosPendientes`,
    infoGeneralMicro: `${API_CONFIG.baseUrl()}/infoGeneralMicro`,
    gananciasMicro: `${API_CONFIG.baseUrl()}/ganancias`,
    inventarios: `${API_CONFIG.baseUrl()}/inventarios`,
    pedidosMicrobodega: `${API_CONFIG.baseUrl()}/pedidosMicrobodega`,
    reabastecer: `${API_CONFIG.baseUrl()}/reabastecer`,
     // Verificación de correo electrónico
    verificacionCorreo: `${API_CONFIG.baseUrl()}/verificacion-correo`,
    // Ruta para verificar reCAPTCHA
    verificarCaptcha: `${API_CONFIG.baseUrl()}/verificarCaptcha`,
     // Ruta Recuperar Contraseña
      recuperacionContrasena: `${API_CONFIG.baseUrl()}/recuperacion-contrasena`,
  };
  
  export const buildApiUrl = (endpoint) => {
    return `${API_CONFIG.baseUrl()}/${endpoint}`;
  };
  
  export default API_CONFIG;
  // Ruta para cargar captcha.html (para WebView en Android/iOS)
export const CAPTCHA_HTML_URL = `${API_CONFIG.baseUrl()}/captcha.html`;

