import { useEffect, useState, type ReactNode } from "react";
import {
  fetchColumnLabels,
  type ColumnLabelsResponse,
} from "../api/column-labels.api";
import {
  ColumnLabelsContext,
  estadoInicialLabels,
  guardarEnStorage,
  labelsVacias,
  leerDesdeStorage,
  resolverSlot,
} from "./column-labels.context";

const ColumnLabelsProviderInner = ({
  tenant,
  children,
}: {
  tenant: string | null;
  children: ReactNode;
}) => {
  const [labels, setLabels] = useState<ColumnLabelsResponse>(() =>
    estadoInicialLabels(tenant),
  );
  const [isLoading, setIsLoading] = useState(() => Boolean(tenant));
  const [error, setError] = useState<string | null>(null);

  const refreshLabels = async () => {
    if (!tenant) return;

    setIsLoading(true);
    setError(null);

    try {
      const respuesta = await fetchColumnLabels();
      setLabels(respuesta);
      guardarEnStorage(tenant, respuesta);
    } catch (err) {
      const cached = leerDesdeStorage(tenant);
      if (cached) {
        setLabels(cached);
      }
      setError((err as Error).message);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!tenant) return;

    let activo = true;

    fetchColumnLabels()
      .then((respuesta) => {
        if (!activo) return;
        setLabels(respuesta);
        guardarEnStorage(tenant, respuesta);
        setError(null);
      })
      .catch((err) => {
        if (!activo) return;
        const cached = leerDesdeStorage(tenant);
        if (cached) {
          setLabels(cached);
        }
        setError((err as Error).message);
      })
      .finally(() => {
        if (activo) {
          setIsLoading(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [tenant]);

  const getLabel = (slot: string) => resolverSlot(labels, slot);

  const value = {
    labels: tenant ? labels : labelsVacias,
    isLoading: tenant ? isLoading : false,
    error,
    getLabel,
    refreshLabels,
  };

  return (
    <ColumnLabelsContext.Provider value={value}>
      {children}
    </ColumnLabelsContext.Provider>
  );
};

export const ColumnLabelsProvider = ({
  tenant,
  children,
}: {
  tenant: string | null;
  children: ReactNode;
}) => (
  <ColumnLabelsProviderInner key={tenant ?? "__sin-tenant__"} tenant={tenant}>
    {children}
  </ColumnLabelsProviderInner>
);
