/**
 * Filtro de igualdad para valores de texto o numéricos. Retorna true si el valor de la celda es exactamente igual al valor del filtro.
 * AG Grid pasa los valores del filtro como array: predicate(filterValues[], cellValue).
 *
 * @return {boolean} Retorna true si el valor de la celda es igual al valor del filtro, de lo contrario retorna false.
 */
export const filtroIgual = ([valorFiltro]: unknown[], valorCelda: unknown) : boolean => {
    return valorCelda === valorFiltro;
};

/**
 * Filtro de comparación para valores numéricos. Retorna true si el valor de la celda es mayor que el valor del filtro.
 * @param {IFilterParams} params - Los parámetros del filtro que incluyen el valor del filtro y el valor de la celda.
 * @return {boolean} Retorna true si el valor de la celda es mayor que el valor del filtro, de lo contrario retorna false.
 */
export const filtroMayorQue = (valorFiltro: number, valorCelda: number): boolean => {
    return valorCelda > valorFiltro;
};

/**
 * Filtro de comparación para valores numéricos. Retorna true si el valor de la celda es menor que el valor del filtro.
 * @param {IFilterParams} params - Los parámetros del filtro que incluyen el valor del filtro y el valor de la celda.
 * @return {boolean} Retorna true si el valor de la celda es menor que el valor del filtro, de lo contrario retorna false.
 */
export const filtroMenorQue = (valorFiltro: number, valorCelda: number): boolean => {
    return valorCelda < valorFiltro;
};

/**
 * Filtro para celdas vacías. Retorna true si el valor de la celda es null, undefined o una cadena vacía.
 * @param  filterValue[] - El valor del filtro, que no se utiliza en este caso ya que el filtro se basa únicamente en el valor de la celda.
 * @param cellValue - El valor de la celda que se está evaluando.
 * @return {boolean} Retorna true si el valor de la celda es null, undefined o una cadena vacía, de lo contrario retorna false.
 */
export const filtroVacio = (_valorFiltro : unknown[], valorCelda : unknown) : boolean => {
    return valorCelda === null || valorCelda === undefined || valorCelda === "";
}

/**
 * Normaliza un texto a minúsculas y sin acentos/diacríticos, para comparaciones insensibles a mayúsculas y tildes.
 * @param {string} texto - El texto a normalizar.
 * @return {string} El texto normalizado en minúsculas y sin acentos.
 */
const normalizarTexto = (texto: string): string => {
    return texto
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
};

/**
 * Filtro para buscar subcadenas en valores de texto. Retorna true si el valor de la celda contiene el valor del filtro,
 * ignorando mayúsculas/minúsculas y acentos.
 * @param {IFilterParams} params - Los parámetros del filtro que incluyen el valor del filtro y el valor de la celda.
 * @return {boolean} Retorna true si el valor de la celda contiene el valor del filtro, de lo contrario retorna false.
 */
export const filtroContiene = (valorFiltro: string, valorCelda: string): boolean => {
    return valorCelda != null && normalizarTexto(valorCelda).includes(normalizarTexto(valorFiltro));
}

/**
 * Convierte un valor de fecha a un objeto Date válido.
 * Prioriza el formato ISO (YYYY-MM-DD) para evitar desfases por zona horaria.
 */
const parsearFecha = (valor: unknown): Date | null => {
    if (valor == null || valor === "") {
        return null;
    }

    if (valor instanceof Date) {
        return Number.isNaN(valor.getTime()) ? null : valor;
    }

    const texto = String(valor).trim();
    const coincidenciaIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (coincidenciaIso) {
        const [, anio, mes, dia] = coincidenciaIso;
        const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia));
        return Number.isNaN(fecha.getTime()) ? null : fecha;
    }

    const fecha = new Date(texto);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
};

/**
 * Convierte un valor de fecha al timestamp del inicio del día (00:00:00.000).
 */
export const convertirATimestampInicioDia = (valor: unknown): number | null => {
    const fecha = parsearFecha(valor);
    if (!fecha) {
        return null;
    }

    fecha.setHours(0, 0, 0, 0);
    return fecha.getTime();
};

/**
 * Comparador de fechas para AG Grid cuando los valores de celda no son Date nativos.
 */
export const comparadorFecha = (fechaFiltro: Date, valorCelda: unknown): number => {
    const tsFiltro = convertirATimestampInicioDia(fechaFiltro);
    const tsCelda = convertirATimestampInicioDia(valorCelda);

    if (tsFiltro == null || tsCelda == null) {
        return -1;
    }

    if (tsCelda === tsFiltro) {
        return 0;
    }

    return tsCelda < tsFiltro ? -1 : 1;
};

/** Filtro de igualdad para fechas comparando por timestamp de inicio de día. */
export const filtroFechaIgual = ([valorFiltro]: unknown[], valorCelda: unknown): boolean => {
    const tsFiltro = convertirATimestampInicioDia(valorFiltro);
    const tsCelda = convertirATimestampInicioDia(valorCelda);
    return tsFiltro != null && tsCelda != null && tsCelda === tsFiltro;
};

/** Filtro de fechas posteriores al valor indicado. */
export const filtroFechaMayorQue = ([valorFiltro]: unknown[], valorCelda: unknown): boolean => {
    const tsFiltro = convertirATimestampInicioDia(valorFiltro);
    const tsCelda = convertirATimestampInicioDia(valorCelda);
    return tsFiltro != null && tsCelda != null && tsCelda > tsFiltro;
};

/** Filtro de fechas anteriores al valor indicado. */
export const filtroFechaMenorQue = ([valorFiltro]: unknown[], valorCelda: unknown): boolean => {
    const tsFiltro = convertirATimestampInicioDia(valorFiltro);
    const tsCelda = convertirATimestampInicioDia(valorCelda);
    return tsFiltro != null && tsCelda != null && tsCelda < tsFiltro;
};

/** Filtro de fechas dentro de un rango inclusivo [desde, hasta]. */
export const filtroFechaEnRango = ([desde, hasta]: unknown[], valorCelda: unknown): boolean => {
    const tsDesde = convertirATimestampInicioDia(desde);
    const tsHasta = convertirATimestampInicioDia(hasta);
    const tsCelda = convertirATimestampInicioDia(valorCelda);

    if (tsCelda == null) {
        return false;
    }

    if (tsDesde != null && tsCelda < tsDesde) {
        return false;
    }

    if (tsHasta != null && tsCelda > tsHasta) {
        return false;
    }

    return tsDesde != null || tsHasta != null;
};
