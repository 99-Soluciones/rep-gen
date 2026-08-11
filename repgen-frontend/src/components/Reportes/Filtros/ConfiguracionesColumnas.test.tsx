import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { type RefObject } from "react";
import ConfiguracionesColumnas from "./ConfiguracionesColumnas";
import type { AgGridReact } from "ag-grid-react";
import type { ReportConfigResponse } from "../../../features/reports/shared/api/report-configs.api";

const createReportConfigMock = vi.hoisted(() => vi.fn());
const updateReportConfigMock = vi.hoisted(() => vi.fn());
const deleteReportConfigMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());

vi.mock("ag-grid-react", () => ({
  AgGridReact: () => null,
}));

vi.mock("react-hot-toast", () => ({
  default: { success: toastSuccessMock, error: toastErrorMock },
}));

vi.mock("../../../features/reports/shared/api/report-configs.api", () => ({
  createReportConfig: (...args: unknown[]) => createReportConfigMock(...args),
  updateReportConfig: (...args: unknown[]) => updateReportConfigMock(...args),
  deleteReportConfig: (...args: unknown[]) => deleteReportConfigMock(...args),
}));

describe("ConfiguracionesColumnas", () => {
  const configs: ReportConfigResponse[] = [
    {
      id: "cfg-uuid-1",
      reportId: "bancos",
      name: "Config A",
      columnState: [{ colId: "a", hide: false }],
      isDefault: false,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "cfg-uuid-2",
      reportId: "bancos",
      name: "Config B",
      columnState: [{ colId: "b", hide: true }],
      isDefault: true,
      createdAt: "",
      updatedAt: "",
    },
  ];

  const applyColumnState = vi.fn();
  const getColumnState = vi.fn(() => [{ colId: "a", hide: false, width: 120 }]);
  const getColumns = vi.fn(() => [{ getColId: () => "a", isVisible: () => true }]);

  const referenciaGrid = {
    current: { api: { applyColumnState, getColumnState, getColumns } },
  } as unknown as RefObject<AgGridReact | null>;

  const setColumnasVisibles = vi.fn();
  const onConfigsChange = vi.fn().mockResolvedValue(undefined);

  const renderComponente = (configsProp: ReportConfigResponse[] = configs) =>
    render(
      <ConfiguracionesColumnas
        referenciaGrid={referenciaGrid}
        setColumnasVisibles={setColumnasVisibles}
        reportId="bancos"
        configs={configsProp}
        onConfigsChange={onConfigsChange}
      />,
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lista las vistas e inicializa el selector con la predeterminada", () => {
    renderComponente();

    const select = screen.getByLabelText(
      "Vista de columnas",
    ) as HTMLSelectElement;
    // La config B (cfg-uuid-2) es la predeterminada → queda seleccionada al cargar
    expect(select.value).toBe("cfg-uuid-2");
    // La predeterminada se marca con estrella
    expect(screen.getByRole("option", { name: /★ Config B/ })).toBeInTheDocument();
  });

  it("aplica la vista al grid al seleccionarla en el dropdown", () => {
    renderComponente();

    fireEvent.change(screen.getByLabelText("Vista de columnas"), {
      target: { value: "cfg-uuid-1" },
    });

    expect(applyColumnState).toHaveBeenCalledWith({
      state: configs[0].columnState,
      applyOrder: true,
    });
    expect(setColumnasVisibles).toHaveBeenCalled();
  });

  it("guarda cambios en la vista seleccionada con el botón Guardar del grupo", async () => {
    updateReportConfigMock.mockResolvedValue(configs[1]);

    renderComponente();

    // La vista B está preseleccionada por ser la predeterminada
    fireEvent.click(screen.getByTitle('Guardar cambios en "Config B"'));

    await waitFor(() => {
      expect(updateReportConfigMock).toHaveBeenCalledWith("cfg-uuid-2", {
        columnState: getColumnState(),
      });
      expect(onConfigsChange).toHaveBeenCalled();
      expect(toastSuccessMock).toHaveBeenCalled();
    });
  });

  it("abre el popover de vista nueva con Guardar cuando no hay vista seleccionada", () => {
    renderComponente([]);

    fireEvent.click(screen.getByTitle("Guardar como vista nueva"));

    expect(
      screen.getByPlaceholderText("Nombre de la vista"),
    ).toBeInTheDocument();
  });

  it("crea una vista nueva desde el menú ⋮", async () => {
    createReportConfigMock.mockResolvedValue({
      id: "cfg-uuid-3",
      name: "Mi vista",
      reportId: "bancos",
      columnState: [],
      isDefault: false,
      createdAt: "",
      updatedAt: "",
    });

    renderComponente();

    fireEvent.click(screen.getByTitle("Acciones de la vista"));
    fireEvent.click(
      screen.getByRole("button", { name: /Guardar como vista nueva/i }),
    );
    fireEvent.change(screen.getByPlaceholderText("Nombre de la vista"), {
      target: { value: "Mi vista" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar vista nueva" }));

    await waitFor(() => {
      expect(createReportConfigMock).toHaveBeenCalledWith(
        "bancos",
        "Mi vista",
        getColumnState(),
        false,
      );
      expect(onConfigsChange).toHaveBeenCalled();
      expect(toastSuccessMock).toHaveBeenCalled();
    });
  });

  it("renombra la vista seleccionada desde el menú ⋮", async () => {
    updateReportConfigMock.mockResolvedValue({ ...configs[0], name: "Nuevo" });

    renderComponente();

    fireEvent.change(screen.getByLabelText("Vista de columnas"), {
      target: { value: "cfg-uuid-1" },
    });
    fireEvent.click(screen.getByTitle("Acciones de la vista"));
    fireEvent.click(screen.getByRole("button", { name: /Renombrar vista/i }));
    fireEvent.change(screen.getByLabelText("Nombre de la vista"), {
      target: { value: "Nuevo" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Renombrar$/ }));

    await waitFor(() => {
      expect(updateReportConfigMock).toHaveBeenCalledWith("cfg-uuid-1", {
        name: "Nuevo",
      });
      expect(onConfigsChange).toHaveBeenCalled();
    });
  });

  it("establece una vista como predeterminada desde el menú ⋮", async () => {
    updateReportConfigMock.mockResolvedValue({ ...configs[0], isDefault: true });

    renderComponente();

    // Seleccionar la config A (no es default) para poder predeterminarla
    fireEvent.change(screen.getByLabelText("Vista de columnas"), {
      target: { value: "cfg-uuid-1" },
    });
    fireEvent.click(screen.getByTitle("Acciones de la vista"));
    fireEvent.click(screen.getByRole("button", { name: /Predeterminar/i }));

    await waitFor(() => {
      expect(updateReportConfigMock).toHaveBeenCalledWith("cfg-uuid-1", {
        isDefault: true,
      });
      expect(onConfigsChange).toHaveBeenCalled();
    });
  });

  it("elimina una vista tras confirmar en el menú ⋮", async () => {
    deleteReportConfigMock.mockResolvedValue(undefined);

    renderComponente();

    fireEvent.change(screen.getByLabelText("Vista de columnas"), {
      target: { value: "cfg-uuid-1" },
    });
    fireEvent.click(screen.getByTitle("Acciones de la vista"));
    fireEvent.click(screen.getByRole("button", { name: /Eliminar vista/i }));
    // Aparece la confirmación inline
    fireEvent.click(screen.getByRole("button", { name: /Sí, eliminar/i }));

    await waitFor(() => {
      expect(deleteReportConfigMock).toHaveBeenCalledWith("cfg-uuid-1");
      expect(onConfigsChange).toHaveBeenCalled();
    });
  });

  it("deshabilita las acciones que requieren vista cuando no hay ninguna seleccionada", () => {
    renderComponente([]);

    // El menú ⋮ sigue disponible (permite "Guardar como vista nueva...")
    const kebab = screen.getByTitle("Acciones de la vista");
    expect(kebab).toBeEnabled();
    fireEvent.click(kebab);

    expect(
      screen.getByRole("button", { name: /Guardar cambios/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Renombrar vista/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Eliminar vista/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Guardar como vista nueva/i }),
    ).toBeEnabled();
  });
});
