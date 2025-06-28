import validator from "validator";

export class Cliente {
    constructor(nombre, correo, contrasena, tel_cliente, direccion) {
      this.nombre = nombre;
      this.correo = correo;
      this.contrasena = contrasena;
      this.tel_cliente = tel_cliente;
      this.direccion = direccion;
    }
    /*
      Método para verificar la contraseña ingresada
      
    */ 
  async verificarContrasena(contrasenaIngresada) {
    try {
      return await bcrypt.compare(contrasenaIngresada, this.contrasena);
    } catch (error) {
      console.error("Error al verificar la contraseña:", error.message);
      throw new Error("No se pudo verificar la contraseña");
    }
  }
  // Método estático para validar el formato de un número de teléfono de Guatemala
  static validarTelefonoGuatemala(telefono) {
    try {
      const regex = /^[2-9]\d{7}$/; // Comienza con 2-9 y tiene exactamente 8 dígitos
      return regex.test(telefono);
    } catch (error) {
      console.error("Error al validar el número de teléfono:", error.message);
      return false;
    }
  }

  // Método para obtener los datos públicos del cliente
  obtenerDatosPublicos() {
    try {
      return {
        nombre: this.nombre,
        correo: this.correo,
        tel_cliente: this.tel_cliente,
        direccion: this.direccion,
      };
    } catch (error) {
      console.error("Error al obtener los datos públicos:", error.message);
      return null;
    }
  }

  // Método estático para validar caracteres especiales en nombre y dirección
  static validarCaracteresEspeciales(texto) {
    try {
      const regex = /^[a-zA-ZÀ-ÿ\s\-]+$/; // Permite letras, espacios y guiones
      return regex.test(texto);
    } catch (error) {
      console.error("Error al validar caracteres especiales:", error.message);
      return false;
    }
  }

  // Método estático para validar la seguridad de la contraseña
  static validarContrasena(contrasena) {
    try {
      return (
        contrasena.length >= 8 &&
        /[0-9]/.test(contrasena) && // Al menos un número
        /[!@#$%^&*(),.?":{}|<>]/.test(contrasena) // Al menos un carácter especial
      );
    } catch (error) {
      console.error("Error al validar la contraseña:", error.message);
      return false;
    }
  }

  // Método estático para validar la dirección
static validarDireccion(direccion) {
  try {
    const regex = /^[a-zA-Z0-9\s\-.,;/]+$/; // Permite letras, números, espacios, guiones, puntos, comas, punto y coma, y diagonales
    return regex.test(direccion);
  } catch (error) {
    console.error("Error al validar la dirección:", error.message);
    return false;
  }
}

  // Método estático para crear un cliente validado
  static crearClienteValidado(
    nombre,
    correo,
    contrasena,
    tel_cliente,
    direccion
  ) {
    try {
      if (!validator.isEmail(correo)) {
        throw new Error("Correo electrónico no válido");
      }

      if (!this.validarContrasena(contrasena)) {
        throw new Error("La contraseña no cumple con los requisitos mínimos");
      }

      if (!this.validarCaracteresEspeciales(nombre)) {
        throw new Error("El nombre contiene caracteres no permitidos");
      }

      if (!this.validarDireccion(direccion)) {
        throw new Error("La dirección contiene caracteres no permitidos");
      }
      if (!this.validarTelefonoGuatemala(tel_cliente)) {
            throw new Error('El número de teléfono no es válido para Guatemala');
        }
      return new Cliente(
        validator.escape(nombre),
        validator.normalizeEmail(correo),
        contrasena, // La contraseña será hasheada posteriormente
        validator.escape(tel_cliente),
        validator.escape(direccion)
      );
    } catch (error) {
      console.error("Error al crear el cliente:", error.message);
      throw error;
    }
  }
  }
  