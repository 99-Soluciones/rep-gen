import type { ColumnStateEntry, ReportConfigResponse } from "@repgen/shared-types";

export type { ColumnStateEntry, ReportConfigResponse } from "@repgen/shared-types";

const API_URL = import.meta.env.VITE_API_URL || "/api/v1";

const JSON_HEADERS = { "Content-Type": "application/json" };

export const fetchReportConfigs = async (
  reportId: string,
): Promise<ReportConfigResponse[]> => {
  const respuesta = await fetch(
    `${API_URL}/report-configs?reportId=${encodeURIComponent(reportId)}`,
    { method: "GET", credentials: "include" },
  );
  if (!respuesta.ok) {
    throw new Error(`Error al cargar configuraciones (${respuesta.status})`);
  }
  return respuesta.json() as Promise<ReportConfigResponse[]>;
};

export const createReportConfig = async (
  reportId: string,
  name: string,
  columnState: ColumnStateEntry[],
  isDefault: boolean,
): Promise<ReportConfigResponse> => {
  const respuesta = await fetch(`${API_URL}/report-configs`, {
    method: "POST",
    credentials: "include",
    headers: JSON_HEADERS,
    body: JSON.stringify({ reportId, name, columnState, isDefault }),
  });
  if (!respuesta.ok) {
    throw new Error(`Error al guardar configuración (${respuesta.status})`);
  }
  return respuesta.json() as Promise<ReportConfigResponse>;
};

export const updateReportConfig = async (
  id: string,
  patch: Partial<Pick<ReportConfigResponse, "name" | "columnState" | "isDefault">>,
): Promise<ReportConfigResponse> => {
  const respuesta = await fetch(`${API_URL}/report-configs/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: JSON_HEADERS,
    body: JSON.stringify(patch),
  });
  if (!respuesta.ok) {
    throw new Error(`Error al actualizar configuración (${respuesta.status})`);
  }

  return respuesta.json() as Promise<ReportConfigResponse>;
};

export const deleteReportConfig = async (id: string): Promise<void> => {
  const respuesta = await fetch(`${API_URL}/report-configs/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!respuesta.ok) {
    throw new Error(`Error al eliminar configuración (${respuesta.status})`);
  }
};
