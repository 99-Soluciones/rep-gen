/**
 * Funcion para convertir un valor a número, manejando tanto números como cadenas que representen números.
 * Si el valor es un número finito, se devuelve tal cual. Si es una cadena, se normaliza eliminando caracteres no numéricos (excepto punto y guion) 
 * y se intenta convertir a número. Si la conversión es exitosa y el resultado es un número finito, se devuelve el número;
 * @param value - El valor a convertir a número.
 * @returns El número convertido o null si la conversión no es posible.
 */
const convertirANumero = (valor: unknown): number | null => {
	if (typeof valor === "number" && Number.isFinite(valor)) {
		return valor;
	}

	if (typeof valor === "string") {
		const normalizado = valor.replace(/[^0-9.-]/g, "");
		const convertido = Number(normalizado);
		return Number.isFinite(convertido) ? convertido : null;
	}

	return null;
};

/**
 * Formatea un valor como moneda en pesos mexicanos.
 * @param value - El valor a formatear.
 * @returns La cadena formateada como moneda.
 */
export const formatearMoneda = (valor: unknown): string => {
	const numero = convertirANumero(valor);
	if (numero === null) {
		return "";
	}

	return numero.toLocaleString("es-MX", {
		style: "currency",
		currency: "MXN",
		minimumFractionDigits: 2,
	});
};

/**
 * Formatea un valor como número.
 * @param value - El valor a formatear.
 * @returns La cadena formateada como número.
 */
export const formatearNumero = (valor: unknown): string => {
	const numero = convertirANumero(valor);
	if (numero === null) {
		return "";
	}

	return numero.toLocaleString("es-MX", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 4,
	});
};

/**
 * Formatea un valor como porcentaje, normalizando valores mayores a 1 dividiéndolos entre 100.
 * @param value - El valor a formatear.
 * @returns La cadena formateada como porcentaje.
 */
export const formatearPorcentaje = (valor: unknown): string => {
	const numero = convertirANumero(valor);
	if (numero === null) {
		return "";
	}

	const normalizado = numero > 1 ? numero / 100 : numero;
	return normalizado.toLocaleString("es-MX", {
		style: "percent",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
};

/**
 * Formatea un valor como fecha en formato local de México. Si el valor no es una fecha válida, se devuelve su representación en cadena.
 * @param value - El valor a formatear como fecha.
 * @returns La cadena formateada como fecha o la representación en cadena del valor si no es una fecha válida.
 */
export const formatearFecha = (valor: unknown): string => {
	if (!valor) {
		return "";
	}

	const fecha = valor instanceof Date ? valor : new Date(String(valor));
	if (Number.isNaN(fecha.getTime())) {
		return String(valor);
	}

	return fecha.toLocaleDateString("es-MX");
};