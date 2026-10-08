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
      getDisplayedRowCount: () => number;
      forEachNodeAfterFilterAndSort: (
        cb: (node: {
          data: { moneda: string; abono: number; cargo: number };
        }) => void,
      ) => void;
    };
  }>;
  onGridListo: (event: {
    api: { getColumns: () => Array<{ id: string }> };
  }) => void;
  onActualizacionModulo?: () => void;
};

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
        api: { getColumns: () => [{ id: "col-1" }] },
      });
      currentProps.onActualizacionModulo?.();
    }, []);

    return <div data-testid="tabla-bancos" />;
  }),
);
const moduleRegistryMock = vi.hoisted(() => ({ registerModules: vi.fn() }));

// Todos los mocks antes de cualquier import del código bajo prueba.
vi.mock("../../../services/api.reportes", () => ({
  obtenerReporte: (...args: unknown[]) => obtenerReporteMock(...args),
}));

vi.mock("../Filtros/EncabezadoReporte", () => ({
  default: (props: Record<string, unknown>) => filtrosMock(props),
}));

vi.mock("../TablaDinamica/TablaDinamica", () => ({
  default: (props: TablaMockProps) => tablaMock(props),
}));

vi.mock("ag-grid-react", () => ({
  AgGridReact: vi.fn(),
}));

vi.mock("ag-grid-community", () => ({
  AllCommunityModule: {},
  ModuleRegistry: moduleRegistryMock,
  themeQuartz: {},
}));

vi.mock("../../../config/ag-grid/Reportes/bancos/bancos.columas", () => ({
  columnasBancos: [{ field: "abono" as string }],
}));

vi.mock("../../shared/utils/date-formatted", () => ({
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
        rangoFechas: {
          fechaInicio: expect.any(String),
          fechaFin: expect.any(String),
        },
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
    expect(ultimaLlamada.accionesToolbarFin?.props?.nombreArchivo).toBe(
      "reporte_bancos",
    );

    // El filtro de columna de ag-grid se aplica localmente y no debe
    // generar una nueva solicitud al servidor.
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(obtenerReporteMock).toHaveBeenCalledTimes(1);

    // El toggle del panel de métricas ahora vive en PanelKpiLateral (no en
    // Filtros). Hay dos botones de colapso (desktop sobre la línea divisoria
    // y móvil en el header); ambos disparan el mismo onToggle.
    fireEvent.click(
      screen.getAllByRole("button", { name: "Ocultar dashboard" })[0],
    );
    expect(
      screen.getAllByRole("button", { name: "Mostrar dashboard" }).length,
    ).toBeGreaterThan(0);
  });
});
