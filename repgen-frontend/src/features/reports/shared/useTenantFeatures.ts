import { useState, useEffect } from "react";
import type { TenantFeaturesResponse } from "@repgen/shared-types";
import { apiFetch } from "../../../shared/api/http";

// Module-level cache: one HTTP request per browser session regardless of how
// many components call this hook simultaneously.
let _featuresPromise: Promise<boolean> | null = null;

const getReportConfigsEnabled = (): Promise<boolean> => {
  if (!_featuresPromise) {
    _featuresPromise = apiFetch<TenantFeaturesResponse>("/tenant/features")
      .then((f) => f.reportConfigs)
      .catch(() => {
        // Sin caché del fallo: el próximo reporte que se abra vuelve a preguntar.
        _featuresPromise = null;
        return false;
      });
  }
  return _featuresPromise;
};

export const useTenantFeatures = () => {
  const [habilitarConfiguraciones, setHabilitarConfiguraciones] = useState<
    boolean | undefined
  >(undefined);

  useEffect(() => {
    let activo = true;
    void getReportConfigsEnabled().then((enabled) => {
      if (activo) setHabilitarConfiguraciones(enabled);
    });
    return () => {
      activo = false;
    };
  }, []);

  return { habilitarConfiguraciones };
};
