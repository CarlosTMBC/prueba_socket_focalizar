// modelos/modelOrdenes.js

/* Modelo de datos que representa una orden de compra o pedido.
 * Este modelo encapsula la lógica para limpiar, validar y preparar los datos
 * antes de ser almacenados o utilizados en el sistema.
 */
class ModeloOrdenes {
    /* Constructor que recibe los campos relacionados con una orden
     * y los sanitiza (limpia) para evitar datos corruptos o maliciosos.
     */
    constructor(fecha_orden, bodega_id, proveedor_id, aprobado) {
      this.fecha_orden = this.sanitizarTexto(fecha_orden);
      this.bodega_id = this.sanitizarNumero(bodega_id);
      this.proveedor_id = this.sanitizarNumero(proveedor_id);
      this.aprobado = this.sanitizarBooleano(aprobado);
    }
  
    /* Método que valida si el objeto contiene datos correctos y completos.
     * Se utiliza antes de registrar o procesar la orden.
     */
    esValido() {
  if (!this.fecha_orden) {
    return "La fecha de orden no es válida.";
  }
  if (!(this.bodega_id > 0)) {
    return "El ID de la bodega debe ser mayor que 0.";
  }
  if (!(this.proveedor_id > 0)) {
    return "El ID del proveedor debe ser mayor que 0.";
  }
  if (typeof this.aprobado !== 'boolean') {
    return "El campo 'aprobado' debe ser un valor booleano (true o false).";
  }
  return true; // Si todas las condiciones se cumplen, el objeto es válido
}
  
    /* Método para limpiar cadenas de texto. Elimina caracteres especiales,
     * normaliza los espacios y devuelve un texto seguro y legible.
     */
    sanitizarTexto(texto) {
      if (typeof texto !== 'string') return '';
      return texto
        .replace(/[<>/'"`]/g, '') // Evita inyecciones HTML o de scripts
        .replace(/\s+/g, ' ')     // Normaliza espacios múltiples
        .trim();                   // Elimina espacios al inicio y al final
    }
  
    /* Método para limpiar y validar un número.
     * Si no es un número válido o es negativo, retorna 0.
     */
    sanitizarNumero(valor) {
      const numero = parseFloat(valor);
      return isNaN(numero) || numero < 0 ? 0 : numero;
    }
  
    /* Método para limpiar y validar un booleano.
     * Convierte el valor a booleano o retorna false si no es válido.
     */
    sanitizarBooleano(valor) {
      if (typeof valor === 'boolean') {
        return valor;
      }
      if (typeof valor === 'string') {
        const lowerCaseValue = valor.toLowerCase();
        return lowerCaseValue === 'true' || lowerCaseValue === '1';
      }
      return false;
    }
  
    /* Retorna todos los datos de la orden ya sanitizados,
     * listos para ser enviados a la base de datos o mostrados en pantalla.
     */
    obtenerDatos() {
      return {
        fecha_orden: this.fecha_orden,
        bodega_id: this.bodega_id,
        proveedor_id: this.proveedor_id,
        aprobado: this.aprobado,
      };
    }
  }
  
  /* Exporto la clase para poder usarla en otras partes del sistema,
   * como los controladores o rutas encargadas de gestionar las órdenes.
   */
  module.exports = { ModeloOrdenes };