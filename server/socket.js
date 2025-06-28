const { Server } = require("socket.io");

let io;
const usuariosConectados = new Map(); // Puede almacenar id_usuario, cliente_123, bodega_45 → socket.id

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*", // En producción: usar tu dominio (ej. https://miapp.com)
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 Nuevo cliente conectado:", socket.id);

    /**
     * Evento que identifica al usuario conectado.
     * Este evento debe ser emitido desde el cliente después de autenticarse.
     */
    socket.on("identificarse", ({ id_usuario, rol, id_cliente, id_bodega }) => {
      if (id_usuario) {
        usuariosConectados.set(id_usuario, socket.id);
        console.log(`✅ Usuario ${id_usuario} identificado como ${rol}`);
      }

      if (rol === "cliente" && id_cliente) {
        usuariosConectados.set(`cliente_${id_cliente}`, socket.id);
        console.log(`📦 Cliente identificado: cliente_${id_cliente}`);
      }

      if (rol === "microbodega" && id_bodega) {
        usuariosConectados.set(`bodega_${id_bodega}`, socket.id);
        console.log(`🏬 Microbodega identificada: bodega_${id_bodega}`);
      }
    });

    /**
     * Evento de desconexión.
     * Limpia cualquier identificador asignado al socket desconectado.
     */
    socket.on("disconnect", () => {
      console.log("❌ Cliente desconectado:", socket.id);
      for (const [clave, valor] of usuariosConectados.entries()) {
        if (valor === socket.id) {
          usuariosConectados.delete(clave);
          console.log(`🗑️ Eliminado del mapa: ${clave}`);
        }
      }
    });
  });
}

/**
 * Función para emitir una notificación a un usuario identificado.
 * @param {string|number} identificador - puede ser id_usuario, cliente_123, bodega_45
 * @param {object} data - objeto con los datos de la notificación
 */
function enviarNotificacion(identificador, data) {
  const socketId = usuariosConectados.get(identificador);
  if (socketId && io) {
    io.to(socketId).emit("nueva_notificacion", data);
    console.log(`📨 Notificación enviada a ${identificador}`);
  } else {
    console.log(`⚠️ No se encontró conexión activa para ${identificador}`);
  }
}

module.exports = {
  initSocket,
  enviarNotificacion,
};
