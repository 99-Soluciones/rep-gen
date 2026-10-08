import { render, screen } from "@testing-library/react";
import EncabezadoReporte from "./EncabezadoReporte";
import { NavbarSlotContext } from "../../../app/layout/navbarSlotContext";

describe("EncabezadoReporte", () => {
  const props = { titulo: "Reporte de Ventas" };

  it("renderiza el título", () => {
    render(<EncabezadoReporte {...props} />);

    expect(screen.getByText("Reporte de Ventas")).toBeInTheDocument();
  });

  it("se monta en el slot del navbar cuando el contexto lo provee", () => {
    const slot = document.createElement("div");
    document.body.appendChild(slot);

    try {
      render(
        <NavbarSlotContext.Provider value={slot}>
          <EncabezadoReporte {...props} />
        </NavbarSlotContext.Provider>,
      );

      const titulo = screen.getByText("Reporte de Ventas");
      expect(slot).toContainElement(titulo);
    } finally {
      slot.remove();
    }
  });

  it("muestra encabezado extra cuando se envia", () => {
    render(
      <EncabezadoReporte
        {...props}
        encabezadoExtra={<span data-testid="encabezado-extra">Extra</span>}
      />,
    );

    expect(screen.getByTestId("encabezado-extra")).toBeInTheDocument();
  });
});
