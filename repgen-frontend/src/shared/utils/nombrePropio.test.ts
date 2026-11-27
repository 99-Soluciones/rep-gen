import { describe, expect, it } from "vitest";
import { nombrePropio } from "./nombrePropio";

describe("nombrePropio", () => {
  it("pone mayúscula inicial a cada palabra y respeta los espacios", () => {
    expect(nombrePropio("sans")).toBe("Sans");
    expect(nombrePropio("  grupo alfa ")).toBe("Grupo Alfa");
    expect(nombrePropio("DEVELOPER")).toBe("Developer");
    expect(nombrePropio("ñandú sa")).toBe("Ñandú Sa");
  });
});
