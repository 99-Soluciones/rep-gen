import { useState, useEffect } from "react";
import {
  fetchReportConfigs,
  type ReportConfigResponse,
} from "./api/report-configs.api";

export const useReportConfigs = (reportId: string) => {
  const [configs, setConfigs] = useState<ReportConfigResponse[]>([]);
  const [cargando, setCargando] = useState(false);
  const [trigger, setTrigger] = useState(0);

  const refresh = async () => setTrigger((t) => t + 1);

  useEffect(() => {
    if (!reportId) return;
    let cancelled = false;
    const fetchData = async () => {
      setCargando(true);
      try {
        const data = await fetchReportConfigs(reportId);
        if (!cancelled) setConfigs(data);
      } catch {
        if (!cancelled) setConfigs([]);
      }
      if (!cancelled) setCargando(false);
    };
    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [reportId, trigger]);

  const defaultConfig = configs.find((c) => c.isDefault) ?? null;

  return { configs, defaultConfig, refresh, cargando };
};
