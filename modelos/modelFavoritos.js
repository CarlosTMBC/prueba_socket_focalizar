// modelos/modelFavoritos.js

import validator from "validator";

/**
 * Modelo para la entidad “favoritos”, que relaciona un usuario con un producto
 * marcándolo como favorito. Contiene métodos de sanitización y validación.
 */
export class FavoritoModel {
  /**
   * @param {number|string|null} id_usuario    – ID del usuario (foránea a usuarios.id_usuario)
   * @param {number|string|null} id_producto   – ID del producto (foránea a productos.id_producto)
   */
  constructor(id_usuario, id_producto) {
    this.id_usuario  = this._sanitizarNumero(id_usuario);
    this.id_producto = this._sanitizarNumero(id_producto);
  }

  /**
   * Comprueba que ambos IDs sean válidos (enteros ≥ 1).
   * @returns {boolean}
   */
  esValido() {
    return (
      FavoritoModel.validarIdUsuario(this.id_usuario) &&
      FavoritoModel.validarIdProducto(this.id_producto)
    );
  }

  /**
   * Sanitiza valores numéricos, extrae dígitos y devuelve entero ≥ 0.
   * @param {number|string|null} valor
   * @returns {number}
   * @private
   */
  _sanitizarNumero(valor) {
    const str = valor == null ? "" : String(valor);
    const num = parseInt(str.replace(/[^\d]/g, ""), 10);
    return isNaN(num) || num < 0 ? 0 : num;
  }

  /**
   * Devuelve un objeto con los campos listos para enviar a la base.
   */
  obtenerDatos() {
    return {
      id_usuario:  this.id_usuario,
      id_producto: this.id_producto,
    };
  }

  // —— MÉTODOS DE VALIDACIÓN ESTÁTICOS —— //

  /**
   * Valida que sea un entero ≥ 1.
   * @param {number} id
   */
  static validarIdUsuario(id) {
    return validator.isInt(String(id), { min: 1 });
  }

  /**
   * Valida que sea un entero ≥ 1.
   * @param {number} id
   */
  static validarIdProducto(id) {
    return validator.isInt(String(id), { min: 1 });
  }

  /**
   * Crea y valida un nuevo favorito, lanzando Error si algo falla.
   * @param {number|string} id_usuario
   * @param {number|string} id_producto
   * @throws {Error} si algún campo no es válido
   */
  static crearFavoritoValidado(id_usuario, id_producto) {
    if (!this.validarIdUsuario(id_usuario)) {
      throw new Error("ID de usuario inválido (debe ser entero ≥ 1).");
    }
    if (!this.validarIdProducto(id_producto)) {
      throw new Error("ID de producto inválido (debe ser entero ≥ 1).");
    }
    return new FavoritoModel(id_usuario, id_producto);
  }
}
