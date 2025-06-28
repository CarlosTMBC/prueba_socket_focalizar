/*  Clase que representa una categoría dentro del sistema.
    Las categorías pueden utilizarse para organizar productos, servicios u otros elementos.*/ 
export class Categoria {
  /*Representa a una tabla similar a como se plannteo en base de datos
    Recibe el nombre y una descripción general. */
    constructor(nombre, descripcion, id_categoria) {
      this.nombre = nombre;             // Nombre de la categoría (ej. Electrónicos, Papelería, etc.)
      this.descripcion = descripcion;   // Descripción breve sobre qué incluye o representa esta categoría.
      this.id_categoria = id_categoria;
    }
  }