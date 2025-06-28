import validator from "validator";

export class DescuentosTablaModel {
    constructor(data = {}) {
        this.nombre = validator.escape((data.nombre || "").trim());
        this.descripcion = validator.escape((data.descripcion || "").trim());
        this.porcentaje = data.porcentaje !== undefined && data.porcentaje !== null ? parseFloat(data.porcentaje) : null;
        this.monto_fijo = data.monto_fijo !== undefined && data.monto_fijo !== null ? parseFloat(data.monto_fijo) : null;
        this.fecha_inicio = data.fecha_inicio || null;
        this.fecha_fin = data.fecha_fin || null;
        this.estado = validator.escape((data.estado || "").trim());
        this.producto_id = data.producto_id ?? data.id_producto ?? null;
        this.categoria_id = data.categoria_id ?? data.id_categoria ?? null;
        this.id_descuento = data.id_descuento || null;
    }


    static esFechaValida(fecha) {
        return typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha);
    }

    validar() {
        const errores = [];

        if (!this.nombre) errores.push("El nombre es obligatorio.");
        if (!this.descripcion) errores.push("La descripción es obligatoria.");
        if (!this.estado) errores.push("El estado es obligatorio.");

        if (this.porcentaje <= 0 && this.monto_fijo <= 0) {
            errores.push("Debe ingresar un porcentaje o un monto fijo mayor a 0.");
        }

        if (this.porcentaje < 0 || this.porcentaje > 100) {
            errores.push("El porcentaje debe estar entre 1 y 100.");
        }

        if (this.monto_fijo < 0) {
            errores.push("El monto fijo no puede ser negativo.");
        }

        if (!DescuentosTablaModel.esFechaValida(this.fecha_inicio)) {
            errores.push("La fecha de inicio no tiene un formato válido (YYYY-MM-DD).");
        }

        if (!DescuentosTablaModel.esFechaValida(this.fecha_fin)) {
            errores.push("La fecha de fin no tiene un formato válido (YYYY-MM-DD).");
        }

        if (
            this.fecha_inicio &&
            this.fecha_fin &&
            new Date(this.fecha_fin) < new Date(this.fecha_inicio)
        ) {
            errores.push("La fecha de fin no puede ser anterior a la de inicio.");
        }

        return {
            isValid: errores.length === 0,
            errores
        };
    }

    obtenerDatos() {
        return {
            nombre: this.nombre,
            descripcion: this.descripcion,
            porcentaje: this.porcentaje,
            monto_fijo: this.monto_fijo,
            fecha_inicio: this.fecha_inicio,
            fecha_fin: this.fecha_fin,
            estado: this.estado,
            producto_id: this.producto_id,
            categoria_id: this.categoria_id,
            id_descuento: this.id_descuento
        };
    }
}
