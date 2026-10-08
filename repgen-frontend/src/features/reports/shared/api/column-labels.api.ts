import type { ColumnLabelsResponse } from "@repgen/shared-types";
import { apiFetch } from "../../../../shared/api/http";

export type { ColumnLabelsResponse } from "@repgen/shared-types";

export const fetchColumnLabels = (): Promise<ColumnLabelsResponse> =>
  apiFetch<ColumnLabelsResponse>("/tenant/column-labels");
