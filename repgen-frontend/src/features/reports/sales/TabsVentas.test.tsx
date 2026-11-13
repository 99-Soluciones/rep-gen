import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TabsVentas from "./TabsVentas";

describe("TabsVentas (menú móvil)", () => {
  it("abre un menú de links con la pestaña actual marcada, no un listbox", () => {
    render(
      <MemoryRouter initialEntries={["/ventas/facturas"]}>
        <TabsVentas reportType="facturas" />
      </MemoryRouter>,
    );

    const disparador = screen.getByRole("button", { name: "Tipo de reporte: Facturas" });
    expect(disparador).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(disparador);
    expect(disparador).toHaveAttribute("aria-expanded", "true");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    const menu = document.getElementById("menu-tabs-ventas")!;
    const links = Array.from(menu.querySelectorAll("a"));
    expect(links.map((a) => a.textContent)).toEqual(["Facturas", "Conceptos"]);
    expect(links[0]).toHaveAttribute("aria-current", "page");
    expect(links[1]).not.toHaveAttribute("aria-current");

    // Elegir una opción cierra el menú.
    fireEvent.click(links[1]);
    expect(disparador).toHaveAttribute("aria-expanded", "false");
  });

  it("con rutaBase las pestañas navegan dentro de otro reporte", () => {
    render(
      <MemoryRouter initialEntries={["/flujo_efectivo_ingresos/conceptos"]}>
        <TabsVentas reportType="conceptos" rutaBase="/flujo_efectivo_ingresos" />
      </MemoryRouter>,
    );
    const links = screen.getAllByRole("link", { name: "Conceptos" });
    expect(links[0]).toHaveAttribute("href", "/flujo_efectivo_ingresos/conceptos");
    expect(links[0]).toHaveAttribute("aria-current", "page");
  });
});
