import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { obtenerReporte } from "./api/reportes.api";
import {
  obtenerFechaHoyFormateada,
  obtenerPrimerDiaDelMes,
} from "../../../shared/utils/fechas";

interface UseReporteBaseParams {
  endpoint: string;
  onError?: (error: unknown) => void;
}

interface UseReporteBaseState<T> {
  datos: T[];
  estaCargando: boolean;
  fechaDesde: string;
  setFechaDesde: Dispatch<SetStateAction<string>>;
  fechaHasta: string;
  setFechaHasta: Dispatch<SetStateAction<string>>;
}

/**
 * Carga todos los registros del rango de fechas (por defecto, el mes en
 * curso). Solo el endpoint y las fechas disparan una nueva solicitud: los
 * filtros de columna de AG Grid se aplican localmente.
 */
export const useReporteBase = <T,>({
  endpoint,
  onError,
}: UseReporteBaseParams): UseReporteBaseState<T> => {
  const [datos, setDatos] = useState<T[]>([]);
  const [estaCargando, setEstaCargando] = useState(false);
  const [fechaDesde, setFechaDesde] = useState(obtenerPrimerDiaDelMes);
  const [fechaHasta, setFechaHasta] = useState(obtenerFechaHoyFormateada);

  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    let cancelado = false;

    const cargarDatos = async () => {
      setEstaCargando(true);
      try {
        const resultado = await obtenerReporte<T>({
          endpoint,
          rangoFechas: { fechaInicio: fechaDesde, fechaFin: fechaHasta },
        });

        if (!cancelado) {
          setDatos(resultado);
        }
      } catch (error) {
        if (!cancelado) {
          onErrorRef.current?.(error);
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
  }, [endpoint, fechaDesde, fechaHasta]);

  return {
    datos,
    estaCargando,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
  };
};
