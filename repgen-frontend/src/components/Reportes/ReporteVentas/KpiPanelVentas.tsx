import CardsKpi from "../PanelKpiLateral/CardsKpi";
import type { TotalesVentas } from "./useTotalesVentas";
import type { VentasRouteType } from "./ReporteVentas";

interface KpiPanelVentasProps {
  totales: TotalesVentas;
  currentType: VentasRouteType;
}

const KpiPanelVentas = ({ totales, currentType }: KpiPanelVentasProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
      <CardsKpi
        titulo="Total Facturado"
        valor={{ cantidad: totales.totalVentas, tipo: "moneda" }}
        color={{ positivo: "sky", negativo: "red" }}
        icono={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        }
      />
      <CardsKpi
        titulo="Cancelaciones"
        valor={{ cantidad: totales.totalCancelaciones, tipo: "moneda" }}
        color={{ positivo: "red", negativo: "red" }}
        icono={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        }
      />

      <CardsKpi
        titulo="Devoluciones"
        valor={{ cantidad: totales.totalDevoluciones, tipo: "moneda" }}
        color={{ positivo: "orange", negativo: "orange" }}
        icono={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
          />
        }
      />

      <CardsKpi
        titulo="Facturación Neta"
        valor={{ cantidad: totales.facturacionNeta, tipo: "moneda" }}
        color={{ positivo: "green", negativo: "red" }}
        icono={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        }
      />
      {currentType === "facturas" && (
      <CardsKpi
        titulo="Facturas Vencidas"
        valor={{ cantidad: totales.facturasVencidas, tipo: "unidades" }}
        color={{ positivo: "red", negativo: "red" }}
        icono={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        }

      />
      )}
      {currentType === "facturas" && (
      <CardsKpi
        titulo="Facturas Pagadas"
        valor={{ cantidad: totales.facturasPagadas, tipo: "unidades" }}
        color={{ positivo: "emerald", negativo: "emerald" }}
        icono={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        }
      />
      )}
      {currentType === "facturas" && (
      <CardsKpi
        titulo="Facturas Vigentes"
        valor={{ cantidad: totales.facturasVigentes, tipo: "unidades" }}
        color={{ positivo: "blue", negativo: "blue" }}
        icono={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        }
      />
      )}
      {currentType === "facturas" && (
      <CardsKpi
        titulo="Facturas Canceladas"
        valor={{ cantidad: totales.facturasCanceladas, tipo: "unidades" }}
        color={{ positivo: "red", negativo: "red" }}
        icono={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        }
      />
      )}
      {currentType === "facturas" && (
      <CardsKpi
        titulo="Devoluciones Generadas"
        valor={{ cantidad: totales.devoluciones, tipo: "unidades" }}
        color={{ positivo: "orange", negativo: "orange" }}
        icono={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        }
      />
      )}
      {currentType === "conceptos" && (
        <CardsKpi
          titulo="Ganancia Bruta"
          valor={{ cantidad: totales.gananciaBruta, tipo: "moneda" }}
          color={{ positivo: "emerald", negativo: "orange" }}
          icono={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          }
        />

      )}

      {currentType === "conceptos" && (
        <CardsKpi
        titulo="Costo Directo"
        valor={{ cantidad: totales.costoDirecto, tipo: "moneda" }}
        color={{ positivo: "navy", negativo: "gray" }}
        icono={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        }
      />
      )}
    </div>
  );
};

export default KpiPanelVentas;
