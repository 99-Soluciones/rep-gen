import { vi } from "vitest";
import React from "react";

const obtenerReporteMock = vi.hoisted(() => vi.fn());
const encabezadoMock = vi.hoisted(() =>
  vi.fn<(props: Record<string, unknown>) => React.ReactElement>(() => (
    <div data-testid="encabezado-ingresos" />
  )),
);

type FilaMock = { tipoRenglon: string; bancoNombre: string; pagoGranTotalMxn: number };
type TablaMockProps = {
  referenciaGrid: React.RefObject<unknown>;
  definicionesColumnas: Array<{ field?: string }>;
  onGridListo: (event: unknown) => void;
  onActualizacionModulo?: () => void;
};

// Lo que useReporteGrid usa del grid al quedar listo.
const eventosGrid = vi.hoisted(() => ({
  addEventListener: () => {},
  isDestroyed: () => false,
  getColumnState: () => [],
  getFilterModel: () => ({}),
}));

const tablaMock = vi.hoisted(() =>
  vi.fn((props: TablaMockProps) => {
    const propsRef = React.useRef(props);
    propsRef.current = props;

    React.useEffect(() => {
      const actuales = propsRef.current;
      (actuales.referenciaGrid as { current: unknown }).current = {
        api: {
          getColumns: () => [{ id: "col-1" }],
          getFilterModel: () => ({}),
          isDestroyed: () => false,
          getDisplayedRowCount: () => 3,
          forEachNodeAfterFilter: (cb: (node: { data: FilaMock }) => void) => {
            cb({ data: { tipoRenglon: "Pago aplicado", bancoNombre: "BBVA", pagoGranTotalMxn: 960 } });
            cb({ data: { tipoRenglon: "Pago sin aplicar", bancoNombre: "BBVA", pagoGranTotalMxn: 48 } });
            cb({ data: { tipoRenglon: "Pago no identificado", bancoNombre: "Banorte", pagoGranTotalMxn: 500 } });
          },
        },
      };
      actuales.onGridListo({ api: { getColumns: () => [{ id: "col-1" }], ...eventosGrid } });
      actuales.onActualizacionModulo?.();
    }, []);

    return <div data-testid="tabla-ingresos" />;
  }),
);

// Todos los mocks antes de cualquier import del código bajo prueba.
vi.mock("../shared/api/reportes.api", () => ({
  obtenerReporte: (...args: unknown[]) => obtenerReporteMock(...args),
}));

vi.mock("../shared/EncabezadoReporte", () => ({
  default: (props: Record<string, unknown>) => encabezadoMock(props),
}));

vi.mock("../shared/TablaDinamica/TablaDinamica", () => ({
  default: (props: TablaMockProps) => tablaMock(props),
}));

vi.mock("ag-grid-react", () => ({
  AgGridReact: vi.fn(),
}));

vi.mock("../shared/column-labels/useColumnLabels", () => ({
  useColumnLabels: () => ({ getLabel: () => undefined }),
}));

vi.mock("../../../shared/utils/fechas", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../shared/utils/fechas")>()),
  obtenerFechaHoyFormateada: () => "2026-10-31",
  obtenerPrimerDiaDelMes: () => "2026-10-01",
}));

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ReporteFlujoIngresos from "./ReporteFlujoIngresos";

const renderEn = (ruta: string) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/flujo_efectivo_ingresos/:reportType" element={<ReporteFlujoIngresos />} />
      </Routes>
    </MemoryRouter>,
  );

const ultimaTabla = () => tablaMock.mock.calls[tablaMock.mock.calls.length - 1][0];

describe("ReporteFlujoIngresos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerReporteMock.mockResolvedValue([]);
  });

  it("la pestaña Facturas consulta su endpoint con el rango y resume por tipo y por banco", async () => {
    renderEn("/flujo_efectivo_ingresos/facturas");

    await waitFor(() =>
      expect(obtenerReporteMock).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "flujo-efectivo-ingresos/buscar",
          rangoFechas: { fechaInicio: "2026-10-01", fechaFin: "2026-10-31" },
        }),
      ),
    );
    expect(encabezadoMock).toHaveBeenCalledWith(
      expect.objectContaining({ titulo: "Flujo de efectivo - Ingresos" }),
    );
    expect(screen.getByTestId("tabla-ingresos")).toBeDefined();
    expect(ultimaTabla().definicionesColumnas.map((c) => c.field)).not.toContain("articuloSku");

    // 960 + 48 + 500 de las filas visibles de la tabla.
    await waitFor(() => expect(screen.getAllByText(/1,508\.00/).length).toBeGreaterThan(0));
    expect(screen.getByText("Aplicado a facturas")).toBeDefined();
    expect(screen.getByText("Sin aplicar (con cliente)")).toBeDefined();
    expect(screen.getByText("No identificado")).toBeDefined();
    expect(screen.getByText("Banorte")).toBeDefined();
  });

  it("la pestaña Conceptos consulta el endpoint por concepto y agrega las columnas del artículo", async () => {
    renderEn("/flujo_efectivo_ingresos/conceptos");

    await waitFor(() =>
      expect(obtenerReporteMock).toHaveBeenCalledWith(
        expect.objectContaining({ endpoint: "flujo-efectivo-ingresos-por-concepto/buscar" }),
      ),
    );
    expect(ultimaTabla().definicionesColumnas.map((c) => c.field)).toContain("articuloSku");
  });
});
