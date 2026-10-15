import { act, render } from "@testing-library/react";
import { vi } from "vitest";
import { Outlet, RouterProvider, createMemoryRouter } from "react-router-dom";
import { GuardiaSalida } from "./router";
import { protegerSalida, type Salida } from "../shared/utils/salidaProtegida";

const montar = () => {
  const router = createMemoryRouter(
    [
      {
        element: (
          <>
            <Outlet />
            <GuardiaSalida />
          </>
        ),
        children: [
          { path: "/bancos", element: <p>Bancos</p> },
          { path: "/ventas/:tipo", element: <p>Ventas</p> },
        ],
      },
    ],
    { initialEntries: ["/ventas/facturas"] },
  );
  render(<RouterProvider router={router} />);
  return router;
};

describe("GuardiaSalida", () => {
  it("con trabajo sin guardar, ir a otro reporte espera la respuesta del guardián", async () => {
    const router = montar();
    const preguntas: Salida[] = [];
    const retirar = protegerSalida((salida) => preguntas.push(salida));

    await act(() => router.navigate("/bancos"));
    expect(router.state.location.pathname).toBe("/ventas/facturas");
    expect(preguntas).toHaveLength(1);
    expect(preguntas[0].motivo).toBe("reporte");

    // "Cancelar": se queda.
    act(() => preguntas[0].cancelar?.());
    expect(router.state.location.pathname).toBe("/ventas/facturas");

    // "Descartar cambios": continúa la misma navegación.
    await act(() => router.navigate("/bancos"));
    act(() => preguntas[1].continuar());
    expect(router.state.location.pathname).toBe("/bancos");
    retirar();
  });

  it("cambiar de pestaña dentro de Ventas no pregunta (cada pestaña recuerda lo suyo)", async () => {
    const router = montar();
    const guardian = vi.fn();
    const retirar = protegerSalida(guardian);

    await act(() => router.navigate("/ventas/conceptos"));
    expect(router.state.location.pathname).toBe("/ventas/conceptos");
    expect(guardian).not.toHaveBeenCalled();
    retirar();
  });

  it("sin trabajo sin guardar, navega sin preguntar", async () => {
    const router = montar();
    await act(() => router.navigate("/bancos"));
    expect(router.state.location.pathname).toBe("/bancos");
  });
});
