import { fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.getByRole("link", { name: /Ventas/ })).toHaveFocus();
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
