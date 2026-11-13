import { describe, expect, it } from "vitest";
import { agruparPorSeccion, construirColumnasCxc } from "./columnas";
import ejemplo from "../../../../../repgen-backend/docs/reports/fichas/receivables/api_response.json";

describe("columnas de Cuentas por cobrar", () => {
  it("hay una columna por cada llave del contrato", () => {
    const campos = construirColumnasCxc().map((c) => c.field);
    // El orden de pantalla (por secciones) no es el de la respuesta.
    expect([...campos].sort()).toEqual(Object.keys(ejemplo.data[0]).sort());
  });

  it("las clasificaciones usan el nombre del tenant", () => {
    const columnas = construirColumnasCxc((slot) =>
      slot === "cliente.clasificacion1" ? "Canal" : undefined,
    );
    expect(columnas.find((c) => c.field === "clasificacion1")?.headerName).toBe("Canal");
  });

  it("agrupa en secciones consecutivas, en el orden de la ficha", () => {
    const grupos = agruparPorSeccion(construirColumnasCxc());
    expect(grupos.map((g) => [g.headerName, g.children.length])).toEqual([
      ["Corte", 2],
      ["Clientes", 11],
      ["Facturas", 11],
      ["Factura saldo", 3],
      ["Factura no cobrar", 4],
      ["Banco", 11],
    ]);
  });
});
