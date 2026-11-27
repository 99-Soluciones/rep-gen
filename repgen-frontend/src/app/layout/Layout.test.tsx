import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Layout from "./Layout";

const montar = () =>
  render(
    <MemoryRouter initialEntries={["/ventas/facturas"]}>
      <Layout>
        <p>contenido</p>
      </Layout>
    </MemoryRouter>,
  );

describe("Layout: foco del menú de reportes", () => {
  it("al abrir, el foco entra en el reporte actual", () => {
    montar();
    fireEvent.click(screen.getByRole("button", { name: "Menú de reportes" }));
    const menu = screen.getByRole("complementary", { name: "Menú de reportes" });
    expect(within(menu).getByRole("link", { name: /Ventas/ })).toHaveFocus();
  });

  it("Escape cierra y devuelve el foco al botón de hamburguesa", () => {
    montar();
    const hamburguesa = screen.getByRole("button", { name: "Menú de reportes" });
    fireEvent.click(hamburguesa);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(hamburguesa).toHaveAttribute("aria-expanded", "false");
    expect(hamburguesa).toHaveFocus();
  });
});

describe("Layout: riel de reportes", () => {
  it("tiene un link por reporte, marca el actual y queda inerte con el menú abierto", () => {
    montar();
    const riel = screen.getByRole("navigation", { name: "Accesos rápidos a reportes" });
    expect(within(riel).getAllByRole("link")).toHaveLength(8);
    expect(within(riel).getByRole("link", { name: "Ventas" })).toHaveAttribute("aria-current", "page");
    expect(within(riel).getByRole("link", { name: "Inventarios · Próximamente" })).toBeInTheDocument();
    expect(riel).not.toHaveAttribute("inert");
    fireEvent.click(screen.getByRole("button", { name: "Menú de reportes" }));
    expect(riel).toHaveAttribute("inert");
  });
});
