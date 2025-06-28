// modelos/modelosAdministrador/Ventas/modelVentaListado.js

class VentaListadoModel {
  constructor(id_venta, nombre_cliente, nombre_bodega, total, fecha_venta, eliminado) {
    this.id_venta = parseInt(id_venta, 10) || 0;
    this.nombre_cliente = String(nombre_cliente || "").trim();
    this.nombre_bodega = String(nombre_bodega || "").trim();
    this.total = parseFloat(total) || 0;
    this.fecha_venta = fecha_venta;
    this.eliminado = eliminado === true || eliminado === 1;
  }

  static desdeFilaBD(fila) {
    return new VentaListadoModel(
      fila.id_venta,
      fila.nombre_cliente,
      fila.nombre_bodega,
      fila.total,
      fila.fecha_venta,
      fila.eliminado
    );
  }
}

module.exports = { VentaListadoModel };
