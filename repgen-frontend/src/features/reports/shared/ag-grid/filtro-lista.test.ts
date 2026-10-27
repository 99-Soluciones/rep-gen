import {
  envolverTextoLegado,
  modeloDesdeSeleccion,
  pasaLista,
  seleccionDesdeModelo,
  universoValores,
} from "./filtro-lista";
import { filtroDistinto, filtroNoContiene } from "./predicados-filtro";

describe("filtro de lista", () => {
  it("cuenta los valores, los ordena por nombre y deja «(Vacío)» al final", () => {
    expect(universoValores(["Santander", "BBVA", null, "BBVA ", "", "Banorte"])).toEqual([
      { valor: "Banorte", cuenta: 1 },
      { valor: "BBVA", cuenta: 2 },
      { valor: "Santander", cuenta: 1 },
      { valor: "", cuenta: 2 },
    ]);
  });

  it("guarda lo más corto de decir: pocos marcados = incluir; casi todos = excluir; todos = sin filtro", () => {
    const universo = ["Cancelada", "Pagada", "Vencida", "Vigente"];
    expect(modeloDesdeSeleccion(universo, new Set(universo))).toBeNull();
    expect(modeloDesdeSeleccion(universo, new Set(["Pagada"]))).toEqual({
      filterType: "lista",
      modo: "incluir",
      valores: ["Pagada"],
    });
    expect(modeloDesdeSeleccion(universo, new Set(["Pagada", "Vencida", "Vigente"]))).toEqual({
      filterType: "lista",
      modo: "excluir",
      valores: ["Cancelada"],
    });
  });

  it("incluir deja fuera valores nuevos; excluir los deja pasar", () => {
    const incluir = { filterType: "lista" as const, modo: "incluir" as const, valores: ["BBVA"] };
    const excluir = { filterType: "lista" as const, modo: "excluir" as const, valores: ["Cancelada"] };
    expect(pasaLista(incluir, "BBVA")).toBe(true);
    expect(pasaLista(incluir, "HSBC")).toBe(false);
    expect(pasaLista(excluir, "Pagada")).toBe(true);
    expect(pasaLista(excluir, "Cancelada")).toBe(false);
    expect(pasaLista(null, "lo que sea")).toBe(true);
  });

  it("la celda vacía es un valor más", () => {
    const soloVacias = { filterType: "lista" as const, modo: "incluir" as const, valores: [""] };
    expect(pasaLista(soloVacias, null)).toBe(true);
    expect(pasaLista(soloVacias, "BBVA")).toBe(false);
  });

  it("un valor elegido que ya no está en el rango sigue en la selección", () => {
    expect(modeloDesdeSeleccion(["BBVA", "Banorte", "HSBC"], new Set(["BBVA", "Santander"]))).toEqual({
      filterType: "lista",
      modo: "incluir",
      valores: ["BBVA", "Santander"],
    });
  });

  it("un filtro de texto de una vista vieja se respeta y marca lo que coincide", () => {
    const legado = envolverTextoLegado({ filterType: "text", type: "contains", filter: "bbva" });
    expect(pasaLista(legado, "BBVA Bancomer")).toBe(true);
    expect(pasaLista(legado, "Banorte")).toBe(false);
    expect([...seleccionDesdeModelo(legado, ["BBVA", "BBVA Bancomer", "Banorte"])]).toEqual(["BBVA", "BBVA Bancomer"]);
  });
});

describe("excluir en columnas de texto", () => {
  it("«No contiene» y «Distinto de» dejan pasar las celdas vacías, como Excel", () => {
    expect(filtroNoContiene(["bbva"], "Banorte")).toBe(true);
    expect(filtroNoContiene(["bbva"], "BBVA Bancomer")).toBe(false);
    expect(filtroNoContiene(["bbva"], null)).toBe(true);
    expect(filtroDistinto(["cancelada"], "Cancelada")).toBe(false);
    expect(filtroDistinto(["cancelada"], null)).toBe(true);
  });
});
