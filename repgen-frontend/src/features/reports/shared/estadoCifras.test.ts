import { estadoCifras } from "./estadoCifras";

describe("estadoCifras", () => {
  it("distingue la primera carga de una recarga", () => {
    const antes = new Date();
    expect(estadoCifras(null, true, null)).toBe("primeraCarga");
    expect(estadoCifras(null, true, antes)).toBe("cargando");
    expect(estadoCifras(null, false, antes)).toBeNull();
    expect(estadoCifras({ mensaje: "x" }, false, antes)).toBe("error");
  });
});
