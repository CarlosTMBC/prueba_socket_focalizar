// modelLogin.js

class LoginModel {
  constructor(nombre, contrasena) {
    this.nombre = this.sanitizarTexto(nombre);
    this.contrasena = this.sanitizarTexto(contrasena);
  }

  esValido() {
    return (
      typeof this.nombre === 'string' &&
      typeof this.contrasena === 'string' &&
      this.nombre.trim().length > 0 &&
      this.contrasena.trim().length > 0 &&
      this.nombre.length <= 50 &&
      this.contrasena.length <= 50
    );
  }

  sanitizarTexto(texto) {
    if (typeof texto !== 'string') return '';
    return texto
      .replace(/[<>/'"`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  obtenerDatos() {
    return {
      nombre: this.nombre,
      contrasena: this.contrasena,
    };
  }
}

module.exports = { LoginModel };
