/**
 * Modelo de datos que representa una campaña de publicidad.
 * Este modelo encapsula la lógica para sanitizar, validar y preparar los datos
 * antes de ser almacenados o utilizados en el sistema.
 */
class PublicidadModel {
    /**
     * Constructor que recibe todos los campos relacionados con una campaña de publicidad
     * y los sanitiza para evitar datos corruptos o maliciosos.
     * @param {string} nombre_campana
     * @param {string} descripcion
     * @param {number|string} costo
     * @param {string|Date} fecha_inicial
     * @param {string|Date} fecha_final
     * @param {string} estado
     * @param {number|string} producto_id
     * @param {number|string} proveedor_id
     * @param {number|string} multimedia_id
     */
    constructor(
      nombre_campana,
      descripcion,
      costo,
      fecha_inicial,
      fecha_final,
      estado,
      producto_id,
      proveedor_id,
      multimedia_id
    ) {
      this.nombre_campana = this.sanitizarTexto(nombre_campana);
      this.descripcion    = this.sanitizarTexto(descripcion);
      this.costo          = this.sanitizarNumero(costo);
      this.fecha_inicial  = this.sanitizarTexto(fecha_inicial);
      this.fecha_final    = this.sanitizarTexto(fecha_final);
      this.estado         = this.sanitizarTexto(estado);
      this.producto_id    = this.sanitizarNumero(producto_id);
      this.proveedor_id   = this.sanitizarNumero(proveedor_id);
      this.multimedia_id  = this.sanitizarNumero(multimedia_id);
    }
  
    /**
     * Valida si el objeto contiene datos completos y coherentes.
     * @returns {boolean}
     */
    esValido() {
      return (
        this.nombre_campana !== '' &&
        this.descripcion    !== '' &&
        this.costo          >= 0 &&
        this.fecha_inicial  !== '' &&
        this.fecha_final    !== '' &&
        this.estado         !== '' &&
        this.producto_id    > 0  &&
        this.proveedor_id   > 0  &&
        this.multimedia_id  > 0
      );
    }
  
    /**
     * Elimina caracteres peligrosos de un texto y normaliza espacios.
     * @param {string} texto
     * @returns {string}
     */
    sanitizarTexto(texto) {
      if (texto == null) return '';
      const str = texto.toString();
      return str
        .replace(/[<>/'"`]/g, '')  // eliminar caracteres especiales
        .replace(/\s+/g, ' ')       // normalizar espacios múltiples
        .trim();                     // recortar al inicio y final
    }
  
    /**
     * Convierte un valor a número válido. Si falla, retorna 0.
     * @param {number|string} valor
     * @returns {number}
     */
    sanitizarNumero(valor) {
      const num = parseFloat(valor);
      return isNaN(num) || num < 0 ? 0 : num;
    }
  
    /**
     * Devuelve todos los datos sanitizados listos para la base de datos.
     * @returns {object}
     */
    obtenerDatos() {
      return {
        nombre_campana: this.nombre_campana,
        descripcion:    this.descripcion,
        costo:          this.costo,
        fecha_inicial:  this.fecha_inicial,
        fecha_final:    this.fecha_final,
        estado:         this.estado,
        producto_id:    this.producto_id,
        proveedor_id:   this.proveedor_id,
        multimedia_id:  this.multimedia_id,
      };
    }
  }
  
  // Exportar para usar en controladores o rutas
  module.exports = { PublicidadModel };
  