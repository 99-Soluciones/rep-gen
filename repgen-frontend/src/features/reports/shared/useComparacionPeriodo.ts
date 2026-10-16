import { useEffect, useState } from "react";
import { obtenerReporte } from "./api/reportes.api";
import { periodoAnterior } from "./periodoAnterior";
import type { Rango } from "./ConfiguracionesColumnas/vista";

export interface ComparacionPeriodo {
  /** El periodo anterior con el que se compara. */
  rango: Rango;
  /** La cifra del periodo anterior; null mientras carga o si falló. */
  valor: number | null;
  estado: "cargando" | "error" | "lista";
}

/**
 * Lee el periodo anterior al rango cargado (una consulta más a FileMaker por
 * cada cambio de rango) y le aplica el mismo cálculo que al resumen. Usa
 * todas las filas: los filtros de la tabla no aplican al periodo anterior.
 */
export const useComparacionPeriodo = <T,>({
  endpoint,
  desde,
  hasta,
  calcular,
}: {
  endpoint: string;
  desde: string;
  hasta: string;
  calcular: (filas: T[]) => number;
}): ComparacionPeriodo => {
  const rango = periodoAnterior({ desde, hasta });
  const clave = `${endpoint}|${rango.desde}|${rango.hasta}`;
  const [resultado, setResultado] = useState<{ clave: string; filas: T[] | null; error: boolean } | null>(null);

  useEffect(() => {
    let vigente = true;
    obtenerReporte<T>({ endpoint, rangoFechas: { fechaInicio: rango.desde, fechaFin: rango.hasta } })
      .then((filas) => {
        if (vigente) setResultado({ clave, filas, error: false });
      })
      .catch(() => {
        if (vigente) setResultado({ clave, filas: null, error: true });
      });
    return () => {
      vigente = false;
    };
  }, [clave, endpoint, rango.desde, rango.hasta]);

  // Mientras llega la consulta del rango nuevo, lo anterior no cuenta.
  const actual = resultado?.clave === clave ? resultado : null;
  if (!actual) return { rango, valor: null, estado: "cargando" };
  if (actual.error || !actual.filas) return { rango, valor: null, estado: "error" };
  return { rango, valor: calcular(actual.filas), estado: "lista" };
};
