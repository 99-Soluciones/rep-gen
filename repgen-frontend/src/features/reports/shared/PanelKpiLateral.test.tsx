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
