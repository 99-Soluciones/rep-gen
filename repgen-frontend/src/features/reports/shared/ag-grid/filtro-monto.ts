/**
 * Lo que se escribe en el filtro flotante de una columna de montos, ida y
 * vuelta con el modelo de AG Grid:
 *   5000       igual, sin centavos (5,000.00 a 5,000.99); con decimales, exacto
 *   =5000      igual, exacto
 *   >5000  >=5000  <0  <=1000
 *   1000-5000  entre, ambos incluidos (los extremos al revés se acomodan)
 *   -1200      un negativo, no un rango; -500-100 sí es rango
 * Se ignoran espacios, "$" y las comas de miles.
 */

export interface CondicionMonto {
  type: string;
  filter: number;
  filterTo?: number;
}

/** "Igual a" que ignora los centavos si el valor es entero (ver filtroIgualSinCentavos). */
export const IGUAL_SIN_CENTAVOS = "igualSinCentavos";

const OPERADORES: Record<string, string> = {
  ">=": "greaterThanOrEqual",
  "<=": "lessThanOrEqual",
  ">": "greaterThan",
  "<": "lessThan",
  "=": "equals",
};

const numero = (texto: string): number | null => {
  const limpio = texto.replace(/,/g, "");
  return /^-?(\d+(\.\d*)?|\.\d+)$/.test(limpio) ? Number(limpio) : null;
};

/**
 * null = vacío (sin filtro); "invalido" = no es un monto ni una condición.
 * `sinCentavos` falso (porcentajes): un número solo es "igual a" exacto.
 */
export const interpretarMonto = (
  texto: string,
  sinCentavos = true,
): CondicionMonto | null | "invalido" => {
  const limpio = texto.replace(/[\s$]/g, "");
  if (!limpio) return null;

  const conOperador = /^(>=|<=|>|<|=)(.+)$/.exec(limpio);
  if (conOperador) {
    const valor = numero(conOperador[2]);
    return valor === null ? "invalido" : { type: OPERADORES[conOperador[1]], filter: valor };
  }

  const rango = /^(-?[\d.,]+)-(-?[\d.,]+)$/.exec(limpio);
  if (rango) {
    const a = numero(rango[1]);
    const b = numero(rango[2]);
    if (a === null || b === null) return "invalido";
    return { type: "inRange", filter: Math.min(a, b), filterTo: Math.max(a, b) };
  }

  const valor = numero(limpio);
  if (valor === null) return "invalido";
  return { type: sinCentavos ? IGUAL_SIN_CENTAVOS : "equals", filter: valor };
};

const PREFIJOS: Record<string, string> = {
  greaterThanOrEqual: ">=",
  lessThanOrEqual: "<=",
  greaterThan: ">",
  lessThan: "<",
};

/** El modelo de una condición como se escribiría; "" si no cabe en el input. */
export const montoATexto = (
  modelo: { type?: unknown; filter?: unknown; filterTo?: unknown } | null | undefined,
  sinCentavos = true,
): string => {
  if (!modelo || modelo.filter == null || modelo.filter === "") return "";
  const tipo = String(modelo.type ?? "");
  const valor = String(modelo.filter);
  if (tipo === "inRange") return modelo.filterTo == null ? "" : `${valor}-${String(modelo.filterTo)}`;
  if (tipo === IGUAL_SIN_CENTAVOS) return valor;
  // Con "sin centavos" el número solo es el igual que ignora centavos: el exacto lleva "=".
  if (tipo === "equals") return sinCentavos ? `=${valor}` : valor;
  return PREFIJOS[tipo] ? `${PREFIJOS[tipo]}${valor}` : "";
};
