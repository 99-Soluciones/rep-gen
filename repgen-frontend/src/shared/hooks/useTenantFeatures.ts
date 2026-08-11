import { useState, useEffect } from "react";
import { fetchTenantFeatures } from "../../features/reports/shared/api/column-labels.api";

// Module-level cache: one HTTP request per browser session regardless of how
// many components call this hook simultaneously.
let _featuresPromise: Promise<boolean> | null = null;

const getReportConfigsEnabled = (): Promise<boolean> => {
  if (!_featuresPromise) {
    _featuresPromise = fetchTenantFeatures()
      .then((f) => f.reportConfigs)
      .catch(() => false);
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
