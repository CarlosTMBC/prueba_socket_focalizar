/*
  Modelo que representa un pedido pendiente dentro del sistema.
  Esta clase modela los datos básicos que se almacenan de cada pedido pendiente
  de un cliente específico en una bodega específica.
*/
export class PedidoPendiente {
  constructor(
    id_pedido = null,
    cliente_id,
    fecha_pedido,
    comentarios = null,
    eliminado = false,
    estado = 'Pendiente',
    total = 0,
    bodega_id
  ) {
    this.id_pedido = id_pedido;
    this.cliente_id = cliente_id;
    this.fecha_pedido = fecha_pedido;
    this.comentarios = comentarios;
    this.eliminado = eliminado;
    this.estado = estado;
    this.total = total;
    this.bodega_id = bodega_id;
  }

  /**
   * Valida que los datos obligatorios del pedido estén presentes
   * @returns {boolean} true si los datos son válidos, false en caso contrario
   */
  validarDatos() {
    return !!(this.cliente_id && this.bodega_id && this.fecha_pedido);
  }

  /**
   * Verifica si el pedido está en un estado que permite modificaciones
   * @returns {boolean} true si se puede modificar, false en caso contrario
   */
  puedeModificar() {
    const estadosModificables = ['pendiente', 'en proceso'];
    return estadosModificables.includes(this.estado?.toLowerCase());
  }

  /**
   * Verifica si el pedido está completado
   * @returns {boolean} true si está completado, false en caso contrario
   */
  estaCompletado() {
    return this.estado?.toLowerCase() === 'completado';
  }

  /**
   * Verifica si el pedido está cancelado
   * @returns {boolean} true si está cancelado, false en caso contrario
   */
  estaCancelado() {
    return this.estado?.toLowerCase() === 'cancelado';
  }

  /**
   * Obtiene el total formateado como moneda
   * @returns {string} Total formateado con símbolo de quetzal
   */
  getTotalFormateado() {
    return `Q${parseFloat(this.total || 0).toFixed(2)}`;
  }

  /**
   * Obtiene la fecha formateada para mostrar
   * @returns {string} Fecha formateada en formato DD-MM-YYYY HH:MM
   */
  getFechaFormateada() {
    if (!this.fecha_pedido) return "Sin fecha";
    
    try {
      const fecha = new Date(this.fecha_pedido);
      if (isNaN(fecha.getTime())) return "Fecha inválida";
      
      const dia = fecha.getDate().toString().padStart(2, "0");
      const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
      const año = fecha.getFullYear();
      const horas = fecha.getHours().toString().padStart(2, "0");
      const minutos = fecha.getMinutes().toString().padStart(2, "0");
      
      return `${dia}-${mes}-${año} ${horas}:${minutos}`;
    } catch (error) {
      return "Fecha inválida";
    }
  }

  /**
   * Convierte el objeto a formato JSON para envío a la API
   * @returns {Object} Objeto con los datos del pedido
   */
  toJSON() {
    return {
      id_pedido: this.id_pedido,
      cliente_id: this.cliente_id,
      fecha_pedido: this.fecha_pedido,
      comentarios: this.comentarios,
      eliminado: this.eliminado,
      estado: this.estado,
      total: this.total,
      bodega_id: this.bodega_id
    };
  }

  /**
   * Crea una instancia desde datos de la API
   * @param {Object} apiData - Datos recibidos de la API
   * @returns {PedidoPendiente} Nueva instancia del modelo
   */
  static fromApiData(apiData) {
    return new PedidoPendiente(
      apiData.id_pedido,
      apiData.cliente_id,
      apiData.fecha_pedido,
      apiData.comentarios,
      apiData.eliminado,
      apiData.estado,
      apiData.total,
      apiData.bodega_id
    );
  }
}