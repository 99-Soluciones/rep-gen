import toast from "react-hot-toast";
import { ApiError, apiFetch } from "../../../../shared/api/http";

const solicitudesPendientes = new Map<string, Promise<unknown[]>>();

interface SolicitudReporte {
  endpoint: string;
  rangoFechas: {
    fechaInicio: string;
    fechaFin: string;
  };
}

/**
 * Trae todos los registros del rango de fechas. El filtrado, orden y
 * paginación se hacen en el cliente (AG Grid), así que solo viaja el rango.
 * Solicitudes idénticas simultáneas comparten la misma promesa.
 */
export const obtenerReporte = async <TReporteData>({
  endpoint,
  rangoFechas,
}: SolicitudReporte): Promise<TReporteData[]> => {
  const cuerpoSolicitud = {
    dateRange: {
      startDate: rangoFechas.fechaInicio,
      endDate: rangoFechas.fechaFin,
    },
  };

  const claveSolicitud = `${endpoint}:${JSON.stringify(cuerpoSolicitud)}`;

  const solicitudExistente = solicitudesPendientes.get(claveSolicitud) as
    | Promise<TReporteData[]>
    | undefined;

  if (solicitudExistente) {
    return solicitudExistente;
  }

  const promesaSolicitud = apiFetch<{ data?: TReporteData[] }>(
    `/reports/${endpoint}`,
    { method: "POST", body: cuerpoSolicitud },
  )
    .then((resultado) => resultado.data ?? [])
    .catch((error: unknown) => {
      // El 401 ya lo avisa apiFetch (sesión expirada).
      if (!(error instanceof ApiError && error.status === 401)) {
        const detalle =
          error instanceof ApiError
            ? `${error.status} - ${error.message}`
            : (error as Error).message;
        toast.error(`Error en la solicitud: ${detalle}`);
      }
      throw error;
    });

  solicitudesPendientes.set(claveSolicitud, promesaSolicitud);

  try {
    return await promesaSolicitud;
  } finally {
    solicitudesPendientes.delete(claveSolicitud);
  }
};
