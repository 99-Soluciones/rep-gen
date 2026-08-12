import toast from "react-hot-toast";
import { obtenerFechaHoyFormateada, obtenerPrimerDiaDelMes } from "../utils/dateFormatted";

const URL_BASE_API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/reports`
  : "/api/v1/reports";

const solicitudesPendientes = new Map<string, Promise<RespuestaReporte<unknown>>>();

interface SolicitudReporte {
  endpoint: string;
  busquedaGlobal?: string;
  modeloFiltros?: Record<string, unknown>;
  rangoFechas?: {
    fechaInicio: string;
    fechaFin: string;
  };
  pagina?: number;
  limite?: number;
}

interface RespuestaReporte<TReporteData> {
  datos: TReporteData[];
  totalElementos: number;
  totalPaginas: number;
  paginaActual: number;
  fechaInicial: string;
  fechaFinal: string;
}

export const obtenerReporte = async <TReporteData>({
  endpoint,
  busquedaGlobal,
  modeloFiltros,
  rangoFechas,
  pagina,
  limite,
}: SolicitudReporte): Promise<RespuestaReporte<TReporteData>> => {
  const rangoFechasNormalizado =
    !rangoFechas?.fechaInicio && !rangoFechas?.fechaFin
      ? {
          fechaInicio: obtenerPrimerDiaDelMes(),
          fechaFin: obtenerFechaHoyFormateada(),
        }
      : rangoFechas?.fechaInicio && rangoFechas?.fechaFin
        ? {
            fechaInicio: rangoFechas.fechaInicio,
            fechaFin: rangoFechas.fechaFin,
          }
        : rangoFechas;

  const cuerpoSolicitud = {
    globalSearch: busquedaGlobal,
    filterModel: modeloFiltros,
    dateRange: {
      startDate: rangoFechasNormalizado?.fechaInicio || "",
      endDate: rangoFechasNormalizado?.fechaFin || "",
    },
  };

  const claveSolicitud = `${endpoint}:${JSON.stringify(cuerpoSolicitud)}`;

  const solicitudExistente = solicitudesPendientes.get(claveSolicitud) as
    | Promise<RespuestaReporte<TReporteData>>
    | undefined;

  if (solicitudExistente) {
    return solicitudExistente;
  }

  const promesaSolicitud = (async () => {
    const respuesta = await fetch(
      `${URL_BASE_API}/${endpoint}?page=${pagina}&limit=${limite}`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cuerpoSolicitud),
      },
    );

    if (respuesta.status === 401) {
      toast.error("Sesión expirada. Por favor, inicia sesión nuevamente.");
      window.location.reload();
      throw new Error("Sesión expirada.");
    }

    if (!respuesta.ok) {
      const respuestaError = await respuesta.json();
      toast.error(
        `Error en la solicitud: ${respuestaError.statusCode} - ${respuestaError.message}`,
      );
      throw new Error(`Error en la solicitud: ${respuesta.status} - ${respuestaError}`);
    }

    const resultado = await respuesta.json();

    if (!resultado.data || !resultado.meta) {
      return { datos: [], totalElementos: 0, totalPaginas: 1, paginaActual: 1, fechaInicial: rangoFechasNormalizado?.fechaInicio || "", fechaFinal: rangoFechasNormalizado?.fechaFin || "" };
    }

    return {
      datos: resultado.data,
      totalElementos: resultado.meta.totalRecords ?? 0,
      totalPaginas: resultado.meta.totalPages,
      paginaActual: resultado.meta.currentPage,
      fechaInicial: rangoFechasNormalizado?.fechaInicio || "",
      fechaFinal: rangoFechasNormalizado?.fechaFin || "",
    };
  })();

  solicitudesPendientes.set(
    claveSolicitud,
    promesaSolicitud as Promise<RespuestaReporte<TReporteData>>,
  );

  try {
    return await promesaSolicitud;
  } finally {
    solicitudesPendientes.delete(claveSolicitud);
  }
};
