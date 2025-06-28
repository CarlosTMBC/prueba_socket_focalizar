/**
 * Modelo de datos que representa un pedido realizado por un cliente.
 * Este modelo se encarga de sanitizar, validar y preparar los datos
 * para ser almacenados o utilizados por el sistema.
 */
class PedidoModel {
  /**
   * @param {number|string} cliente_id        ID del cliente (entero ≥ 1)
   * @param {Date|string} fecha_pedido        Fecha del pedido
   * @param {string} comentarios              Comentarios del pedido (opcional)
   * @param {string} estado                   Estado del pedido (ej: "pendiente", "completado")
   * @param {boolean|string} eliminado        Marca lógica de eliminación
   * @param {number|string} total             Monto total del pedido
   * @param {number|string} bodega_id         ID de la bodega asociada (entero ≥ 1)
   */
  constructor(
    cliente_id,
    fecha_pedido,
    comentarios,
    estado,
    eliminado,
    total,
    bodega_id
  ) {
    // Campos obligatorios
    this.cliente_id    = this.sanitizarNumero(cliente_id);
    this.fecha_pedido  = this.sanitizarFecha(fecha_pedido);
    this.estado        = this.sanitizarTexto(estado);
    this.total         = this.sanitizarNumero(total);
    this.bodega_id     = this.sanitizarNumero(bodega_id);

    // Campos opcionales
    this.comentarios   = this.sanitizarTexto(comentarios);
    this.eliminado     = this.sanitizarBooleano(eliminado);
  }

  /**
   * Comprueba que los campos requeridos estén completos y válidos.
   */
  esValido() {
    return (
      Number.isInteger(this.cliente_id) &&
      this.cliente_id > 0 &&
      this.fecha_pedido instanceof Date &&
      !isNaN(this.fecha_pedido.getTime()) &&
      typeof this.estado === 'string' &&
      this.estado.length > 0 &&
      Number.isFinite(this.total) &&
      this.total >= 0 &&
      Number.isInteger(this.bodega_id) &&
      this.bodega_id > 0 &&
      typeof this.eliminado === 'boolean'
    );
  }

  sanitizarFecha(valor) {
    if (!valor) return new Date('');
    const fecha = valor instanceof Date ? valor : new Date(String(valor).trim());
    return isNaN(fecha.getTime()) ? new Date('') : fecha;
  }

  sanitizarNumero(valor) {
    const num = parseFloat(String(valor).replace(/[^\d.]/g, ''));
    return isNaN(num) || num < 0 ? 0 : Math.floor(num);
  }

  sanitizarTexto(texto) {
    if (typeof texto !== 'string') return '';
    return texto.replace(/[<>/'"`]/g, '').replace(/\s+/g, ' ').trim();
  }

  sanitizarBooleano(valor) {
    if (typeof valor === 'boolean') return valor;
    if (typeof valor === 'string') {
      const v = valor.trim().toLowerCase();
      if (v === 'true') return true;
      if (v === 'false') return false;
    }
    return false;
  }

  /**
   * Retorna los datos listos para ser almacenados en la base de datos.
   */
  obtenerDatos() {
    return {
      cliente_id:    this.cliente_id,
      fecha_pedido:  this.fecha_pedido,
      comentarios:   this.comentarios,
      estado:        this.estado,
      eliminado:     this.eliminado,
      total:         this.total,
      bodega_id:     this.bodega_id
    };
  }
}

module.exports = { PedidoModel };
