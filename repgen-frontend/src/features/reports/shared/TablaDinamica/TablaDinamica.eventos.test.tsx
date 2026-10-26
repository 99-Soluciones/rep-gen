import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { vi } from "vitest";
import type { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import TablaDinamica from "./TablaDinamica";
import { construirColumnasVentas } from "../../sales/columnas";

const toastMock = vi.hoisted(() => ({ success: vi.fn(), dismiss: vi.fn() }));
vi.mock("react-hot-toast", () => ({ default: toastMock }));

// AG Grid real: los cambios que guarda una vista (visibilidad, orden, filtros)
// deben avisar por onCambioVista, que alimenta "cambios sin guardar".
// Grid real: con toda la suite en paralelo tarda más en arrancar y asentarse.
vi.setConfig({ testTimeout: 15000 });
const ESPERA = { timeout: 5000 };

describe("TablaDinamica: aviso de cambios de vista (AG Grid real)", () => {
  const montar = async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const referenciaGrid = createRef<AgGridReact>();
    const onGridListo = vi.fn();
    const onCambioVista = vi.fn();
    render(
      <TablaDinamica
        referenciaGrid={referenciaGrid}
        datos={[{ ventaId: "V1", cliente: "ACME" }]}
        definicionesColumnas={construirColumnasVentas("factura") as ColDef[]}
        estaCargando={false}
        onGridListo={onGridListo}
        onCambioVista={onCambioVista}
        filasVisibles={1}
      />,
    );
    await waitFor(() => expect(onGridListo).toHaveBeenCalled(), ESPERA);
    return { api: referenciaGrid.current!.api, onCambioVista };
  };

  it("avisa al ocultar o mostrar una columna", async () => {
    const { api, onCambioVista } = await montar();
    onCambioVista.mockClear();
    api.setColumnsVisible(["cliente"], false);
    await waitFor(() => expect(onCambioVista).toHaveBeenCalled(), ESPERA);
  });

  it("avisa al aplicar un estado de columnas (como el modal o una vista)", async () => {
    const { api, onCambioVista } = await montar();
    onCambioVista.mockClear();
    api.applyColumnState({ state: [{ colId: "cliente", hide: true }] });
    await waitFor(() => expect(onCambioVista).toHaveBeenCalled(), ESPERA);
  });

  it("Ventas abre con Factura Folio fijo a la izquierda, y '— Ninguna —' lo devuelve ahí", async () => {
    const { api } = await montar();
    expect(api.getColumn("facturaFolio")?.getPinned()).toBe("left");
    // Sin aviso de módulo faltante: fijar columnas no necesita otro módulo.
    expect(console.warn).not.toHaveBeenCalledWith(expect.stringMatching(/module/i));

    api.applyColumnState({ state: [{ colId: "facturaFolio", pinned: null }] });
    expect(api.getColumn("facturaFolio")?.getPinned()).toBeFalsy();
    api.resetColumnState();
    expect(api.getColumn("facturaFolio")?.getPinned()).toBe("left");
  });

  it("Limpiar quita los filtros y el aviso permite recuperarlos", async () => {
    const { api } = await montar();
    const filtros = { cliente: { filterType: "text", type: "contains", filter: "AC" } };
    api.setFilterModel(filtros);
    // AG Grid crea los filtros en diferido.
    await waitFor(() => expect(api.getFilterModel()).toEqual(filtros), ESPERA);
    fireEvent.click(await screen.findByRole("button", { name: "Limpiar" }, ESPERA));
    await waitFor(() => expect(api.getFilterModel()).toEqual({}), ESPERA);

    const contenido = toastMock.success.mock.calls.at(-1)![0] as (t: { id: string }) => React.ReactElement;
    render(contenido({ id: "t1" }));
    expect(screen.getByText("Se quitó 1 filtro.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Deshacer" }));
    await waitFor(() => expect(api.getFilterModel()).toEqual(filtros), ESPERA);
  }, 15000);

  it("tras Limpiar, el contador ofrece «Restaurar filtros» aunque el aviso ya se haya ido", async () => {
    const { api } = await montar();
    const filtros = { cliente: { filterType: "text", type: "contains", filter: "AC" } };
    api.setFilterModel(filtros);
    await waitFor(() => expect(api.getFilterModel()).toEqual(filtros), ESPERA);
    fireEvent.click(await screen.findByRole("button", { name: "Limpiar" }, ESPERA));

    fireEvent.click(await screen.findByRole("button", { name: "Restaurar filtros" }, ESPERA));
    await waitFor(() => expect(api.getFilterModel()).toEqual(filtros), ESPERA);
    // Con los filtros de vuelta ya no hay nada que restaurar.
    await waitFor(
      () => expect(screen.queryByRole("button", { name: "Restaurar filtros" })).not.toBeInTheDocument(),
      ESPERA,
    );
  }, 15000);

  it("avisa al filtrar", async () => {
    const { api, onCambioVista } = await montar();
    onCambioVista.mockClear();
    api.setFilterModel({ ventaId: { filterType: "text", type: "contains", filter: "V" } });
    await waitFor(() => expect(onCambioVista).toHaveBeenCalled(), ESPERA);
  });

  it("un rango sin registros ofrece la acción del reporte (el periodo anterior)", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const onClick = vi.fn();
    render(
      <TablaDinamica
        referenciaGrid={createRef<AgGridReact>()}
        datos={[]}
        definicionesColumnas={construirColumnasVentas("factura") as ColDef[]}
        estaCargando={false}
        onGridListo={vi.fn()}
        accionSinRegistros={{ etiqueta: "Ver periodo anterior", onClick }}
        filasVisibles={0}
      />,
    );
    expect(await screen.findByText("No hay registros en este rango de fechas.", {}, ESPERA)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver periodo anterior" }));
    expect(onClick).toHaveBeenCalled();
  });
});
