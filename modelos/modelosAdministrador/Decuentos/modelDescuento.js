import validator from "validator";

function isValidDateString(dateString) {
    if (typeof dateString !== "string") return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString + "T00:00:00");
    return !isNaN(date.getTime());
}

export class Descuento {
    constructor(data = {}) {
        this.id_descuento = data.id_descuento || null;
        this.nombre = validator.escape(data.nombre || "").trim();
        this.descripcion = data.descripcion ? validator.escape(data.descripcion).trim() : null;
        this.tipo_descuento = ["monto_fijo", "porcentaje"].includes(data.tipo_descuento) ? data.tipo_descuento : "monto_fijo";
        this.valor = parseFloat(data.valor) || 0;

        this.porcentaje = this.tipo_descuento === "porcentaje" ? this.valor : null;
        this.monto_fijo = this.tipo_descuento === "monto_fijo" ? this.valor : null;

        this.fecha_inicio = data.fecha_inicio;
        this.fecha_fin = data.fecha_fin;

        this.id_producto = data.id_producto || null;
        this.id_categoria = data.id_categoria || null;
        this.marca_producto = data.marca_producto || null;

        this.estado = data.estado || "activo";
    }
    static contieneCaracteresInvalidos(texto) {
        return /[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9 ]/.test(texto);
    }
    validar(precioVentaProducto) {
        const errors = [];

        // Nombre
        if (!this.nombre || this.nombre.length < 3) {
            errors.push("El nombre del descuento debe tener al menos 3 caracteres.");
        } else if (Descuento.contieneCaracteresInvalidos(this.nombre)) {
            errors.push("El nombre no debe contener caracteres especiales.");
        }

        if (this.descripcion) {
            if (this.descripcion.length < 3) {
                errors.push("La descripción debe tener al menos 3 caracteres si se incluye.");
            } else if (Descuento.contieneCaracteresInvalidos(this.descripcion)) {
                errors.push("La descripción no debe contener caracteres especiales.");
            }
        }

        // Tipo de descuento
        if (!["monto_fijo", "porcentaje"].includes(this.tipo_descuento)) {
            errors.push("Tipo de descuento inválido.");
        }

        // Valor
        if (this.valor <= 0) {
            errors.push("El valor del descuento debe ser mayor a 0.");
        }

        if (this.tipo_descuento === "porcentaje" && this.valor > 100) {
            errors.push("El porcentaje no puede ser mayor a 100%.");
        }

        if (this.tipo_descuento === "monto_fijo" && typeof precioVentaProducto === "number" && this.valor > precioVentaProducto) {
            errors.push(`El descuento no puede superar el precio del producto (Q${precioVentaProducto.toFixed(2)}).`);
        }

        // Fechas
        if (!this.fecha_inicio || !isValidDateString(this.fecha_inicio)) {
            errors.push("La fecha de inicio no es válida.");
        }

        if (!this.fecha_fin || !isValidDateString(this.fecha_fin)) {
            errors.push("La fecha de fin no es válida.");
        }

        if (this.fecha_inicio && this.fecha_fin) {
            const inicio = new Date(this.fecha_inicio + "T00:00:00");
            const fin = new Date(this.fecha_fin + "T00:00:00");
            if (fin < inicio) {
                errors.push("La fecha de fin no puede ser anterior a la de inicio.");
            }
        }

        // Aplicación
        const aplicacion = [this.id_producto, this.id_categoria, this.marca_producto].filter(v => v != null);
        if (aplicacion.length === 0) {
            errors.push("El descuento debe aplicarse a un producto, categoría o marca.");
        }
        if (aplicacion.length > 1) {
            errors.push("Solo se puede aplicar a una entidad: producto, categoría o marca.");
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    obtenerDatosParaAPI() {
         return {
            id_descuento: this.id_descuento,
            nombre: this.nombre,
            descripcion: this.descripcion,
            tipo_descuento: this.tipo_descuento,
            valor: this.valor,
            porcentaje: this.tipo_descuento === "porcentaje" ? this.valor : null,
            monto_fijo: this.tipo_descuento === "monto_fijo" ? this.valor : null,
            fecha_inicio: this.fecha_inicio,
            fecha_fin: this.fecha_fin,
            id_producto: this.id_producto,
            id_categoria: this.id_categoria,
            marca_producto: this.marca_producto,
            estado: this.estado,
        };
    }
}
