import validator from "validator";

export class InventoryModel {
  constructor({
    id_producto,
    nombre,
    descripcion,
    precio_venta,
    stock_actual,
    stock_minimo,
    stock_maximo,
  }) {
    this.id_producto   = this.sanitizarNumero(id_producto);
    this.nombre        = this.sanitizarTexto(nombre);
    this.descripcion   = this.sanitizarTexto(descripcion);
    this.precio_venta  = this.sanitizarDecimal(precio_venta);
    this.stock_actual  = this.sanitizarNumero(stock_actual);
    this.stock_minimo  = this.sanitizarNumero(stock_minimo);
    this.stock_maximo  = this.sanitizarNumero(stock_maximo);
  }

  /** Comprueba que todos los campos sean válidos */
  esValido() {
    return (
      InventoryModel.validarIdProducto(this.id_producto) &&
      InventoryModel.validarNombre(this.nombre) &&
      InventoryModel.validarDescripcion(this.descripcion) &&
      InventoryModel.validarPrecioVenta(this.precio_venta) &&
      InventoryModel.validarStock(this.stock_actual) &&
      InventoryModel.validarStock(this.stock_minimo) &&
      InventoryModel.validarStock(this.stock_maximo) &&
      this.stock_minimo <= this.stock_actual &&
      this.stock_actual <= this.stock_maximo
    );
  }

  /** Devuelve los datos listos para enviar o renderizar */
  obtenerDatos() {
    return {
      id_producto:  this.id_producto,
      nombre:       this.nombre,
      descripcion:  this.descripcion,
      precio_venta: this.precio_venta,
      stock_actual: this.stock_actual,
      stock_minimo: this.stock_minimo,
      stock_maximo: this.stock_maximo,
    };
  }

  // ——— Sanitización ———

  sanitizarTexto(texto) {
    if (typeof texto !== "string") return "";
    return texto
      .replace(/[<>/'"`]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  sanitizarNumero(valor) {
    const n = parseInt(valor, 10);
    return isNaN(n) || n < 0 ? 0 : n;
  }

  sanitizarDecimal(valor) {
    // Asegura un número positivo con hasta dos decimales
    const str = valor?.toString().trim() ?? "0";
    const cleaned = str.replace(/[^0-9.]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) || num < 0 ? 0 : Math.round(num * 100) / 100;
  }

  // ——— Validaciones estáticas ———

  static validarIdProducto(id) {
    // Debe ser entero positivo
    return Number.isInteger(id) && id > 0;
  }

  static validarNombre(nombre) {
    if (typeof nombre !== "string") return false;
    const txt = nombre.trim();
    return txt.length > 0 && txt.length <= 50;
  }

  static validarDescripcion(des) {
    if (typeof des !== "string") return false;
    // Descripción opcional hasta 200 caracteres
    return des.trim().length <= 200;
  }

  static validarPrecioVenta(precio) {
    // Precio >= 0.01
    return typeof precio === "number" && precio >= 0.01;
  }

  static validarStock(stock) {
    return Number.isInteger(stock) && stock >= 0;
  }

  // ——— Fábricas que lanzan excepción si hay algo inválido ———

  /**
   * Crea y valida un InventoryModel a partir de un objeto crudo.
   * @throws Error con mensaje descriptivo.
   */
  static crearValidado(data) {
    const modelo = new InventoryModel(data);

    if (!this.validarIdProducto(modelo.id_producto)) {
      throw new Error("El id_producto debe ser un entero positivo.");
    }
    if (!this.validarNombre(modelo.nombre)) {
      throw new Error("El nombre del producto es obligatorio (1–50 caracteres).");
    }
    if (!this.validarDescripcion(modelo.descripcion)) {
      throw new Error("La descripción no puede exceder 200 caracteres.");
    }
    if (!this.validarPrecioVenta(modelo.precio_venta)) {
      throw new Error("El precio de venta debe ser un número ≥ 0.01.");
    }
    if (!this.validarStock(modelo.stock_minimo) ||
        !this.validarStock(modelo.stock_actual) ||
        !this.validarStock(modelo.stock_maximo)) {
      throw new Error("Los stocks (actual, mínimo, máximo) deben ser enteros ≥ 0.");
    }
    if (modelo.stock_minimo > modelo.stock_actual) {
      throw new Error("El stock_actual no puede ser menor que el stock_minimo.");
    }
    if (modelo.stock_actual > modelo.stock_maximo) {
      throw new Error("El stock_actual no puede exceder el stock_maximo.");
    }

    return modelo;
  }
}
