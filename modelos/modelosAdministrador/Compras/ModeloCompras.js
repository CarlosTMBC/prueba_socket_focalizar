// modelos/modeloCompras.js

/* Modelo de datos que representa un detalle de compra.
 * Este modelo encapsula la lógica para limpiar, validar y preparar los datos
 * antes de ser almacenados o utilizados en el sistema.
 */
class ModeloCompras {
    /* Constructor que recibe los campos relacionados con un detalle de compra
     * y los sanitiza (limpia) para evitar datos corruptos o maliciosos.
     */
    constructor(orden_id, producto_id, cantidad, precio_unitario, subtotal) {
        this.orden_id = this.sanitizarNumero(orden_id);
        this.producto_id = this.sanitizarNumero(producto_id);
        this.cantidad = this.sanitizarNumero(cantidad);
        this.precio_unitario = this.sanitizarNumeroDecimal(precio_unitario);
        this.subtotal = this.sanitizarNumeroDecimal(subtotal);
    }

    /* Método que valida si el objeto contiene datos correctos y completos.
     * Se utiliza antes de registrar o procesar el detalle de compra.
     */
    esValido() {
        if (!(this.orden_id > 0)) {
            return "El ID de la orden debe ser mayor que 0.";
        }
        if (!(this.producto_id > 0)) {
            return "El ID del producto debe ser mayor que 0.";
        }
        if (!(this.cantidad > 0)) {
            return "La cantidad debe ser mayor que 0.";
        }
        if (!(this.precio_unitario >= 0)) {
            return "El precio unitario no puede ser negativo.";
        }
        if (!(this.subtotal >= 0)) {
            return "El subtotal no puede ser negativo.";
        }
        return true; // Si todas las condiciones se cumplen, el objeto es válido
    }

    /* Método para limpiar y validar un número entero.
     * Si no es un número válido o es negativo, retorna 0.
     */
    sanitizarNumero(valor) {
        const numero = parseInt(valor);
        return isNaN(numero) || numero < 0 ? 0 : numero;
    }

    /* Método para limpiar y validar un número decimal.
     * Si no es un número válido o es negativo, retorna 0.00.
     */
    sanitizarNumeroDecimal(valor) {
        const numero = parseFloat(valor);
        return isNaN(numero) || numero < 0 ? 0.00 : parseFloat(numero.toFixed(2));
    }

    /* Retorna todos los datos del detalle ya sanitizados,
     * listos para ser enviados a la base de datos o mostrados en pantalla.
     */
    obtenerDatos() {
        return {
            orden_id: this.orden_id,
            producto_id: this.producto_id,
            cantidad: this.cantidad,
            precio_unitario: this.precio_unitario,
            subtotal: this.subtotal,
        };
    }
}

/* Exporto la clase para poder usarla en otras partes del sistema,
 * como los controladores o rutas encargadas de gestionar las compras.
 */
module.exports = { ModeloCompras };
