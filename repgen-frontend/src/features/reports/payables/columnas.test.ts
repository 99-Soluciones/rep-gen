import { describe, expect, it } from "vitest";
import { agruparPorSeccion } from "../shared/ag-grid/agruparPorSeccion";
import { construirColumnasCxp } from "./columnas";
import ejemplo from "../../../../../repgen-backend/docs/reports/fichas/payables/api_response.json";

describe("columnas de Cuentas por pagar", () => {
  it("hay una columna por cada llave del contrato", () => {
    const campos = construirColumnasCxp().map((c) => c.field);
    expect([...campos].sort()).toEqual(Object.keys(ejemplo.data[0]).sort());
  });

  it("empiezan visibles el tipo, el proveedor, la factura y los saldos", () => {
    const visibles = construirColumnasCxp()
      .filter((c) => !c.hide)
      .map((c) => c.field);
    expect(visibles.slice(0, 4)).toEqual(["fechaCorte", "tipoTransaccion", "proveedor", "compraId"]);
    expect(visibles).toContain("facturaSaldoPendiente");
    expect(visibles).toContain("cargoMontoSinIdentificar");
  });

  it("agrupa en secciones consecutivas, en el orden de la ficha", () => {
    const grupos = agruparPorSeccion(construirColumnasCxp());
    expect(grupos.map((g) => [g.headerName, g.children.length])).toEqual([
      ["Corte", 2],
      ["Proveedores", 6],
      ["Facturas", 13],
      ["Factura saldo", 3],
      ["Factura no pagar", 5],
      ["Banco", 11],
      ["Entrega", 4],
    ]);
  });
});
