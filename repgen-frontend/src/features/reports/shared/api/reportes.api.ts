import { apiFetch } from "../../../../shared/api/http";

const solicitudesPendientes = new Map<string, Promise<unknown[]>>();

interface SolicitudReporte {
  endpoint: string;
  rangoFechas: {
    fechaInicio: string;
    fechaFin: string;
  };
  /** "Actualizar datos": el backend ignora su caché (60 s) y vuelve a leer FileMaker. */
  refrescar?: boolean;
}

/**
 * Trae todos los registros del rango de fechas. El filtrado, orden y
 * paginación se hacen en el cliente (AG Grid), así que solo viaja el rango.
 * Solicitudes idénticas simultáneas comparten la misma promesa. Los errores se
 * propagan: el mensaje para el usuario lo arma useReporteBase.
 */
export const obtenerReporte = async <TReporteData>({
  endpoint,
  rangoFechas,
  refrescar,
}: SolicitudReporte): Promise<TReporteData[]> => {
  const cuerpoSolicitud = {
    dateRange: {
      startDate: rangoFechas.fechaInicio,
      endDate: rangoFechas.fechaFin,
    },
    ...(refrescar && { refresh: true }),
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
    .then((resultado) => resultado.data ?? []);

  solicitudesPendientes.set(claveSolicitud, promesaSolicitud);

  try {
    return await promesaSolicitud;
  } finally {
    solicitudesPendientes.delete(claveSolicitud);
  }
};
