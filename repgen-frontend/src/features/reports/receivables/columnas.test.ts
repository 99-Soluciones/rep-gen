import { describe, expect, it } from "vitest";
import { construirColumnasCxc, construirColumnasCxcClientes } from "./columnas";
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

  it("vista por cliente: datos del cliente y sus saldos, sin columnas de factura", () => {
    const columnas = construirColumnasCxcClientes((slot) =>
      slot === "cliente.clasificacion1" ? "Canal" : undefined,
    );
    expect(columnas.find((c) => c.field === "clasificacion1")?.headerName).toBe("Canal");
    expect(columnas.map((c) => c.field as string)).not.toContain("facturaSerieFolio");
  });
});
