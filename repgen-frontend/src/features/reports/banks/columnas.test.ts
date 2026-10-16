import { columnasBancos } from "./columnas";

describe("columnas de Bancos", () => {
  it("la primera pantalla lee como una conciliación: el dinero junto al concepto", () => {
    const campos = columnasBancos.map((c) => c.field);
    expect(campos.slice(0, 7)).toEqual([
      "fecha",
      "nombre_banco",
      "numero_cuenta",
      "concepto",
      "abono",
      "cargo",
      "saldoBanco",
    ]);
  });

  it("los datos técnicos empiezan ocultos y el resto visible", () => {
    const ocultas = columnasBancos.filter((c) => c.hide).map((c) => c.field);
    expect(ocultas).toEqual(["idTransaccionBanco", "rfc", "cuentaContable"]);
  });
});
