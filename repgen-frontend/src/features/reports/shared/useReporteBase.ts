import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { obtenerReporte } from "./api/reportes.api";
import { ApiError } from "../../../shared/api/http";
import {
  obtenerFechaHoyFormateada,
  obtenerPrimerDiaDelMes,
} from "../../../shared/utils/fechas";

interface UseReporteBaseParams {
  endpoint: string;
  onError?: (error: unknown) => void;
}

export interface ErrorCarga {
  mensaje: string;
  /** Falso en sesión expirada: reintentar no sirve hasta volver a entrar. */
  reintentable: boolean;
}

interface UseReporteBaseState<T> {
  datos: T[];
  estaCargando: boolean;
  error: ErrorCarga | null;
  reintentar: () => void;
  fechaDesde: string;
  setFechaDesde: Dispatch<SetStateAction<string>>;
  fechaHasta: string;
  setFechaHasta: Dispatch<SetStateAction<string>>;
  /** Fija el rango desde fuera del filtro de fechas (p. ej. el periodo de una vista). */
  aplicarRango: (desde: string, hasta: string) => void;
  /**
   * Cambia solo con aplicarRango: usarlo como `key` de FiltroFechas para que su
   * borrador tome las fechas nuevas. El 401 no lo toca, así el borrador del
   * usuario sigue visible como "Sin aplicar".
   */
  versionRango: number;
}

/** Mensaje para el usuario: sin códigos HTTP ni detalle técnico (va a consola). */
export const describirErrorCarga = (error: unknown): ErrorCarga => {
  if (!(error instanceof ApiError)) {
    return {
      mensaje: "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.",
      reintentable: true,
    };
  }
  if (error.status === 401) {
    return {
      mensaje: "Tu sesión expiró. Vuelve a abrir el reporte desde FileMaker para consultar estas fechas.",
      reintentable: false,
    };
  }
  if (error.status === 403) {
    return { mensaje: "No tienes permiso para ver este reporte.", reintentable: false };
  }
  if (error.status >= 500) {
    return {
      mensaje: "El servidor de datos no respondió. Puede ser algo momentáneo de FileMaker; inténtalo de nuevo en unos segundos.",
      reintentable: true,
    };
  }
  return { mensaje: "No se pudieron cargar los registros de este rango.", reintentable: true };
};

/**
 * Carga todos los registros del rango de fechas (por defecto, el mes en
 * curso). Solo el endpoint y las fechas disparan una nueva solicitud: los
 * filtros de columna de AG Grid se aplican localmente. Si la carga falla se
 * vacían los registros: nunca se muestran datos de otro rango bajo las fechas
 * nuevas.
 *
 * Excepción: sesión expirada (401). Los registros en pantalla siguen siendo
 * válidos (AvisoSesionExpirada promete que se pueden filtrar y exportar), así
 * que se conservan y se restaura el rango que los cargó; FiltroFechas muestra
 * entonces "Sin aplicar · la tabla muestra …" con el rango correcto.
 */
export const useReporteBase = <T,>({
  endpoint,
  onError,
}: UseReporteBaseParams): UseReporteBaseState<T> => {
  const [datos, setDatos] = useState<T[]>([]);
  const [estaCargando, setEstaCargando] = useState(false);
  const [error, setError] = useState<ErrorCarga | null>(null);
  const [intento, setIntento] = useState(0);
  const [fechaDesde, setFechaDesde] = useState(obtenerPrimerDiaDelMes);
  const [fechaHasta, setFechaHasta] = useState(obtenerFechaHoyFormateada);
  const [versionRango, setVersionRango] = useState(0);

  const onErrorRef = useRef(onError);
  // Qué se cargó por última vez con éxito (los registros en pantalla).
  const cargadoRef = useRef<{ endpoint: string; desde: string; hasta: string } | null>(null);
  // Restaurar el rango tras un 401 no debe volver a consultar (daría otro 401).
  const omitirCargaRef = useRef(false);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (omitirCargaRef.current) {
      omitirCargaRef.current = false;
      return;
    }
    let cancelado = false;

    const cargarDatos = async () => {
      setEstaCargando(true);
      setError(null);
      try {
        const resultado = await obtenerReporte<T>({
          endpoint,
          rangoFechas: { fechaInicio: fechaDesde, fechaFin: fechaHasta },
        });

        if (!cancelado) {
          setDatos(resultado);
          cargadoRef.current = { endpoint, desde: fechaDesde, hasta: fechaHasta };
        }
      } catch (errorCarga) {
        if (!cancelado) {
          const cargado = cargadoRef.current;
          const sesionExpirada =
            errorCarga instanceof ApiError && errorCarga.status === 401;

          if (sesionExpirada && cargado?.endpoint === endpoint) {
            // Se conservan los registros; solo se vuelve al rango que los cargó.
            if (cargado.desde !== fechaDesde || cargado.hasta !== fechaHasta) {
              omitirCargaRef.current = true;
              setFechaDesde(cargado.desde);
              setFechaHasta(cargado.hasta);
            }
          } else {
            // Otro error, o los registros eran de otro reporte (p. ej. otra pestaña).
            setDatos([]);
            setError(describirErrorCarga(errorCarga));
          }
          onErrorRef.current?.(errorCarga);
        }
      }
      if (!cancelado) {
        setEstaCargando(false);
      }
    };

    cargarDatos();

    return () => {
      cancelado = true;
    };
  }, [endpoint, fechaDesde, fechaHasta, intento]);

  return {
    datos,
    estaCargando,
    error,
    reintentar: () => setIntento((n) => n + 1),
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    aplicarRango: (desde: string, hasta: string) => {
      setFechaDesde(desde);
      setFechaHasta(hasta);
      setVersionRango((v) => v + 1);
    },
    versionRango,
  };
};
