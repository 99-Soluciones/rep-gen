import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";

const RESIZE_STEP = 20;

interface PanelKpiLateralProps {
  titulo?: string;
  aviso?: string;
  abierto: boolean;
  onToggle: () => void;
  children: ReactNode;
  storageKey?: string;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  /** Lado donde se ancla el panel respecto a la tabla. */
  lado?: "izquierda" | "derecha";
}

const ICONO_METRICAS = (
  <svg
    className="w-5 h-5 shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const PanelKpiLateral = ({
  titulo = "Dashboard",
  aviso,
  abierto,
  onToggle,
  children,
  storageKey,
  defaultWidth = 320,
  minWidth = 260,
  maxWidth = 520,
  lado = "derecha",
}: PanelKpiLateralProps) => {
  const getInitialWidth = () => {
    if (!storageKey || typeof window === "undefined" || !window.localStorage) {
      return defaultWidth;
    }

    const stored = window.localStorage.getItem(storageKey);
    const parsed = stored ? Number(stored) : Number.NaN;
    if (Number.isNaN(parsed)) {
      return defaultWidth;
    }

    return Math.min(maxWidth, Math.max(minWidth, parsed));
  };

  const [panelWidth, setPanelWidth] = useState(getInitialWidth);
  const [resizing, setResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(panelWidth);

  useEffect(() => {
    if (!storageKey || typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(storageKey, String(panelWidth));
  }, [panelWidth, storageKey]);

  useEffect(() => {
    if (!resizing) return;

    const handleMove = (event: MouseEvent) => {
      // Panel a la izquierda: arrastrar hacia la derecha lo ensancha.
      // Panel a la derecha: arrastrar hacia la izquierda lo ensancha.
      const delta =
        lado === "izquierda"
          ? event.clientX - startXRef.current
          : startXRef.current - event.clientX;
      const nextWidth = Math.min(
        maxWidth,
        Math.max(minWidth, startWidthRef.current + delta),
      );
      setPanelWidth(nextWidth);
    };

    const handleUp = () => {
      setResizing(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [resizing, minWidth, maxWidth, lado]);

  const handleResizeStart = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    startXRef.current = event.clientX;
    startWidthRef.current = panelWidth;
    setResizing(true);
  };

  const handleResizeKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setPanelWidth((prev) => Math.min(maxWidth, prev + RESIZE_STEP));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setPanelWidth((prev) => Math.max(minWidth, prev - RESIZE_STEP));
    }
  };

  const toggleLabel = abierto ? "Ocultar dashboard" : "Mostrar dashboard";

  // Chevron según el lado del panel: al colapsar apunta hacia el borde donde
  // se repliega; al expandir, hacia donde crecerá el panel.
  const CHEVRON_IZQUIERDA = "M15 19l-7-7 7-7";
  const CHEVRON_DERECHA = "M9 5l7 7-7 7";
  const pathColapsar =
    lado === "derecha" ? CHEVRON_DERECHA : CHEVRON_IZQUIERDA;
  const pathExpandir =
    lado === "derecha" ? CHEVRON_IZQUIERDA : CHEVRON_DERECHA;

  // El manejador de resize vive en el borde que colinda con la tabla.
  const handlePosClass =
    lado === "izquierda" ? "right-0 translate-x-1/2" : "left-0 -translate-x-1/2";

  return (
    <aside
      className={`relative w-full transition-all duration-300 xl:overflow-visible xl:sticky xl:top-4 xl:self-start ${
        abierto ? "xl:w-(--kpi-panel-width)" : "xl:w-9"
      }`}
      style={{ "--kpi-panel-width": `${panelWidth}px` } as CSSProperties}
    >
      {abierto ? (
        <>
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Redimensionar panel"
            aria-valuenow={panelWidth}
            aria-valuemin={minWidth}
            aria-valuemax={maxWidth}
            tabIndex={0}
            className={`absolute top-0 hidden h-full w-2 cursor-col-resize xl:block z-30 ${handlePosClass} ${
              resizing ? "bg-blue-100" : "bg-transparent"
            }`}
            onMouseDown={handleResizeStart}
            onKeyDown={handleResizeKeyDown}
          >
            <div className="mx-auto h-full w-0.5 bg-gray-200" />
          </div>

          {/* Botón de colapso circular, centrado verticalmente sobre la línea
              divisoria (desktop) */}
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={abierto}
            aria-label={toggleLabel}
            title={toggleLabel}
            className={`absolute top-1/2 -translate-y-1/2 z-40 hidden xl:inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 shadow-md hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors ${handlePosClass}`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={pathColapsar}
              />
            </svg>
          </button>

          <div className="mt-3 xl:mt-0 transition-all duration-300">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex flex-col gap-3 xl:max-h-[calc(100vh-5rem)] xl:overflow-hidden">
              {/* Botón de colapso a la izquierda del título; solo móvil, en
                  desktop el toggle vive centrado sobre la línea divisoria */}
              <div className="flex items-start gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onToggle}
                  aria-expanded={abierto}
                  aria-label={toggleLabel}
                  title={toggleLabel}
                  className="inline-flex xl:hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-blue-700 shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d={pathColapsar}
                    />
                  </svg>
                </button>
                <div className="flex flex-col gap-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {titulo}
                  </h3>
                  {aviso && (
                    <span className="inline-flex items-center gap-1 self-start px-2 py-0.5 bg-gray-100 border border-gray-300 rounded-full">
                      <svg
                        className="w-3 h-3 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span className="text-xs font-medium text-gray-500">
                        {aviso}
                      </span>
                    </span>
                  )}
                </div>
              </div>
              <div className="xl:overflow-y-auto xl:overflow-x-hidden xl:flex-1 xl:pr-0.5">
                {children}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Desktop: línea divisoria vertical con el botón de expandir
              circular centrado, mismo diseño que el toggle del panel abierto */}
          <div className="relative hidden xl:flex h-[calc(100vh-5rem)] w-full items-center justify-center">
            <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-gray-200" />
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={abierto}
              aria-label={toggleLabel}
              title="Mostrar métricas"
              className="relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 shadow-md hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={pathExpandir}
                />
              </svg>
            </button>
          </div>

          {/* Botón horizontal (móvil): no hay riel lateral en pantallas pequeñas */}
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={abierto}
            aria-label={toggleLabel}
            className="flex xl:hidden w-full items-center justify-center gap-2 py-2 px-3 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-sm hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
          >
            {ICONO_METRICAS}
            <span>Mostrar métricas</span>
          </button>
        </>
      )}
    </aside>
  );
};

export default PanelKpiLateral;
