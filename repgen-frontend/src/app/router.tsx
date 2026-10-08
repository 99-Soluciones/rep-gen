import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./layout/Layout";
import ReporteBancos from "../features/reports/banks/ReporteBancos";
import ReporteVentas from "../features/reports/sales/ReporteVentas";
import ComingSoon from "../shared/ui/ComingSoon/ComingSoon";

const AppRouter = ({ reporteInicio }: { reporteInicio: string | null }) => {
  const rutaInicio =
    reporteInicio === "ventas" ? "ventas/facturas" : reporteInicio;

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to={`/${rutaInicio || "bancos"}`} />} />
          <Route path="/bancos" element={<ReporteBancos />} />
          <Route
            path="/ventas"
            element={<Navigate to="/ventas/facturas" replace />}
          />
          <Route path="/ventas/:reportType" element={<ReporteVentas />} />
          <Route path="/cuentas_por_cobrar" element={<ComingSoon />} />
          <Route path="/inventarios" element={<ComingSoon />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default AppRouter;
