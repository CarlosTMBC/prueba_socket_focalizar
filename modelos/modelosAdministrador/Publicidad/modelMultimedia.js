// modelos/modelosAdministrador/Publicidad/modelMultimedia.js

/**
 * Modelo de datos que representa un recurso multimedia (imagen o video)
 * con metadatos adicionales para asociación y destino.
 * Encapsula la lógica para sanitizar, validar y preparar los datos
 * antes de guardarlos en la base de datos.
 */
class MultimediaModel {
  /**
   * @param {Buffer|string} img_video       - Buffer de bytes o string base64 del archivo
   * @param {string}         tipo_archivo    - MIME type (p.ej. "image/png")
   * @param {string}         nombre_archivo  - Nombre original del archivo
   * @param {string}         tipo_asociacion - Tipo de asociación (p.ej. "banner", "thumbnail")
   * @param {string}         destino         - Destino lógico o ruta de uso (p.ej. "publicidad", "galería")
   */
  constructor(img_video, tipo_archivo, nombre_archivo, tipo_asociacion, destino) {
    this.img_video       = this.sanitizarBinario(img_video);
    this.tipo_archivo    = this.sanitizarTexto(tipo_archivo);
    this.nombre_archivo  = this.sanitizarTexto(nombre_archivo);
    this.tipo_asociacion = this.sanitizarTexto(tipo_asociacion);
    this.destino         = this.sanitizarTexto(destino);
  }

  /**
   * Verifica que todos los campos obligatorios estén presentes y tengan valor válido.
   * @returns {boolean}
   */
  esValido() {
    return (
      this.img_video &&
      this.img_video.length > 0 &&
      this.tipo_archivo !== "" &&
      this.nombre_archivo !== "" &&
      this.tipo_asociacion !== "" &&
      this.destino !== ""
    );
  }

  /**
   * Sanitiza datos binarios. Si recibe base64 lo convierte a Buffer.
   * Si recibe un Buffer, lo deja. En otro caso, retorna Buffer vacío.
   * @param {Buffer|string} data
   * @returns {Buffer}
   */
  sanitizarBinario(data) {
    if (Buffer.isBuffer(data)) {
      return data;
    }
    if (typeof data === "string") {
      try {
        return Buffer.from(data, "base64");
      } catch {
        return Buffer.alloc(0);
      }
    }
    return Buffer.alloc(0);
  }

  /**
   * Limpia un string eliminando caracteres peligrosos y normalizando espacios.
   * @param {any} texto
   * @returns {string}
   */
  sanitizarTexto(texto) {
    if (texto == null) return "";
    const str = texto.toString();
    return str
      .replace(/[<>/'"`]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Devuelve un objeto listo para insertar en la base de datos.
   */
  obtenerDatos() {
    return {
      img_video:       this.img_video,
      tipo_archivo:    this.tipo_archivo,
      nombre_archivo:  this.nombre_archivo,
      tipo_asociacion: this.tipo_asociacion,
      destino:         this.destino,
    };
  }
}

module.exports = { MultimediaModel };