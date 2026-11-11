import { useEffect, useRef, useState } from "react";
import { obtenerReporteCorte } from "./api/reportes.api";
import { ApiError } from "../../../shared/api/http";
import { obtenerFechaHoyFormateada } from "../../../shared/utils/fechas";
import { describirErrorCarga, type ErrorCarga } from "./useReporteBase";

/**
 * Como useReporteBase, pero para un reporte a fecha de corte (un solo día,
 * por defecto hoy) en vez de un rango. Cambiar el corte vuelve a consultar.
 * Si la carga falla se vacían los registros, salvo en sesión expirada (401):
 * los de pantalla siguen siendo válidos para filtrar y exportar, así que se
 * conservan y se vuelve al corte que los cargó.
 */
export const useReporteCorte = <T,>({ endpoint }: { endpoint: string }) => {
  const [datos, setDatos] = useState<T[]>([]);
  const [estaCargando, setEstaCargando] = useState(false);
  const [error, setError] = useState<ErrorCarga | null>(null);
  const [intento, setIntento] = useState(0);
  const [cargadoEn, setCargadoEn] = useState<Date | null>(null);
  const [fechaCorte, setFechaCorte] = useState(obtenerFechaHoyFormateada);

  // El corte de los registros en pantalla (última carga correcta).
  const corteCargadoRef = useRef<string | null>(null);
  // Volver a ese corte tras un 401 no debe consultar de nuevo (daría otro 401).
  const omitirCargaRef = useRef(false);
  // "Actualizar datos" / Reintentar: la siguiente carga pide datos frescos, sin caché.
  const refrescarRef = useRef(false);

  useEffect(() => {
    if (omitirCargaRef.current) {
      omitirCargaRef.current = false;
      return;
    }
    let cancelado = false;
    const refrescar = refrescarRef.current;
    refrescarRef.current = false;
    const cargar = async () => {
      setEstaCargando(true);
      setError(null);
      try {
        const resultado = await obtenerReporteCorte<T>({
          endpoint,
          fechaCorte,
          ...(refrescar && { refrescar: true }),
        });
        if (!cancelado) {
          setDatos(resultado.data);
          setCargadoEn(new Date());
          corteCargadoRef.current = fechaCorte;
        }
      } catch (errorCarga) {
        if (!cancelado) {
          const corteCargado = corteCargadoRef.current;
          const sesionExpirada = errorCarga instanceof ApiError && errorCarga.status === 401;
          if (sesionExpirada && corteCargado !== null) {
            if (corteCargado !== fechaCorte) {
              omitirCargaRef.current = true;
              setFechaCorte(corteCargado);
            }
          } else {
            setDatos([]);
            setError(describirErrorCarga(errorCarga));
          }
          console.error("Error al obtener los datos:", errorCarga);
        }
      }
      if (!cancelado) setEstaCargando(false);
    };
    void cargar();
    return () => {
      cancelado = true;
    };
  }, [endpoint, fechaCorte, intento]);

  return {
    datos,
    estaCargando,
    error,
    cargadoEn,
    intento,
    reintentar: () => {
      refrescarRef.current = true;
      setIntento((n) => n + 1);
    },
    fechaCorte,
    setFechaCorte,
  };
};
