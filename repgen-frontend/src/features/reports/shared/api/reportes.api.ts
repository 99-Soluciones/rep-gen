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

/**
 * Reporte a una fecha de corte (Cuentas por cobrar): viaja un solo día y la
 * respuesta trae el corte con el que se calcularon los saldos.
 */
export const obtenerReporteCorte = async <TReporteData>({
  endpoint,
  fechaCorte,
  refrescar,
}: {
  endpoint: string;
  fechaCorte: string;
  refrescar?: boolean;
}): Promise<{ fechaCorte: string; data: TReporteData[] }> => {
  const resultado = await apiFetch<{ fechaCorte: string; data?: TReporteData[] }>(
    `/reports/${endpoint}`,
    { method: "POST", body: { fechaCorte, ...(refrescar && { refresh: true }) } },
  );
  return { fechaCorte: resultado.fechaCorte, data: resultado.data ?? [] };
};
