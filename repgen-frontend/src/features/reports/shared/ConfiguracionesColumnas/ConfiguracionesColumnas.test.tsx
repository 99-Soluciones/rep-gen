import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { type RefObject } from "react";
import ConfiguracionesColumnas from "./ConfiguracionesColumnas";
import { huellaVista } from "./vista";
import type { AgGridReact } from "ag-grid-react";
import type { ReportConfigResponse } from "../api/report-configs.api";
import { salir } from "../../../../shared/utils/salidaProtegida";

const createReportConfigMock = vi.hoisted(() => vi.fn());
const updateReportConfigMock = vi.hoisted(() => vi.fn());
const deleteReportConfigMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());

vi.mock("ag-grid-react", () => ({
  AgGridReact: () => null,
}));

vi.mock("react-hot-toast", () => ({
  default: { success: toastSuccessMock, error: toastErrorMock, dismiss: vi.fn() },
}));

vi.mock("../api/report-configs.api", () => ({
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
  const getFilterModel = vi.fn((): Record<string, unknown> => ({}));
  const setFilterModel = vi.fn();
  const resetColumnState = vi.fn();
  const listeners = new Map<string, () => void>();

  const referenciaGrid = {
    current: {
      api: {
        applyColumnState,
        getColumnState,
        getColumns,
        getFilterModel,
        setFilterModel,
        resetColumnState,
        addEventListener: (evento: string, fn: () => void) => listeners.set(evento, fn),
        removeEventListener: (evento: string) => listeners.delete(evento),
        isDestroyed: () => false,
      },
    },
  } as unknown as RefObject<AgGridReact | null>;

  const setColumnasVisibles = vi.fn();
  const onConfigsChange = vi.fn().mockResolvedValue(undefined);

  const onAplicarRango = vi.fn();

  // Foto actual del grid tal como la entrega useReporteGrid (prop, no ref).
  const vistaGrid = (filterModel: Record<string, unknown> | null = null) => ({
    columnState: getColumnState(),
    filterModel,
  });

  const componente = (
    configsProp: ReportConfigResponse[] = configs,
    vistaActual = vistaGrid(),
  ) => (
    <ConfiguracionesColumnas
      referenciaGrid={referenciaGrid}
      setColumnasVisibles={setColumnasVisibles}
      reportId="bancos"
      configs={configsProp}
      onConfigsChange={onConfigsChange}
      rango={{ desde: "2026-10-01", hasta: "2026-10-12" }}
      onAplicarRango={onAplicarRango}
      vistaActual={vistaActual}
    />
  );

  const renderComponente = (
    configsProp: ReportConfigResponse[] = configs,
    vistaActual = vistaGrid(),
  ) => render(componente(configsProp, vistaActual));

  beforeEach(() => {
    vi.clearAllMocks();
    getFilterModel.mockReturnValue({});
  });

  it("lista las vistas e inicializa el selector con la predeterminada", () => {
    renderComponente();

    const select = screen.getByLabelText(
      "Vista",
    ) as HTMLSelectElement;
    // La config B (cfg-uuid-2) es la predeterminada → queda seleccionada al cargar
    expect(select.value).toBe("cfg-uuid-2");
    // A la vista lleva estrella; el lector de pantalla oye "predeterminada".
    const predeterminada = screen.getByRole("option", { name: "Config B (predeterminada)" });
    expect(predeterminada).toHaveTextContent("★ Config B");
  });

  it("aplica la vista al grid al seleccionarla en el dropdown", () => {
    renderComponente();

    fireEvent.change(screen.getByLabelText("Vista"), {
      target: { value: "cfg-uuid-1" },
    });

    expect(applyColumnState).toHaveBeenCalledWith({
      state: configs[0].columnState,
      applyOrder: true,
    });
    // Una vista sin filtros guardados limpia los filtros activos.
    expect(setFilterModel).toHaveBeenCalledWith(null);
    expect(setColumnasVisibles).toHaveBeenCalled();
    // Sin periodo: no toca las fechas.
    expect(onAplicarRango).not.toHaveBeenCalled();
  });

  it("al abrir una vista con periodo aplica sus fechas", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 12));
    renderComponente([{ ...configs[0], periodo: "mes_anterior" }]);

    fireEvent.change(screen.getByLabelText("Vista"), {
      target: { value: "cfg-uuid-1" },
    });

    expect(onAplicarRango).toHaveBeenCalledWith("2026-09-01", "2026-09-30");
    vi.useRealTimers();
  });

  it("recorrer fechas no es un cambio sin guardar: ofrece volver al periodo y Actualizar lo conserva", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 12));
    updateReportConfigMock.mockResolvedValue(configs[0]);
    // Vista con periodo "Mes anterior"; en pantalla está octubre (rango del componente).
    const vistaA = { ...configs[0], isDefault: true, periodo: "mes_anterior" as const };
    const { rerender } = renderComponente([vistaA]);

    expect(screen.getByRole("button", { name: "Actualizar vista" })).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(screen.getByRole("button", { name: "Volver a mes anterior" }));
    expect(onAplicarRango).toHaveBeenCalledWith("2026-09-01", "2026-09-30");

    // Un filtro sí es un cambio; actualizar guarda el periodo de la vista, no las fechas.
    getFilterModel.mockReturnValue({ a: { filterType: "text", filter: "BBVA" } });
    rerender(componente([vistaA], vistaGrid({ a: { filterType: "text", filter: "BBVA" } })));
    fireEvent.click(screen.getByRole("button", { name: /^Actualizar vista/ }));
    await waitFor(() =>
      expect(updateReportConfigMock).toHaveBeenCalledWith("cfg-uuid-1", {
        columnState: getColumnState(),
        filterModel: { a: { filterType: "text", filter: "BBVA" } },
        periodo: "mes_anterior",
      }),
    );
    vi.useRealTimers();
  });

  it("'— Ninguna —' restaura las columnas originales y quita los filtros", () => {
    renderComponente();

    fireEvent.change(screen.getByLabelText("Vista"), {
      target: { value: "" },
    });

    expect(resetColumnState).toHaveBeenCalled();
    expect(setFilterModel).toHaveBeenCalledWith(null);
    expect(onAplicarRango).not.toHaveBeenCalled();
  });

  it("marca la vista como sin guardar solo cuando cambian columnas o filtros, no el ancho", () => {
    const vistaA = { ...configs[0], columnState: [{ colId: "a", hide: false, width: 300 }] };
    const { rerender } = renderComponente([{ ...vistaA, isDefault: true }]);

    // Mismo estado salvo el ancho (120 vs 300): sin cambios.
    expect(screen.getByRole("button", { name: /^Actualizar vista/ })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Actualizar vista" })).toBeInTheDocument();

    // Se agrega un filtro: ahora sí hay cambios.
    rerender(
      componente([{ ...vistaA, isDefault: true }], vistaGrid({ a: { filterType: "text", filter: "BBVA" } })),
    );
    expect(screen.getByRole("button", { name: /^Actualizar vista/ })).not.toHaveAttribute("aria-disabled");
    // El aviso va en el botón que guarda, no en el nombre de la vista.
    expect(screen.getByRole("button", { name: "Actualizar vista (cambios sin guardar)" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Config A (predeterminada)" })).toBeInTheDocument();
  });

  it("recién abierta no figura como modificada aunque AG Grid normalice distinto lo guardado", () => {
    // Lo guardado difiere de lo que el grid reporta (p. ej. normalización de AG
    // Grid), pero la referencia es el grid tal como quedó al abrir la vista.
    const vistaA = { ...configs[0], isDefault: true, columnState: [{ colId: "a", hide: true }] };
    const foto = vistaGrid();
    render(
      <ConfiguracionesColumnas
        referenciaGrid={referenciaGrid}
        setColumnasVisibles={setColumnasVisibles}
        reportId="bancos"
        configs={[vistaA]}
        onConfigsChange={onConfigsChange}
        vistaActual={foto}
        vistaBase={{ configId: vistaA.id, huella: huellaVista(foto.columnState, foto.filterModel) }}
      />,
    );
    expect(screen.getByRole("button", { name: /^Actualizar vista/ })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Actualizar vista" })).toBeInTheDocument();
  });

  it("al elegir una vista avisa para fijar la referencia", () => {
    const onVistaAplicada = vi.fn();
    render(
      <ConfiguracionesColumnas
        referenciaGrid={referenciaGrid}
        setColumnasVisibles={setColumnasVisibles}
        reportId="bancos"
        configs={configs}
        onConfigsChange={onConfigsChange}
        vistaActual={vistaGrid()}
        onVistaAplicada={onVistaAplicada}
      />,
    );
    fireEvent.change(screen.getByLabelText("Vista"), { target: { value: "cfg-uuid-1" } });
    expect(onVistaAplicada).toHaveBeenCalledWith("cfg-uuid-1");
    fireEvent.change(screen.getByLabelText("Vista"), { target: { value: "" } });
    expect(onVistaAplicada).toHaveBeenLastCalledWith(null);
  });

  it("se habilita apenas el grid cambia, sin abrir el menú ⋮ (regresión React Compiler)", () => {
    const vistaA = { ...configs[0], isDefault: true };
    const { rerender } = renderComponente([vistaA]);
    expect(screen.getByRole("button", { name: /^Actualizar vista/ })).toHaveAttribute("aria-disabled", "true");

    // Ocultar una columna: useReporteGrid entrega una foto nueva como prop.
    rerender(
      componente([vistaA], { columnState: [{ colId: "a", hide: true, width: 120 }], filterModel: null }),
    );
    expect(screen.getByRole("button", { name: /^Actualizar vista/ })).not.toHaveAttribute("aria-disabled");

    // Volver a mostrarla: vuelve a coincidir con lo guardado.
    rerender(componente([vistaA], vistaGrid()));
    expect(screen.getByRole("button", { name: /^Actualizar vista/ })).toHaveAttribute("aria-disabled", "true");
  });

  it("guarda cambios en la vista seleccionada con el botón Guardar del grupo", async () => {
    updateReportConfigMock.mockResolvedValue(configs[1]);
    // Un filtro activo distinto de lo guardado: la vista tiene cambios.
    getFilterModel.mockReturnValue({ a: { filterType: "text", filter: "BBVA" } });

    renderComponente(configs, vistaGrid({ a: { filterType: "text", filter: "BBVA" } }));

    // La vista B está preseleccionada por ser la predeterminada
    fireEvent.click(screen.getByRole("button", { name: /^Actualizar vista/ }));

    await waitFor(() => {
      expect(updateReportConfigMock).toHaveBeenCalledWith("cfg-uuid-2", {
        columnState: getColumnState(),
        filterModel: { a: { filterType: "text", filter: "BBVA" } },
        periodo: null,
      });
      expect(onConfigsChange).toHaveBeenCalled();
      expect(toastSuccessMock).toHaveBeenCalled();
    });
  });

  it("Deshacer vuelve a guardar la versión anterior de la vista", async () => {
    updateReportConfigMock.mockResolvedValue(configs[1]);
    renderComponente(configs, vistaGrid({ a: { filterType: "text", filter: "BBVA" } }));

    fireEvent.click(screen.getByRole("button", { name: /^Actualizar vista/ }));
    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalled());

    // El toast trae un botón Deshacer: se renderiza el contenido que recibió.
    const contenido = toastSuccessMock.mock.calls[0][0] as (t: { id: string }) => React.ReactElement;
    render(contenido({ id: "t1" }));
    fireEvent.click(screen.getByRole("button", { name: "Deshacer" }));

    await waitFor(() =>
      expect(updateReportConfigMock).toHaveBeenLastCalledWith("cfg-uuid-2", {
        columnState: configs[1].columnState,
        filterModel: null,
        periodo: null,
      }),
    );
  });

  it("en «Ninguna», filtros sin guardar también piden confirmación antes de abrir una vista", () => {
    // Sin predeterminada: el selector queda en "Ninguna".
    const sinPredeterminada = configs.map((c) => ({ ...c, isDefault: false }));
    renderComponente(sinPredeterminada, vistaGrid({ a: { filterType: "text", filter: "BBVA" } }));
    expect(screen.getByRole("button", { name: "Guardar vista (cambios sin guardar)" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Vista"), { target: { value: "cfg-uuid-1" } });
    const aviso = screen.getByRole("alertdialog");
    expect(aviso).toHaveTextContent("Tienes filtros o columnas sin guardar.");
    expect(applyColumnState).not.toHaveBeenCalled();

    // Guardar como nueva cancela el cambio y abre el panel de vista nueva.
    fireEvent.click(screen.getByRole("button", { name: "Guardar como vista nueva" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nombre de la vista")).toBeInTheDocument();
    expect(screen.getByLabelText("Vista")).toHaveValue("");
  });

  it("con flechas la vista queda en espera: se aplica con Enter (o al salir), no en cada tecla", () => {
    renderComponente();
    const selector = screen.getByLabelText("Vista");

    fireEvent.keyDown(selector, { key: "ArrowUp" });
    fireEvent.change(selector, { target: { value: "cfg-uuid-1" } });
    expect(selector).toHaveValue("cfg-uuid-1");
    expect(applyColumnState).not.toHaveBeenCalled();

    fireEvent.keyDown(selector, { key: "Enter" });
    expect(applyColumnState).toHaveBeenCalledTimes(1);

    // Salir del selector también confirma lo que quedó en espera.
    fireEvent.keyDown(selector, { key: "ArrowDown" });
    fireEvent.change(selector, { target: { value: "cfg-uuid-2" } });
    expect(applyColumnState).toHaveBeenCalledTimes(1);
    fireEvent.blur(selector);
    expect(applyColumnState).toHaveBeenCalledTimes(2);
  });

  it("el aviso retiene Tab entre sus botones", () => {
    renderComponente(configs, vistaGrid({ a: { filterType: "text", filter: "BBVA" } }));
    fireEvent.change(screen.getByLabelText("Vista"), { target: { value: "cfg-uuid-1" } });
    const cancelar = screen.getByRole("button", { name: "Cancelar" });
    const actualizar = screen.getByRole("button", { name: "Actualizar y cambiar" });
    expect(cancelar).toHaveFocus();

    fireEvent.keyDown(cancelar, { key: "Tab", shiftKey: true });
    expect(actualizar).toHaveFocus();
    fireEvent.keyDown(actualizar, { key: "Tab" });
    expect(cancelar).toHaveFocus();
  });

  it("Deshacer con otra vista ya abierta no toca su referencia y avisa que los cambios se descartan", async () => {
    updateReportConfigMock.mockResolvedValue(configs[1]);
    const onVistaAplicada = vi.fn();
    render(
      <ConfiguracionesColumnas
        referenciaGrid={referenciaGrid}
        setColumnasVisibles={setColumnasVisibles}
        reportId="bancos"
        configs={configs}
        onConfigsChange={onConfigsChange}
        vistaActual={vistaGrid({ a: { filterType: "text", filter: "BBVA" } })}
        onVistaAplicada={onVistaAplicada}
      />,
    );
    // Actualizar y cambiar: guarda B y abre A.
    fireEvent.change(screen.getByLabelText("Vista"), { target: { value: "cfg-uuid-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Actualizar y cambiar" }));
    await waitFor(() => expect(screen.getByLabelText("Vista")).toHaveValue("cfg-uuid-1"));

    const contenido = toastSuccessMock.mock.calls[0][0] as (t: { id: string }) => React.ReactElement;
    render(contenido({ id: "t1" }));
    onVistaAplicada.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Deshacer" }));

    await waitFor(() =>
      expect(toastSuccessMock).toHaveBeenLastCalledWith(
        expect.stringContaining("Los cambios que habías guardado se descartaron."),
      ),
    );
    expect(onVistaAplicada).not.toHaveBeenCalled();
  });

  describe("con cambios sin guardar, cambiar de vista pregunta primero", () => {
    const conCambios = () =>
      renderComponente(configs, vistaGrid({ a: { filterType: "text", filter: "BBVA" } }));

    it("Cancelar deja la vista y los cambios como estaban", () => {
      conCambios();
      fireEvent.change(screen.getByLabelText("Vista"), { target: { value: "cfg-uuid-1" } });

      expect(screen.getByRole("alertdialog")).toHaveTextContent("cambios sin guardar en «Config B»");
      expect(applyColumnState).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(screen.getByLabelText("Vista")).toHaveValue("cfg-uuid-2");
    });

    it("Descartar abre la vista elegida sin guardar", () => {
      conCambios();
      fireEvent.change(screen.getByLabelText("Vista"), { target: { value: "cfg-uuid-1" } });
      fireEvent.click(screen.getByRole("button", { name: "Descartar cambios" }));

      expect(applyColumnState).toHaveBeenCalled();
      expect(updateReportConfigMock).not.toHaveBeenCalled();
      expect(screen.getByLabelText("Vista")).toHaveValue("cfg-uuid-1");
    });

    it("Actualizar y cambiar guarda la vista actual y luego abre la elegida", async () => {
      updateReportConfigMock.mockResolvedValue(configs[1]);
      conCambios();
      fireEvent.change(screen.getByLabelText("Vista"), { target: { value: "" } });
      fireEvent.click(screen.getByRole("button", { name: "Actualizar y cambiar" }));

      await waitFor(() => expect(screen.getByLabelText("Vista")).toHaveValue(""));
      expect(updateReportConfigMock).toHaveBeenCalledWith("cfg-uuid-2", expect.anything());
      expect(resetColumnState).toHaveBeenCalled();
    });
  });

  it("abre el popover de vista nueva con Guardar cuando no hay vista seleccionada", () => {
    renderComponente([]);

    fireEvent.click(screen.getByRole("button", { name: "Guardar vista" }));

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
      screen.getByRole("menuitem", { name: /Guardar como vista nueva/i }),
    );
    fireEvent.change(screen.getByPlaceholderText("Nombre de la vista"), {
      target: { value: "Mi vista" },
    });
    fireEvent.change(screen.getByLabelText("Periodo"), {
      target: { value: "mes_actual" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar vista nueva" }));

    await waitFor(() => {
      expect(createReportConfigMock).toHaveBeenCalledWith(
        "bancos",
        "Mi vista",
        { columnState: getColumnState(), filterModel: null, periodo: "mes_actual" },
        false,
      );
      // La vista nueva queda abierta con su periodo aplicado.
      expect(onAplicarRango).toHaveBeenCalled();
      expect(onConfigsChange).toHaveBeenCalled();
      expect(toastSuccessMock).toHaveBeenCalled();
    });
  });

  it("renombra la vista seleccionada desde el menú ⋮", async () => {
    updateReportConfigMock.mockResolvedValue({ ...configs[0], name: "Nuevo" });

    renderComponente();

    fireEvent.change(screen.getByLabelText("Vista"), {
      target: { value: "cfg-uuid-1" },
    });
    fireEvent.click(screen.getByTitle("Acciones de la vista"));
    fireEvent.click(screen.getByRole("menuitem", { name: /Renombrar vista/i }));
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
    fireEvent.change(screen.getByLabelText("Vista"), {
      target: { value: "cfg-uuid-1" },
    });
    fireEvent.click(screen.getByTitle("Acciones de la vista"));
    fireEvent.click(screen.getByRole("menuitem", { name: /Abrir por defecto/i }));

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

    fireEvent.change(screen.getByLabelText("Vista"), {
      target: { value: "cfg-uuid-1" },
    });
    fireEvent.click(screen.getByTitle("Acciones de la vista"));
    fireEvent.click(screen.getByRole("menuitem", { name: /Eliminar vista/i }));
    // Aparece la confirmación inline
    fireEvent.click(screen.getByRole("button", { name: /Sí, eliminar/i }));

    await waitFor(() => {
      expect(deleteReportConfigMock).toHaveBeenCalledWith("cfg-uuid-1");
      expect(onConfigsChange).toHaveBeenCalled();
    });
  });

  describe("foco por teclado", () => {
    const abrirMenu = () => {
      fireEvent.change(screen.getByLabelText("Vista"), { target: { value: "cfg-uuid-1" } });
      fireEvent.click(screen.getByTitle("Acciones de la vista"));
    };

    it("al abrir el menú el foco entra en la primera acción disponible", () => {
      renderComponente();
      abrirMenu();
      // "Actualizar vista" está deshabilitada (sin cambios): sigue "Guardar como…".
      expect(screen.getByRole("menuitem", { name: /Guardar como vista nueva/ })).toHaveFocus();
    });

    it("Renombrar enfoca el campo y Eliminar enfoca «No», no «Sí, eliminar»", () => {
      renderComponente();
      abrirMenu();
      fireEvent.click(screen.getByRole("menuitem", { name: /Renombrar vista/ }));
      expect(screen.getByLabelText("Nombre de la vista")).toHaveFocus();

      fireEvent.keyDown(screen.getByLabelText("Nombre de la vista"), { key: "Escape" });
      fireEvent.click(screen.getByRole("menuitem", { name: /Eliminar vista/ }));
      expect(screen.getByRole("button", { name: "No" })).toHaveFocus();
    });

    it("Escape en «Nueva vista» cierra y devuelve el foco a ⋮", () => {
      renderComponente();
      abrirMenu();
      fireEvent.click(screen.getByRole("menuitem", { name: /Guardar como vista nueva/ }));
      const nombre = screen.getByPlaceholderText("Nombre de la vista");
      expect(nombre).toHaveFocus();

      fireEvent.keyDown(nombre, { key: "Escape" });
      expect(screen.queryByPlaceholderText("Nombre de la vista")).not.toBeInTheDocument();
      expect(screen.getByTitle("Acciones de la vista")).toHaveFocus();
    });

    it("el menú se recorre con flechas, Inicio y Fin, y Tab lo cierra", () => {
      renderComponente();
      abrirMenu();
      const menu = screen.getByRole("menu", { name: "Acciones de la vista" });
      const nueva = screen.getByRole("menuitem", { name: /Guardar como vista nueva/ });
      fireEvent.keyDown(nueva, { key: "ArrowDown" });
      expect(screen.getByRole("menuitem", { name: /Renombrar vista/ })).toHaveFocus();
      fireEvent.keyDown(menu, { key: "End" });
      expect(screen.getByRole("menuitem", { name: /Eliminar vista/ })).toHaveFocus();
      // Circular: después de la última vuelve a la primera disponible.
      fireEvent.keyDown(menu, { key: "ArrowDown" });
      expect(nueva).toHaveFocus();

      fireEvent.keyDown(nueva, { key: "Tab" });
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("un clic fuera cierra el menú sin tragarse el clic", () => {
      const fuera = vi.fn();
      render(
        <>
          {componente()}
          <button type="button" onClick={fuera}>
            Fuera
          </button>
        </>,
      );
      abrirMenu();
      const boton = screen.getByRole("button", { name: "Fuera" });
      fireEvent.pointerDown(boton);
      fireEvent.click(boton);
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(fuera).toHaveBeenCalled();
    });
  });

  it("tras actualizar, el menú ⋮ ofrece deshacer aunque el toast ya se haya ido", async () => {
    updateReportConfigMock.mockResolvedValue(configs[1]);
    renderComponente(configs, vistaGrid({ a: { filterType: "text", filter: "BBVA" } }));
    fireEvent.click(screen.getByRole("button", { name: /^Actualizar vista/ }));
    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalled());

    fireEvent.click(screen.getByTitle("Acciones de la vista"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Deshacer la última actualización" }));

    await waitFor(() =>
      expect(updateReportConfigMock).toHaveBeenLastCalledWith("cfg-uuid-2", {
        columnState: configs[1].columnState,
        filterModel: null,
        periodo: null,
      }),
    );
    fireEvent.click(screen.getByTitle("Acciones de la vista"));
    expect(screen.queryByRole("menuitem", { name: "Deshacer la última actualización" })).not.toBeInTheDocument();
  });

  it("deshabilita las acciones que requieren vista cuando no hay ninguna seleccionada", () => {
    renderComponente([]);

    // El menú ⋮ sigue disponible (permite "Guardar como vista nueva...")
    const kebab = screen.getByTitle("Acciones de la vista");
    expect(kebab).toBeEnabled();
    fireEvent.click(kebab);

    expect(
      screen.getByRole("menuitem", { name: /Actualizar vista/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("menuitem", { name: /Renombrar vista/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("menuitem", { name: /Eliminar vista/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("menuitem", { name: /Guardar como vista nueva/i }),
    ).toBeEnabled();
  });

  describe("salir con cambios sin guardar", () => {
    const conFiltro = vistaGrid({ a: { filterType: "text", filter: "BBVA" } });

    it("sin cambios sale directo, sin preguntar", () => {
      renderComponente(configs, vistaGrid());
      const continuar = vi.fn();
      act(() => salir({ motivo: "reporte", continuar }));
      expect(continuar).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("ir a otro reporte pregunta; Cancelar libera la navegación y se queda", () => {
      renderComponente(configs, conFiltro);
      const continuar = vi.fn();
      const cancelar = vi.fn();
      act(() => salir({ motivo: "reporte", continuar, cancelar }));

      const aviso = screen.getByRole("alertdialog");
      expect(aviso).toHaveTextContent("Tienes cambios sin guardar en «Config B». Si sales del reporte se pierden.");
      // Lo seguro primero.
      expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();

      fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
      expect(cancelar).toHaveBeenCalledTimes(1);
      expect(continuar).not.toHaveBeenCalled();
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("cerrar sesión: Descartar cambios sale y el navegador ya no vuelve a preguntar", () => {
      renderComponente(configs, conFiltro);
      const continuar = vi.fn();
      act(() => salir({ motivo: "sesion", continuar }));
      expect(screen.getByRole("alertdialog")).toHaveTextContent("Si cierras sesión se pierden.");

      fireEvent.click(screen.getByRole("button", { name: "Descartar cambios" }));
      expect(continuar).toHaveBeenCalledTimes(1);
      // Salir lleva a otra página: el aviso nativo de beforeunload no se repite.
      const evento = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(evento);
      expect(evento.defaultPrevented).toBe(false);
    });

    it("Actualizar y salir guarda la vista y después sale", async () => {
      updateReportConfigMock.mockResolvedValue(configs[1]);
      renderComponente(configs, conFiltro);
      const continuar = vi.fn();
      act(() => salir({ motivo: "reporte", continuar }));

      fireEvent.click(screen.getByRole("button", { name: "Actualizar y salir" }));
      await waitFor(() => expect(continuar).toHaveBeenCalledTimes(1));
      expect(updateReportConfigMock).toHaveBeenCalledWith("cfg-uuid-2", expect.anything());
    });

    it("recargar o cerrar la pestaña con cambios pide confirmación al navegador", () => {
      const { unmount } = renderComponente(configs, conFiltro);
      const evento = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(evento);
      expect(evento.defaultPrevented).toBe(true);

      unmount();
      const despues = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(despues);
      expect(despues.defaultPrevented).toBe(false);
    });
  });

  it("al volver a la pestaña arranca en la vista que estaba elegida, no en la predeterminada", () => {
    const onElegirVista = vi.fn();
    render(
      <ConfiguracionesColumnas
        referenciaGrid={referenciaGrid}
        setColumnasVisibles={setColumnasVisibles}
        reportId="bancos"
        configs={configs}
        onConfigsChange={onConfigsChange}
        vistaActual={vistaGrid()}
        vistaInicial="cfg-uuid-1"
        onElegirVista={onElegirVista}
      />,
    );
    expect(screen.getByLabelText("Vista")).toHaveValue("cfg-uuid-1");

    fireEvent.change(screen.getByLabelText("Vista"), { target: { value: "" } });
    expect(onElegirVista).toHaveBeenLastCalledWith(null);
  });

  it("«Actualizar vista» sin cambios sigue enfocable y dice por qué no guarda", () => {
    renderComponente(configs, vistaGrid());
    const boton = screen.getByRole("button", { name: /^Actualizar vista/ });
    expect(boton).toHaveAttribute("aria-disabled", "true");
    expect(boton).toHaveAccessibleDescription("«Config B» no tiene cambios sin guardar.");
    fireEvent.click(boton);
    expect(updateReportConfigMock).not.toHaveBeenCalled();
  });

  it("si la sesión expiró, el error de guardar dice por qué en vez de «inténtalo de nuevo»", async () => {
    const { ApiError } = await import("../../../../shared/api/http");
    updateReportConfigMock.mockRejectedValue(new ApiError(401, "Unauthorized"));
    renderComponente(configs, vistaGrid({ a: { filterType: "text", filter: "BBVA" } }));

    fireEvent.click(screen.getByRole("button", { name: /^Actualizar vista/ }));
    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith(
        "No se pudo actualizar la vista: tu sesión expiró. Lo que ves en la tabla sigue aquí; para guardar, vuelve a abrir el reporte desde FileMaker.",
      ),
    );
  });

  it("«Nueva vista» es un diálogo con nombre, Cancelar y el foco adentro", () => {
    renderComponente(configs.map((c) => ({ ...c, isDefault: false })), vistaGrid());
    fireEvent.click(screen.getByRole("button", { name: /^Guardar vista/ }));

    const dialogo = screen.getByRole("dialog", { name: "Nueva vista" });
    expect(screen.getByLabelText("Nombre de la vista")).toHaveFocus();

    // Shift+Tab desde el primer campo da la vuelta al último botón, sin salir.
    fireEvent.keyDown(screen.getByLabelText("Nombre de la vista"), { key: "Tab", shiftKey: true });
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(dialogo).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Acciones de la vista" })).toHaveFocus();
  });
});
