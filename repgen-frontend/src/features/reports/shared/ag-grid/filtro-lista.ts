import {
  filtroContiene,
  filtroDistinto,
  filtroNoContiene,
  filtroTextoIgual,
  filtroVacio,
} from "./predicados-filtro";

/**
 * Filtro de lista (columnas marcadas `"filtro": "lista"` en el esquema): el
 * usuario marca valores en vez de escribirlos. El modelo guarda lo más corto
 * de decir, y eso decide qué pasa con valores nuevos del rango:
 * - incluir: solo esos valores ("Banco es BBVA o Santander"); uno nuevo queda fuera.
 * - excluir: todo menos esos ("Estatus: todo menos Cancelada"); uno nuevo entra.
 * - texto: un filtro de texto de una vista guardada antes de que la columna
 *   fuera lista; se respeta tal cual hasta que el usuario toque la lista.
 * "" representa la celda vacía.
 */
export type ModeloLista =
  | { filterType: "lista"; modo: "incluir" | "excluir"; valores: string[] }
  | { filterType: "lista"; modo: "texto"; condicion: CondicionTexto };

interface CondicionTexto {
  filterType?: string;
  type?: string | null;
  filter?: unknown;
}

export const VACIO = "";

/** El valor de una celda como clave de la lista: texto recortado; vacío = "". */
export const claveValor = (valor: unknown): string => (valor == null ? VACIO : String(valor).trim());

const PREDICADOS_TEXTO: Record<string, (filtro: unknown[], celda: unknown) => boolean> = {
  contains: filtroContiene,
  notContains: filtroNoContiene,
  equals: filtroTextoIgual,
  notEqual: filtroDistinto,
  blank: filtroVacio,
};

const pasaTexto = (condicion: CondicionTexto, clave: string) => {
  const predicado = PREDICADOS_TEXTO[condicion.type ?? ""];
  // Un tipo que la lista no conoce no excluye nada (mejor de más que filas perdidas en silencio).
  return predicado ? predicado([condicion.filter], clave === VACIO ? null : clave) : true;
};

export const pasaLista = (modelo: ModeloLista | null | undefined, valor: unknown): boolean => {
  if (!modelo) return true;
  const clave = claveValor(valor);
  if (modelo.modo === "texto") return pasaTexto(modelo.condicion, clave);
  const esta = modelo.valores.includes(clave);
  return modelo.modo === "incluir" ? esta : !esta;
};

/** Valores de la lista con su cuenta, por nombre; "(Vacío)" al final. */
export const universoValores = (valores: Iterable<unknown>): { valor: string; cuenta: number }[] => {
  const cuentas = new Map<string, number>();
  for (const v of valores) {
    const clave = claveValor(v);
    cuentas.set(clave, (cuentas.get(clave) ?? 0) + 1);
  }
  return [...cuentas.entries()]
    .map(([valor, cuenta]) => ({ valor, cuenta }))
    .sort((a, b) =>
      a.valor === VACIO ? 1 : b.valor === VACIO ? -1 : a.valor.localeCompare(b.valor, "es", { numeric: true }),
    );
};

/** Qué valores del universo están marcados con este modelo (sin modelo: todos). */
export const seleccionDesdeModelo = (modelo: ModeloLista | null | undefined, universo: string[]): Set<string> => {
  if (!modelo) return new Set(universo);
  if (modelo.modo === "texto") return new Set(universo.filter((v) => pasaTexto(modelo.condicion, v)));
  if (modelo.modo === "incluir") return new Set(modelo.valores);
  return new Set(universo.filter((v) => !modelo.valores.includes(v)));
};

/**
 * La selección como modelo: todo marcado = sin filtro; si no, lo más corto de
 * decir (incluir los marcados o excluir los desmarcados).
 */
export const modeloDesdeSeleccion = (universo: string[], marcados: Set<string>): ModeloLista | null => {
  const incluidos = universo.filter((v) => marcados.has(v));
  // Valores marcados que ya no están en el rango (de una selección anterior) siguen contando.
  const fueraDelRango = [...marcados].filter((v) => !universo.includes(v));
  const excluidos = universo.filter((v) => !marcados.has(v));
  if (excluidos.length === 0) return null;
  if (incluidos.length + fueraDelRango.length <= excluidos.length) {
    return { filterType: "lista", modo: "incluir", valores: [...incluidos, ...fueraDelRango] };
  }
  return { filterType: "lista", modo: "excluir", valores: excluidos };
};

/** Un filtro de texto guardado antes de que la columna fuera lista. */
export const envolverTextoLegado = (condicion: CondicionTexto): ModeloLista => ({
  filterType: "lista",
  modo: "texto",
  condicion,
});

export const etiquetaValor = (valor: string) => (valor === VACIO ? "(Vacío)" : valor);
