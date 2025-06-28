// modelos/modelosAdministrador/Proveedores/modelProveedor.js

import validator from "validator";

export class Proveedores {
  /**
   * @param {string} nombre
   * @param {string} telefono
   * @param {string} correo_electronico
   * @param {string} direccion
   * @param {string} contacto
   * @param {string} fecha_registro (formato YYYY-MM-DD)
   * @param {number|string|null} id_proveedor
   */
  constructor(nombre, telefono, correo_electronico, direccion, contacto, fecha_registro, id_proveedor) {
    this.nombre = this.sanitizarTexto(nombre);
    this.telefono = this.sanitizarTelefono(telefono);
    this.correo_electronico = this.sanitizarCorreo(correo_electronico);
    this.direccion = this.sanitizarTexto(direccion);
    this.contacto = this.sanitizarTexto(contacto);
    this.fecha_registro = fecha_registro; // no sanitizar
    this.id_proveedor = this.sanitizarNumero(id_proveedor);
  }

  sanitizarTexto(valor) {
    return typeof valor === "string" ? validator.escape(valor.trim()) : "";
  }

  sanitizarTelefono(valor) {
    return typeof valor === "string" ? valor.replace(/[^\d+]/g, "").trim() : "";
  }

  sanitizarCorreo(valor) {
    return typeof valor === "string" ? validator.normalizeEmail(valor.trim()) : "";
  }

  sanitizarNumero(valor) {
    const num = Number(valor);
    return isNaN(num) ? null : num;
  }

  esValido() {
    return (
      this.nombre &&
      validator.isEmail(this.correo_electronico || "") &&
      this.telefono.length >= 6 &&
      this.direccion &&
      this.contacto
    );
  }
}
