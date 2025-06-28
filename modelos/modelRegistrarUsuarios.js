// modelos/modelRegistro.js

/**
 * Clase que representa el modelo de datos para el registro de usuarios.
 * Incluye métodos de validación y sanitización para asegurar que los datos ingresados
 * sean seguros y cumplan con el formato esperado.
 */
class RegistroUsuario {
  /**
   * @param {string} nombre
   * @param {string} password_hash
   * @param {number|string} rol_id
   */
  constructor(nombre, password_hash, rol_id) {
    this.nombre = this.sanitizarTexto(nombre);
    this.password_hash = this.sanitizarTexto(password_hash);
    this.rol_id = this.sanitizarNumero(rol_id);
  }

  /**
   * Comprueba que todos los campos son válidos:
   * - nombre y password_hash no vacíos, max. 50 y 100 caracteres respectivamente.
   * - rol_id entero ≥ 1.
   * @returns {boolean}
   */
  esValido() {
    return (
      typeof this.nombre === 'string' &&
      this.nombre.length > 0 &&
      this.nombre.length <= 50 &&

      typeof this.password_hash === 'string' &&
      this.password_hash.length > 0 &&
      this.password_hash.length <= 100 &&

      Number.isInteger(this.rol_id) &&
      this.rol_id >= 1
    );
  }

  /**
   * Elimina caracteres peligrosos y normaliza espacios.
   * @param {string} texto
   * @returns {string}
   */
  sanitizarTexto(texto) {
    if (typeof texto !== 'string') return '';
    return texto
      .replace(/[<>/'"]/g, '')  // eliminar <, >, /, ' y "
      .replace(/\s+/g, ' ')     // reducir espacios múltiples a uno
      .trim();
  }

  /**
   * Asegura que el valor es un entero ≥ 0.
   * @param {number|string} valor
   * @returns {number}
   */
  sanitizarNumero(valor) {
    const n = parseInt(String(valor).replace(/[^\d]/g, ''), 10);
    return isNaN(n) || n < 0 ? 0 : n;
  }

  /**
   * Devuelve un objeto con los datos listos para la base de datos.
   */
  obtenerDatos() {
    return {
      nombre: this.nombre,
      password_hash: this.password_hash,
      rol_id: this.rol_id,
    };
  }
}

module.exports = { RegistroUsuario };
