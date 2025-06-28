// modelos/modelosAdministrador/Roles/modelRol.js
import validator from "validator";

export class RolModel {
  /**
   * @param {number|string|null} id_rol
   * @param {string} nombre
   * @param {string} tipo
   */
  constructor(id_rol, nombre, tipo) {
    // Sanitizamos los valores recibidos
    this.id_rol = this.sanitizarNumero(id_rol);
    this.nombre = this.sanitizarTexto(nombre);
    this.tipo   = this.sanitizarTexto(tipo);
  }

  /**
   * Comprueba que todos los campos son válidos
   * (utilizado para actualización u operaciones genéricas).
   * @returns {boolean}
   */
  esValido() {
    return (
      RolModel.validarIdRol(this.id_rol) &&
      RolModel.validarNombre(this.nombre) &&
      RolModel.validarTipo(this.tipo)
    );
  }

  /**
   * Validación específica para CREAR un nuevo rol.
   * Aquí no comprobamos id_rol porque la BD lo autoincrementa.
   * @param {string} nombre
   * @param {string} tipo
   * @returns {boolean}
   */
  static validarParaCrear(nombre, tipo) {
    return this.validarNombre(nombre) && this.validarTipo(tipo);
  }

  /**
   * Elimina caracteres peligrosos y normaliza espacios.
   * @param {string} texto
   * @returns {string}
   */
  sanitizarTexto(texto) {
    if (typeof texto !== "string") return "";
    // Escapa caracteres HTML
    let limpio = validator.escape(texto);
    // Normaliza espacios múltiples
    return limpio.replace(/\s+/g, " ").trim();
  }

  /**
   * Asegura que el valor es un entero ≥ 0.
   * @param {number|string|null} valor
   * @returns {number}
   */
  sanitizarNumero(valor) {
    const str = valor == null ? "" : valor.toString();
    // Extrae solo dígitos
    const num = parseInt(str.replace(/[^\d]/g, ""), 10);
    return isNaN(num) || num < 0 ? 0 : num;
  }

  /**
   * Devuelve un objeto con los datos listos para enviar a la BD.
   */
  obtenerDatos() {
    return {
      id_rol: this.id_rol,
      nombre: this.nombre,
      tipo:   this.tipo,
    };
  }

  // ===== Validaciones estáticas =====

  /**
   * ID debe ser un entero ≥ 1.
   */
  static validarIdRol(id) {
    return validator.isInt(id.toString(), { min: 1 });
  }

  /**
   * Nombre: no vacío, máximo 25 caracteres, acepta letras, números y espacios.
   */
  static validarNombre(nombre) {
    if (typeof nombre !== "string") return false;
    return (
      nombre.length > 0 &&
      nombre.length <= 25 &&
      /^[\p{L}0-9\s]+$/u.test(nombre)
    );
  }

  /**
   * Tipo: no vacío, máximo 25 caracteres, acepta letras y espacios.
   */
  static validarTipo(tipo) {
    if (typeof tipo !== "string") return false;
    return (
      tipo.length > 0 &&
      tipo.length <= 25 &&
      /^[\p{L}\s]+$/u.test(tipo)
    );
  }
}
