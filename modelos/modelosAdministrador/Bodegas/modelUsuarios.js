import validator from "validator";

export class ClienteBusquedaModel {
  constructor(id_cliente, nombre) {
    this.id_cliente = this.sanitizarNumero(id_cliente);
    this.nombre = this.sanitizarTexto(nombre);
  }

  esValido() {
    return ClienteBusquedaModel.validarNombre(this.nombre);
  }

  sanitizarTexto(texto) {
    if (typeof texto !== 'string') return '';
    return texto
      .replace(/[<>/'"`]/g, '') // Elimina caracteres peligrosos
      .replace(/\s+/g, ' ')     // Reemplaza múltiples espacios por uno
      .trim();                  // Elimina espacios extremos
  }

  sanitizarNumero(valor) {
    const numero = parseInt(valor, 10);
    return isNaN(numero) || numero < 0 ? 0 : numero;
  }

  obtenerDatos() {
    return {
      id_cliente: this.id_cliente,
      nombre: this.nombre,
    };
  }

  // ====== VALIDACIÓN ESTÁTICA ======
  static validarNombre(nombre) {
    if (typeof nombre !== 'string') return false;
    const texto = nombre.trim();
    return texto.length > 0 &&
           texto.length <= 50 &&
           /^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ.,-]+$/.test(texto);
  }

  static crearClienteDesdeDatos(id_cliente, nombre) {
    if (!this.validarNombre(nombre)) {
      throw new Error("El nombre del cliente es inválido o excede los 50 caracteres.");
    }

    return new ClienteBusquedaModel(id_cliente, nombre);
  }
}
