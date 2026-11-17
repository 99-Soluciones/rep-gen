import type { RefObject, ToggleEvent } from "react";

/**
 * Props para un panel flotante que React monta solo mientras está abierto.
 * Con `popover="auto"` el navegador lo sube a la capa superior (sin z-index ni
 * recortes del overflow de la tabla), lo cierra con Escape o con un clic fuera
 * y devuelve el foco; `onCerrar` solo sincroniza el estado de React.
 *
 * `ancla` es el disparador (o el grupo que lo contiene): un clic sobre él no
 * cuenta como "fuera" y el panel se coloca bajo él con la clase
 * `popover-anclado` (más `popover-anclado-fin` para alinearlo a la derecha).
 */
export const usePopoverAnclado = (
  ancla: RefObject<HTMLElement | null>,
  onCerrar: () => void,
) => ({
  popover: "auto" as const,
  ref: (panel: HTMLElement | null) => {
    // jsdom no implementa popovers: en pruebas el panel queda en su lugar.
    if (!panel?.showPopover || !ancla.current || panel.matches(":popover-open")) return;
    panel.showPopover({ source: ancla.current } as ShowPopoverOptions);
    if (!CSS.supports("position-area: block-end")) colocarBajo(panel, ancla.current);
  },
  onToggle: (evento: ToggleEvent) => {
    if (evento.newState === "closed") onCerrar();
  },
});

/** Sin anchor positioning: bajo el ancla (o encima si no cabe), dentro de la ventana. */
// ponytail: se mide al abrir; si la página hace scroll con el panel abierto, se queda donde estaba.
const colocarBajo = (panel: HTMLElement, ancla: HTMLElement) => {
  const a = ancla.getBoundingClientRect();
  const p = panel.getBoundingClientRect();
  const izquierda = panel.classList.contains("popover-anclado-fin") ? a.right - p.width : a.left;
  const cabeAbajo = a.bottom + 8 + p.height <= window.innerHeight;
  panel.style.left = `${Math.max(8, Math.min(izquierda, window.innerWidth - p.width - 8))}px`;
  panel.style.top = `${Math.max(8, cabeAbajo ? a.bottom + 8 : a.top - 8 - p.height)}px`;
};
