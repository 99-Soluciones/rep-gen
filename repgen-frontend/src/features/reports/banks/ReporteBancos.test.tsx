import { vi } from "vitest";
import React from "react";

const obtenerReporteMock = vi.hoisted(() => vi.fn());
const filtrosMock = vi.hoisted(() =>
  vi.fn<(props: Record<string, unknown>) => React.ReactElement>(() => (
    <div data-testid="filtros-bancos" />
  )),
);
type TablaMockProps = {
  referenciaGrid: React.RefObject<{
    api?: {
      getColumns: () => Array<{ id: string }>;
      getFilterModel: () => Record<string, unknown>;
      isDestroyed: () => boolean;
      getDisplayedRowCount: () => number;
      forEachNodeAfterFilterAndSort: (
        cb: (node: {
          data: { moneda: string; abono: number; cargo: number };
        }) => void,
      ) => void;
    };
  }>;
  onGridListo: (event: {
    api: { getColumns: () => Array<{ id: string }> } & typeof eventosGrid;
  }) => void;
  onActualizacionModulo?: () => void;
};

// Lo que useReporteGrid usa del grid al quedar listo (suscripción + foto de la vista).
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
      const currentProps = propsRef.current;
      currentProps.referenciaGrid.current = {
        api: {
          getColumns: () => [{ id: "col-1" }],
          getFilterModel: () => ({ moneda: "MXN" }),
          isDestroyed: () => false,
          getDisplayedRowCount: () => 2,
          forEachNodeAfterFilterAndSort: (
            cb: (node: {
              data: { moneda: string; abono: number; cargo: number };
            }) => void,
          ) => {
            cb({ data: { moneda: "MXN", abono: 100, cargo: 40 } });
            cb({ data: { moneda: "USD", abono: 999, cargo: 999 } });
          },
        },
      };
      currentProps.onGridListo({
        api: { getColumns: () => [{ id: "col-1" }], ...eventosGrid },
      });
      currentProps.onActualizacionModulo?.();
    }, []);

    return <div data-testid="tabla-bancos" />;
  }),
);

// Todos los mocks antes de cualquier import del código bajo prueba.
vi.mock("../shared/api/reportes.api", () => ({
  obtenerReporte: (...args: unknown[]) => obtenerReporteMock(...args),
}));

vi.mock("../shared/EncabezadoReporte", () => ({
  default: (props: Record<string, unknown>) => filtrosMock(props),
}));

vi.mock("../shared/TablaDinamica/TablaDinamica", () => ({
  default: (props: TablaMockProps) => tablaMock(props),
}));

vi.mock("ag-grid-react", () => ({
  AgGridReact: vi.fn(),
}));

vi.mock("./columnas", () => ({
  columnasBancos: [{ field: "abono" as string }],
}));

vi.mock("../../../shared/utils/fechas", () => ({
  obtenerFechaHoyFormateada: () => "2026-05-08",
  obtenerPrimerDiaDelMes: () => "2026-05-01",
}));

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ReporteBancos from "./ReporteBancos";

describe("ReporteBancos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerReporteMock.mockResolvedValue([]);
  });

  it("renderiza filtros y tabla y consulta el endpoint de bancos", async () => {
    render(<ReporteBancos />);

    await waitFor(() => expect(obtenerReporteMock).toHaveBeenCalled(), {
      timeout: 500,
    });
    expect(screen.getByTestId("filtros-bancos")).toBeDefined();
    expect(screen.getByTestId("tabla-bancos")).toBeDefined();


    expect(obtenerReporteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "bancos/buscar",
        rangoFechas: { fechaInicio: "2026-05-01", fechaFin: "2026-05-08" },
      }),
    );
    expect(filtrosMock).toHaveBeenCalledWith(
      expect.objectContaining({
        titulo: "Reporte de Bancos",
      }),
    );
    expect(tablaMock).toHaveBeenCalledWith(
      expect.objectContaining({
        datos: [],
        estaCargando: false,
      }),
    );

    // El botón de exportar viaja en el slot `accionesToolbarFin` de la tabla
    // con el nombre de archivo correcto.
    const ultimaLlamada = tablaMock.mock.calls[tablaMock.mock.calls.length - 1]?.[0] as {
      accionesToolbarFin?: { props?: { nombreArchivo?: string } };
    };
    // El archivo se nombra con el rango aplicado, no con la fecha de descarga.
    expect(ultimaLlamada.accionesToolbarFin?.props?.nombreArchivo).toMatch(
      /^reporte_bancos_\d{4}-\d{2}-\d{2}_a_\d{4}-\d{2}-\d{2}$/,
    );

    // El filtro de columna de ag-grid se aplica localmente y no debe
    // generar una nueva solicitud al servidor.
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(obtenerReporteMock).toHaveBeenCalledTimes(1);

    // El toggle del panel de métricas ahora vive en PanelKpiLateral (no en
    // Filtros). Hay dos botones de colapso (desktop sobre la línea divisoria
    // y móvil en el header); ambos disparan el mismo onToggle.
    fireEvent.click(
      screen.getAllByRole("button", { name: "Ocultar resumen" })[0],
    );
    expect(
      screen.getAllByRole("button", { name: "Mostrar resumen" }).length,
    ).toBeGreaterThan(0);
  });
});
