import type { ColumnLabelsResponse, TenantFeaturesResponse } from "@repgen/shared-types";

export type { ColumnLabelsResponse, TenantFeaturesResponse } from "@repgen/shared-types";

const API_URL = import.meta.env.VITE_API_URL || "/api/v1";

export const fetchTenantFeatures = async (): Promise<TenantFeaturesResponse> => {
  const respuesta = await fetch(`${API_URL}/tenant/features`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!respuesta.ok) {
    throw new Error(
      `Error al cargar características del tenant (${respuesta.status})`,
    );
  }

  return respuesta.json() as Promise<TenantFeaturesResponse>;
};

export const fetchColumnLabels = async (): Promise<ColumnLabelsResponse> => {
  const respuesta = await fetch(`${API_URL}/tenant/column-labels`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!respuesta.ok) {
    throw new Error(`Error al cargar etiquetas de columnas (${respuesta.status})`);
  }

  return respuesta.json() as Promise<ColumnLabelsResponse>;
};
