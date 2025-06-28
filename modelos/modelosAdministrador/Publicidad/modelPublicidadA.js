/*
  Modelo que representa una campaña publicitaria dentro del sistema.
  Esta clase modela los datos básicos que se almacenan de cada campaña publicitaria registrada
*/
export class Publicidad {
  constructor(
    nombre_campaña, 
    descripcion, 
    costo, 
    fecha_inicial, 
    fecha_final, 
    activo = true, 
    eliminado = false, 
    id_publicidad = null
  ) {
    this.nombre_campaña = nombre_campaña;
    this.descripcion = descripcion;
    this.costo = costo;
    this.fecha_inicial = fecha_inicial;
    this.fecha_final = fecha_final;
    this.activo = activo;
    this.eliminado = eliminado;
    this.id_publicidad = id_publicidad;
  }

  // Método para validar si la campaña está activa y no eliminada
  estaDisponible() {
    return this.activo && !this.eliminado;
  }

  // Método para verificar si la campaña está en el rango de fechas válido
  estaEnRangoFechas() {
    const fechaActual = new Date();
    const fechaInicio = new Date(this.fecha_inicial);
    const fechaFin = new Date(this.fecha_final);
    
    return fechaActual >= fechaInicio && fechaActual <= fechaFin;
  }

  // Método para calcular los días restantes de la campaña
  diasRestantes() {
    const fechaActual = new Date();
    const fechaFin = new Date(this.fecha_final);
    const diferenciaTiempo = fechaFin.getTime() - fechaActual.getTime();
    const diferenciaDias = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24));
    
    return diferenciaDias > 0 ? diferenciaDias : 0;
  }

  // Método para obtener el estado de la campaña
  getEstado() {
    if (this.eliminado) return 'Eliminada';
    if (!this.activo) return 'Inactiva';
    if (!this.estaEnRangoFechas()) return 'Expirada';
    return 'Activa';
  }
}