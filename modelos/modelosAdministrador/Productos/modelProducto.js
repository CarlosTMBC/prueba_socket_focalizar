/*
  Modelo que representa un producto dentro del sistema.
  Esta clase modela los datos básicos que se almacenan de cada producto registrado
*/
export class Productos {
  constructor(
    nombre, 
    descripcion, 
    precio_venta, 
    categoria_id, 
    marca, 
    id_proveedor, 
    fecha_de_vencimiento = null, 
    precio_descuento = null, 
    id_producto = null
  ) {
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.precio_venta = precio_venta;
    this.categoria_id = categoria_id;
    this.marca = marca;
    this.id_proveedor = id_proveedor;
    this.fecha_de_vencimiento = fecha_de_vencimiento;
    this.precio_descuento = precio_descuento;
    this.id_producto = id_producto;
  }
}