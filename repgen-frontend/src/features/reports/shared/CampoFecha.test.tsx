import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { interpretarFecha } from "../../../shared/utils/fechas";
import CampoFecha from "./CampoFecha";

describe("interpretarFecha", () => {
  it("lee el día primero y devuelve ISO", () => {
    expect(interpretarFecha("01/09/2026")).toBe("2026-09-01");
    expect(interpretarFecha(" 1-9-2026 ")).toBe("2026-09-01");
    expect(interpretarFecha("29/02/2028")).toBe("2028-02-29");
  });

  it("devuelve vacío si la fecha no está completa o no existe", () => {
    for (const texto of ["", "01/09", "01/09/26", "31/02/2026", "29/02/2026", "13/13/2026", "2026-09-01"]) {
      expect(interpretarFecha(texto)).toBe("");
    }
  });
});

describe("CampoFecha", () => {
  it("muestra dd/mm/aaaa y avisa en ISO solo con una fecha completa", () => {
    const onChange = vi.fn();
    render(<CampoFecha aria-label="Fecha" value="2026-10-05" onChange={onChange} />);
    const campo = screen.getByLabelText("Fecha");
    expect(campo).toHaveValue("05/10/2026");

    fireEvent.change(campo, { target: { value: "07/10/20" } });
    expect(onChange).toHaveBeenLastCalledWith("");
    fireEvent.change(campo, { target: { value: "07/10/2026" } });
    expect(onChange).toHaveBeenLastCalledWith("2026-10-07");
  });

  it("lo elegido en el calendario se muestra en dd/mm/aaaa", () => {
    const onChange = vi.fn();
    const { container } = render(<CampoFecha aria-label="Fecha" value="" onChange={onChange} />);
    fireEvent.change(container.querySelector('input[type="date"]')!, { target: { value: "2026-03-09" } });
    expect(onChange).toHaveBeenCalledWith("2026-03-09");
    expect(screen.getByLabelText("Fecha")).toHaveValue("09/03/2026");
  });
});
