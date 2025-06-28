class PedidoProductoModel {
  constructor(id_pedido, nombre, cantidad, precio, subtotal) {
    this.id_pedido = parseInt(id_pedido, 10) || 0;
    this.nombre = String(nombre || "").trim();
    this.cantidad = parseFloat(cantidad) || 0;
    this.precio = parseFloat(precio) || 0;
    this.subtotal = parseFloat(subtotal) || 0;
  }

  static desdeFilaBD(fila) {
    return new PedidoProductoModel(
      fila.id_pedido,
      fila.nombre,
      fila.cantidad,
      fila.precio,
      fila.subtotal
    );
  }
}

module.exports = { PedidoProductoModel };
