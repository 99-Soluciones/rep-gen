import { fireEvent, render, screen } from "@testing-library/react";
import PanelKpiLateral from "./PanelKpiLateral";

const renderPanel = (lado: "izquierda" | "derecha") =>
  render(
    <PanelKpiLateral
      titulo="Panel"
      abierto
      onToggle={() => {}}
      storageKey={`test-panel-${lado}`}
      lado={lado}
    >
      <p>KPIs</p>
    </PanelKpiLateral>,
  );

const ancho = () => Number(screen.getByRole("separator").getAttribute("aria-valuenow"));

describe("PanelKpiLateral: redimensionar con teclado", () => {
  it("en el panel derecho, la flecha izquierda (hacia el centro) lo ensancha", () => {
    renderPanel("derecha");
    const inicial = ancho();

    fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowLeft" });
    expect(ancho()).toBeGreaterThan(inicial);

    fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowRight" });
    expect(ancho()).toBe(inicial);
  });

  it("en el panel izquierdo, la flecha derecha lo ensancha", () => {
    renderPanel("izquierda");
    const inicial = ancho();

    fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowRight" });
    expect(ancho()).toBeGreaterThan(inicial);
  });
});

describe("PanelKpiLateral: arrastre interrumpido", () => {
  it("solo lo mueve el puntero que empezó, y perder el foco de la ventana lo suelta", () => {
    renderPanel("derecha");
    const inicial = ancho();
    fireEvent.pointerDown(screen.getByRole("separator"), { button: 0, pointerId: 1, clientX: 500 });

    // Un segundo dedo no hace saltar el panel.
    fireEvent.pointerMove(window, { pointerId: 2, clientX: 300 });
    expect(ancho()).toBe(inicial);

    fireEvent.pointerMove(window, { pointerId: 1, clientX: 460 });
    expect(ancho()).toBe(inicial + 40);

    // Alt+Tab a medio arrastre: el pointerup no llega, el arrastre se suelta igual.
    fireEvent.blur(window);
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 400 });
    expect(ancho()).toBe(inicial + 40);

    // Y el siguiente arrastre funciona sin recargar.
    fireEvent.pointerDown(screen.getByRole("separator"), { button: 0, pointerId: 3, clientX: 500 });
    fireEvent.pointerMove(window, { pointerId: 3, clientX: 480 });
    expect(ancho()).toBe(inicial + 60);
  });
});

it("al recargar deja las cifras legibles y dice que son las de la carga anterior", () => {
  render(
    <PanelKpiLateral titulo="Panel" abierto onToggle={() => {}} estado="cargando">
      <p>$1,000.00</p>
    </PanelKpiLateral>,
  );
  expect(screen.getByRole("status")).toHaveTextContent("Actualizando… estas son las cifras de la carga anterior.");
  expect(screen.getByText("$1,000.00").parentElement).not.toHaveClass("opacity-50");
});
