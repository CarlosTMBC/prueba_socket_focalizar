/**
 * Modelo de datos que representa un movimiento de inventario entre bodegas.
 * Este modelo encapsula la lógica para limpiar, validar y preparar los datos
 * antes de ser almacenados o utilizados en el sistema, evitando inyecciones SQL.
 */
class MovimientoModel {
  /**
   * @param {string|Date} fecha_movimiento    Timestamp de cuándo se creó el movimiento
   * @param {number|string} bodega_origen_id   ID de la bodega de origen (entero ≥ 1)
   * @param {number|string} bodega_destino_id  ID de la bodega de destino (entero ≥ 1)
   * @param {string} motivo                    Texto libre que describe el motivo
   * @param {string} estado                    Estado del movimiento (cadena corta)
   * @param {string} descripcion               Descripción adicional (texto libre)
   * @param {boolean|string} recibido          Si ya fue recibido (true/false o "true"/"false")
   * @param {string|Date|null} fecha_recepcion  Timestamp de recepción (puede ser null si no se recibe)
   * @param {string} observaciones             Observaciones adicionales (texto libre)
   * @param {boolean|string} eliminado         Marca lógica de eliminación (true/false o "true"/"false")
   */
  constructor(
    fecha_movimiento,
    bodega_origen_id,
    bodega_destino_id,
    motivo,
    estado,
    descripcion,
    recibido,
    fecha_recepcion,
    observaciones,
    eliminado
  ) {
    // Campos obligatorios
    this.fecha_movimiento    = this.sanitizarFecha(fecha_movimiento);
    this.bodega_origen_id    = this.sanitizarNumero(bodega_origen_id);
    this.bodega_destino_id   = this.sanitizarNumero(bodega_destino_id);
    this.motivo              = this.sanitizarTexto(motivo);
    this.estado              = this.sanitizarTexto(estado);

    // Campos opcionales / complementarios
    this.descripcion         = this.sanitizarTexto(descripcion);
    this.recibido            = this.sanitizarBooleano(recibido);
    this.fecha_recepcion     = this.sanitizarFecha(fecha_recepcion, true);
    this.observaciones       = this.sanitizarTexto(observaciones);
    this.eliminado           = this.sanitizarBooleano(eliminado);
  }

  /**
   * Comprueba que los campos obligatorios sean válidos.
   * @returns {boolean}
   */
  esValido() {
    return (
      this.fecha_movimiento instanceof Date && !isNaN(this.fecha_movimiento) &&
      Number.isInteger(this.bodega_origen_id) && this.bodega_origen_id > 0 &&
      Number.isInteger(this.bodega_destino_id) && this.bodega_destino_id > 0 &&
      typeof this.motivo === 'string' && this.motivo.length > 0 &&
      typeof this.estado === 'string' && this.estado.length > 0 &&
      typeof this.recibido === 'boolean' &&
      typeof this.eliminado === 'boolean'
    );
  }

  /**
   * Sanitiza y convierte un valor a Date. Si `permitirNulo` es true, acepta null.
   */
  sanitizarFecha(valor, permitirNulo = false) {
    if (valor == null) {
      return permitirNulo ? null : new Date('');
    }
    if (valor instanceof Date) {
      return isNaN(valor.getTime()) ? new Date('') : valor;
    }
    const fecha = new Date(String(valor).trim());
    return isNaN(fecha.getTime()) ? new Date('') : fecha;
  }

  /**
   * Sanitiza y asegura que el valor sea un entero ≥ 0.
   */
  sanitizarNumero(valor) {
    const num = parseInt(String(valor).replace(/[^0-9]/g, ''), 10);
    return isNaN(num) || num < 0 ? 0 : num;
  }

  /**
   * Sanitiza una cadena de texto, eliminando caracteres peligrosos y normalizando espacios.
   */
  sanitizarTexto(texto) {
    if (typeof texto !== 'string') return '';
    return texto
      .replace(/[<>/'"`]/g, '')  // elimina caracteres potencialmente peligrosos
      .replace(/\s+/g, ' ')      // normaliza espacios
      .trim();
  }

  /**
   * Sanitiza un valor booleano. Acepta true/false o "true"/"false".
   */
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
   * Devuelve un array con los parámetros en orden para la inserción con SP `insertar_movimientos`.
   */
  obtenerParamsInsert() {
    return [
      this.fecha_movimiento,
      this.bodega_origen_id,
      this.bodega_destino_id,
      this.motivo,
      this.estado,
      this.descripcion,
      this.recibido,
      this.fecha_recepcion,
      this.observaciones,
    ];
  }

  /**
   * Devuelve un array con los parámetros para actualizar con SP `actualizar_movimientos`.
   * El ID del movimiento debe pasarse como primer argumento.
   */
  obtenerParamsUpdate(id_movimiento) {
    return [
      id_movimiento,
      null,  // fecha_movimiento (sin cambio)
      null,  // bodega_origen_id
      null,  // bodega_destino_id
      this.motivo,
      null,  // estado
      this.descripcion,
      null,  // recibido
      null,  // fecha_recepcion
      this.observaciones,
    ];
  }
}

module.exports = { MovimientoModel };
