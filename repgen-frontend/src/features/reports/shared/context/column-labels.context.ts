import { createContext } from "react";
import type { ColumnLabelsResponse } from "../api/column-labels.api";

export const labelsVacias: ColumnLabelsResponse = {
  cliente: {
    clasificacion1: "",
    clasificacion2: "",
    clasificacion3: "",
    clasificacion4: "",
  },
  articulo: {
    categoria1: "",
    categoria2: "",
    categoria3: "",
    categoria4: "",
  },
};

export interface ColumnLabelsContextValue {
  labels: ColumnLabelsResponse;
  isLoading: boolean;
  error: string | null;
  getLabel: (slot: string) => string | undefined;
  refreshLabels: () => Promise<void>;
}

export const ColumnLabelsContext =
  createContext<ColumnLabelsContextValue | null>(null);

const STORAGE_PREFIX = "repgen:column-labels:";

export const leerDesdeStorage = (
  tenant: string,
): ColumnLabelsResponse | null => {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${tenant}`);
    if (!raw) return null;
    return JSON.parse(raw) as ColumnLabelsResponse;
  } catch {
    return null;
  }
};

export const guardarEnStorage = (
  tenant: string,
  labels: ColumnLabelsResponse,
): void => {
  sessionStorage.setItem(`${STORAGE_PREFIX}${tenant}`, JSON.stringify(labels));
};

export const resolverSlot = (
  labels: ColumnLabelsResponse,
  slot: string,
): string | undefined => {
  const [grupo, clave] = slot.split(".");
  if (!grupo || !clave) return undefined;

  const valor =
    grupo === "cliente"
      ? labels.cliente[clave as keyof ColumnLabelsResponse["cliente"]]
      : grupo === "articulo"
        ? labels.articulo[clave as keyof ColumnLabelsResponse["articulo"]]
        : undefined;

  const texto = valor?.trim();
  return texto || undefined;
};

export const estadoInicialLabels = (
  tenant: string | null,
): ColumnLabelsResponse => {
  if (!tenant) return labelsVacias;
  return leerDesdeStorage(tenant) ?? labelsVacias;
};
