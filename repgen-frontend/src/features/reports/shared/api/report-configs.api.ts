import type { ReportConfigResponse } from "@repgen/shared-types";
import { apiFetch } from "../../../../shared/api/http";

export type { ColumnStateEntry, ReportConfigResponse } from "@repgen/shared-types";

export const fetchReportConfigs = (
  reportId: string,
): Promise<ReportConfigResponse[]> =>
  apiFetch<ReportConfigResponse[]>(
    `/report-configs?reportId=${encodeURIComponent(reportId)}`,
  );

type ContenidoVista = Pick<ReportConfigResponse, "columnState" | "filterModel" | "periodo">;

export const createReportConfig = (
  reportId: string,
  name: string,
  contenido: ContenidoVista,
  isDefault: boolean,
): Promise<ReportConfigResponse> =>
  apiFetch<ReportConfigResponse>("/report-configs", {
    method: "POST",
    body: { reportId, name, ...contenido, isDefault },
  });

export const updateReportConfig = (
  id: string,
  patch: Partial<
    Pick<ReportConfigResponse, "name" | "columnState" | "filterModel" | "periodo" | "isDefault">
  >,
): Promise<ReportConfigResponse> =>
  apiFetch<ReportConfigResponse>(`/report-configs/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: patch,
  });

export const deleteReportConfig = (id: string): Promise<void> =>
  apiFetch<void>(`/report-configs/${encodeURIComponent(id)}`, { method: "DELETE" });
