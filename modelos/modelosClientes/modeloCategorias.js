/*
MODELO DE DATOS PARA PRODUCTOS - modeloCategorias.js
Define la clase 'Producto' que estructura los datos de los productos
recibidos desde la API para ser utilizados en el frontend del cliente.
*/

export class Producto {
  constructor(
    id_producto,
    id_proveedor,
    nombre,
    descripcion,
    precio_venta,
    precio_descuento,
    categoria_id,
    marca,
    fecha_de_vencimiento = null,
    multimedia_id = null
  ) {
    this.id_producto = id_producto;
    this.id_proveedor = id_proveedor;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.precio_venta = parseFloat(precio_venta);
    this.precio_descuento = precio_descuento ? parseFloat(precio_descuento) : null;
    this.categoria_id = categoria_id;
    this.marca = marca;
    this.fecha_de_vencimiento = fecha_de_vencimiento;
    this.multimedia_id = multimedia_id; 
  }


  estaVencido() {
    if (!this.fecha_de_vencimiento) return false;
    
    const fechaVencimiento = new Date(this.fecha_de_vencimiento);
    const fechaActual = new Date();
    
    return fechaVencimiento < fechaActual;
  }


  esValido() {
    return (
      this.id_producto &&
      this.nombre &&
      this.precio_venta > 0 &&
      this.categoria_id
    );
  }
}