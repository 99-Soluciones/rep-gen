import toast from "react-hot-toast";

const URL_BASE_API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/reports`
  : "/api/v1/reports";

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

  const promesaSolicitud = (async (): Promise<TReporteData[]> => {
    const respuesta = await fetch(`${URL_BASE_API}/${endpoint}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cuerpoSolicitud),
    });

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
      throw new Error(`Error en la solicitud: ${respuesta.status} - ${respuestaError.message}`);
    }

    const resultado = (await respuesta.json()) as { data?: TReporteData[] };
    return resultado.data ?? [];
  })();

  solicitudesPendientes.set(claveSolicitud, promesaSolicitud);

  try {
    return await promesaSolicitud;
  } finally {
    solicitudesPendientes.delete(claveSolicitud);
  }
};
