import { parsearFecha } from "./predicados-filtro";

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
		// Sin dígitos no es un número: Number("") da 0 y una celda vacía o la
		// etiqueta "Total MXN" se verían como $0.00.
		if (!/\d/.test(normalizado)) return null;
		const convertido = Number(normalizado);
		return Number.isFinite(convertido) ? convertido : null;
	}

	return null;
};

/** Un texto que no es número (p. ej. la etiqueta de la fila de totales) se muestra tal cual. */
const textoTalCual = (valor: unknown): string => (typeof valor === "string" ? valor : "");

/**
 * Formatea un valor como moneda. Sin moneda (o en MXN) usa "$"; en otra moneda
 * muestra su código ("USD 1,000.00") para que nunca parezca un monto en pesos.
 * @param valor - El valor a formatear.
 * @param moneda - Código ISO de la moneda del renglón (p. ej. "USD").
 * @returns La cadena formateada como moneda.
 */
export const formatearMoneda = (valor: unknown, moneda?: unknown): string => {
	const numero = convertirANumero(valor);
	if (numero === null) {
		return textoTalCual(valor);
	}

	const codigo = typeof moneda === "string" && moneda.trim() ? moneda.trim().toUpperCase() : "MXN";
	try {
		return numero.toLocaleString("es-MX", {
			style: "currency",
			currency: codigo,
			currencyDisplay: codigo === "MXN" ? "symbol" : "code",
			minimumFractionDigits: 2,
		});
	} catch {
		// Código que Intl no reconoce (p. ej. "Dólares"): número + texto tal cual.
		return `${numero.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${moneda as string}`;
	}
};

/**
 * Formatea un valor como número.
 * @param value - El valor a formatear.
 * @returns La cadena formateada como número.
 */
export const formatearNumero = (valor: unknown): string => {
	const numero = convertirANumero(valor);
	if (numero === null) {
		return textoTalCual(valor);
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
		return textoTalCual(valor);
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

	// parsearFecha lee "YYYY-MM-DD" como fecha local; new Date("YYYY-MM-DD") es
	// medianoche UTC y en México se mostraría el día anterior.
	const fecha = parsearFecha(valor);
	return fecha ? fecha.toLocaleDateString("es-MX") : String(valor);
};