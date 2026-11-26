import { describe, expect, it } from "vitest";
import { construirColumnasCxp, construirColumnasCxpProveedores } from "./columnas";
import proveedores from "../../../../../repgen-backend/src/reports/infrastructure/payables/__golden__/esperado-proveedor.json";
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

  it("la vista por proveedor tiene una columna por cada llave de su contrato", () => {
    const campos = construirColumnasCxpProveedores().map((c) => c.field);
    expect([...campos].sort()).toEqual(Object.keys(proveedores[0]).sort());
  });
});
