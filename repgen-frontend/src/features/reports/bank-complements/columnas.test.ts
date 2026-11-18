import { columnasBancosComplementos } from "./columnas";

describe("columnas de Bancos con complementos", () => {
  it("la primera pantalla: movimiento, a quién se aplicó y el complemento", () => {
    expect(columnasBancosComplementos.slice(0, 9).map((c) => c.field)).toEqual([
      "bancoFecha",
      "bancoNombre",
      "bancoConcepto",
      "bancoAbono",
      "bancoCargo",
      "bancoMoneda",
      "tipoTransaccion",
      "clienteProveedor",
      "pagoGranTotalMxn",
    ]);
  });

  it("trae una columna por cada campo del contrato", () => {
    expect(columnasBancosComplementos).toHaveLength(38);
  });
});
