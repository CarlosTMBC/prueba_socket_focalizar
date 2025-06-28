import validator from "validator";

export class BodegaModel {
  constructor(
    id_bodega,
    nombre,
    encargado_id,
    telefono,
    ubicacion,
    rol,
    departamento,
    municipio
  ) {
    this.id_bodega = id_bodega;
    this.nombre = this.sanitizarTexto(nombre);
    this.encargado_id = this.sanitizarNumero(encargado_id);
    this.telefono = telefono.toString().trim();
    this.ubicacion = this.sanitizarTexto(ubicacion);
    this.rol = this.sanitizarTexto(rol);
    this.departamento = this.sanitizarTexto(departamento);
    this.municipio = this.sanitizarTexto(municipio);
  }

  esValido() {
    return (
      BodegaModel.validarNombre(this.nombre) &&
      BodegaModel.validarIdEncargado(this.encargado_id) &&
      BodegaModel.validarTelefonoGuatemala(this.telefono) &&
      BodegaModel.validarUbicacion(this.ubicacion) &&
      BodegaModel.validarNombre(this.rol) &&
      BodegaModel.validarDepartamento(this.departamento) &&
      BodegaModel.validarMunicipio(this.municipio)
    );
  }

  sanitizarTexto(texto) {
    if (typeof texto !== 'string') return '';
    return texto
      .replace(/[<>/'"`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  sanitizarNumero(valor) {
    const numero = parseInt(valor, 10);
    return isNaN(numero) || numero < 0 ? 0 : numero;
  }

  obtenerDatos() {
    return {
      id_bodega: this.id_bodega,
      nombre: this.nombre,
      encargado_id: this.encargado_id,
      telefono: this.telefono,
      ubicacion: this.ubicacion,
      rol: this.rol,
      departamento: this.departamento,
      municipio: this.municipio,
    };
  }

  // ======== MÉTODOS DE VALIDACIÓN ESTÁTICA ========

  static validarNombre(nombre) {
    if (typeof nombre !== 'string') return false;
    const texto = nombre.trim();
    return (
      texto.length > 0 &&
      texto.length <= 30 &&
      /^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ.,-]+$/.test(texto)
    );
  }

  static validarIdEncargado(encargado_id) {
    return validator.isInt(encargado_id.toString(), { min: 1 });
  }

  static validarTelefonoGuatemala(telefono) {
    const texto = telefono.toString().trim();
    const regex = /^[0-9]\d{7}$/; // 8 dígitos
    return texto.length <= 15 && regex.test(texto);
  }

  static validarUbicacion(ubicacion) {
    if (typeof ubicacion !== 'string') return false;
    const texto = ubicacion.trim();
    return (
      texto.length > 0 &&
      texto.length <= 150 &&
      /^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ,.-]*$/.test(texto)
    );
  }

  static validarDepartamento(departamento) {
    if (typeof departamento !== 'string') return false;
    const texto = departamento.trim();
    // Letras, espacios y hasta 50 caracteres
    return (
      texto.length > 0 &&
      texto.length <= 50 &&
      /^[a-zA-Z\sáéíóúÁÉÍÓÚñÑ]+$/.test(texto)
    );
  }

  static validarMunicipio(municipio) {
    if (typeof municipio !== 'string') return false;
    const texto = municipio.trim();
    // Letras, espacios y hasta 50 caracteres
    return (
      texto.length > 0 &&
      texto.length <= 50 &&
      /^[a-zA-Z\sáéíóúÁÉÍÓÚñÑ]+$/.test(texto)
    );
  }

  static crearBodegaValidada(
    nombre,
    encargado_id,
    telefono,
    ubicacion,
    rol,
    departamento,
    municipio
  ) {
    if (!this.validarNombre(nombre)) {
      throw new Error(
        "El nombre de la bodega es inválido o excede los 30 caracteres."
      );
    }
    if (!this.validarIdEncargado(encargado_id)) {
      throw new Error("El ID del encargado no es válido.");
    }
    if (!this.validarTelefonoGuatemala(telefono)) {
      throw new Error(
        "El número de teléfono no es válido para Guatemala (8 dígitos y máximo 15 caracteres)."
      );
    }
    if (!this.validarUbicacion(ubicacion)) {
      throw new Error(
        "La ubicación es inválida o excede los 150 caracteres."
      );
    }
    if (!this.validarNombre(rol)) {
      throw new Error("El rol no es válido o excede los 30 caracteres.");
    }
    if (!this.validarDepartamento(departamento)) {
      throw new Error(
        "El departamento es inválido o formateado incorrectamente."
      );
    }
    if (!this.validarMunicipio(municipio)) {
      throw new Error(
        "El municipio es inválido o formateado incorrectamente."
      );
    }

    return new BodegaModel(
      null, // aquí id_bodega lo asignará la BD
      nombre,
      encargado_id,
      telefono,
      ubicacion,
      rol,
      departamento,
      municipio
    );
  }

  static actualizarBodegaValidada(
    id_bodega,
    nombre,
    encargado_id,
    telefono,
    ubicacion,
    rol,
    departamento,
    municipio
  ) {
    // Validaciones idénticas a crearBodegaValidada
    this.crearBodegaValidada(
      nombre,
      encargado_id,
      telefono,
      ubicacion,
      rol,
      departamento,
      municipio
    );
    // Si todo es válido, retornamos true
    return true;
  }
}
