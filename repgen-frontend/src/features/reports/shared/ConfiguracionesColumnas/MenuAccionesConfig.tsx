import { MoreVertical, Pencil, Plus, Save, Star, Trash2, Undo2, type LucideIcon } from "lucide-react";
import type { Dispatch, KeyboardEvent, ReactNode } from "react";
import type { ReportConfigResponse } from "../api/report-configs.api";
import type { MenuColumnasAction, MenuColumnasState } from "./ConfiguracionesColumnas.reducer";
import { MAX_NOMBRE_VISTA } from "./vista";

interface MenuAccionesConfigProps {
  configActual: ReportConfigResponse | null;
  guardando: boolean;
  estado: MenuColumnasState;
  dispatch: Dispatch<MenuColumnasAction>;
  onGuardarCambios: () => void;
  /** Hay cambios sin guardar en la vista seleccionada. */
  modificada: boolean;
  onRenombrar: () => void;
  onPredeterminar: () => void;
  onEliminar: () => void;
  /** Presente mientras se puede deshacer la última "Actualizar vista". */
  onDeshacer?: () => void;
  /** Por qué el nombre escrito no sirve (repetido); null si sirve. */
  errorNombre?: string | null;
}

// Al abrir el menú (o volver a la lista desde Renombrar/Eliminar) el foco entra
// en la primera acción disponible, como en cualquier menú de escritorio.
const enfocarPrimeraAccion = (lista: HTMLDivElement | null) => {
  lista?.querySelector<HTMLButtonElement>("[role=menuitem]:not([aria-disabled])")?.focus();
};

const SIN_VISTA = "Primero elige una vista.";

/**
 * Acción del menú. No disponible, sigue enfocable (`aria-disabled`, como en
 * el patrón de menú de ARIA) y dice por qué en una segunda línea: así el
 * motivo llega por teclado, toque y lector de pantalla, no solo al mouse.
 */
const AccionMenu = ({
  icono: Icono,
  onClick,
  deshabilitada,
  motivo,
  peligro = false,
  children,
}: {
  icono: LucideIcon;
  onClick: () => void;
  deshabilitada: boolean;
  motivo?: string | null;
  peligro?: boolean;
  children: ReactNode;
}) => (
  <button
    type="button"
    role="menuitem"
    onClick={() => {
      if (!deshabilitada) onClick();
    }}
    aria-disabled={deshabilitada || undefined}
    className={`group w-full flex items-start gap-2.5 px-3 py-2 text-sm text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 aria-disabled:cursor-not-allowed aria-disabled:text-gray-500 aria-disabled:hover:bg-transparent aria-disabled:focus-visible:bg-gray-50 ${
      peligro ? "text-red-600 hover:bg-red-50 focus-visible:bg-red-50" : "text-gray-700 hover:bg-gray-50 focus-visible:bg-blue-50"
    }`}
  >
    <Icono
      aria-hidden="true"
      className={`w-4 h-4 mt-0.5 shrink-0 group-aria-disabled:text-gray-300 ${peligro ? "" : "text-gray-500"}`}
    />
    <span className="min-w-0 break-words">
      {children}
      {deshabilitada && motivo && <span className="block text-xs text-gray-500">{motivo}</span>}
    </span>
  </button>
);

// Teclado de menú: flechas (circulares), Inicio y Fin entre todas las acciones,
// también las no disponibles (dicen por qué). Tab no recorre el menú: lo cierra
// y sigue de largo.
const navegarMenu = (evento: KeyboardEvent<HTMLDivElement>, cerrar: () => void) => {
  if (evento.key === "Tab") {
    cerrar();
    return;
  }
  const acciones = [
    ...evento.currentTarget.querySelectorAll<HTMLButtonElement>("[role=menuitem]"),
  ];
  if (acciones.length === 0) return;
  const actual = acciones.indexOf(document.activeElement as HTMLButtonElement);
  const destino = {
    ArrowDown: acciones[(actual + 1) % acciones.length],
    ArrowUp: acciones[(actual - 1 + acciones.length) % acciones.length],
    Home: acciones[0],
    End: acciones[acciones.length - 1],
  }[evento.key];
  if (!destino) return;
  evento.preventDefault();
  destino.focus();
};

const MenuAccionesConfig = ({
  configActual,
  guardando,
  estado,
  dispatch,
  onGuardarCambios,
  modificada,
  onRenombrar,
  onPredeterminar,
  onEliminar,
  onDeshacer,
  errorNombre = null,
}: MenuAccionesConfigProps) => {
  const iniciarRenombrar = () => {
    if (!configActual) return;
    dispatch({ type: "INICIAR_RENOMBRAR", nombre: configActual.name });
  };

  return (
    <div className="relative flex shrink-0">
      <button
        type="button"
        onClick={() => dispatch({ type: "ABRIR_MENU" })}
        disabled={guardando}
        className="flex items-center justify-center px-2 pointer-coarse:px-3 text-gray-600 rounded-r-lg hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Acciones de la vista"
        aria-label="Acciones de la vista"
        aria-haspopup="menu"
        aria-expanded={estado.menuAbierto}
        aria-controls="menu-acciones-vista"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {estado.menuAbierto && (
        <div
          id="menu-acciones-vista"
          className="absolute right-0 top-full mt-2 z-50 w-64 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
        >
          {estado.modoRenombrar ? (
            <div className="p-3 flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Renombrar vista
              </p>
              <input
                type="text"
                autoFocus
                aria-label="Nombre de la vista"
                maxLength={MAX_NOMBRE_VISTA}
                aria-invalid={errorNombre ? true : undefined}
                aria-describedby={errorNombre ? "error-renombrar-vista" : undefined}
                className={`text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full ${
                  errorNombre ? "border-red-600" : "border-gray-300"
                }`}
                placeholder="Nombre"
                value={estado.nombreInput}
                onChange={(e) =>
                  dispatch({ type: "SET_NOMBRE_INPUT", value: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") onRenombrar();
                  if (e.key === "Escape")
                    dispatch({ type: "CANCELAR_RENOMBRAR" });
                }}
              />
              {errorNombre ? (
                <p id="error-renombrar-vista" role="alert" className="text-xs text-red-600">
                  {errorNombre}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Cambia el nombre de la vista seleccionada.
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onRenombrar}
                  disabled={!estado.nombreInput.trim() || guardando || !!errorNombre}
                  className="flex-1 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-marca-morado disabled:opacity-40 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                >
                  {guardando ? "Guardando…" : "Renombrar"}
                </button>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "CANCELAR_RENOMBRAR" })}
                  className="text-sm px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : estado.confirmandoEliminar ? (
            <div className="p-3 flex flex-col gap-2">
              <p className="text-sm text-gray-700 break-words">
                ¿Eliminar la vista{" "}
                <span className="font-semibold">{configActual?.name}</span>?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onEliminar}
                  disabled={guardando}
                  className="flex-1 text-sm px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                >
                  {guardando ? "Eliminando…" : "Sí, eliminar"}
                </button>
                <button
                  type="button"
                  // Lo seguro primero: Enter por accidente no borra la vista.
                  autoFocus
                  onClick={() => dispatch({ type: "CANCELAR_ELIMINAR" })}
                  className="text-sm px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                >
                  No
                </button>
              </div>
            </div>
          ) : (
            <div
              role="menu"
              aria-label="Acciones de la vista"
              className="py-1"
              ref={enfocarPrimeraAccion}
              onKeyDown={(e) => navegarMenu(e, () => dispatch({ type: "CERRAR_TODO" }))}
            >
              <AccionMenu
                icono={Save}
                onClick={onGuardarCambios}
                deshabilitada={!configActual || !modificada || guardando}
                motivo={!configActual ? SIN_VISTA : !modificada ? "No tiene cambios sin guardar." : null}
              >
                Actualizar vista
                {configActual ? ` "${configActual.name}"` : ""}
              </AccionMenu>
              {onDeshacer && (
                <AccionMenu icono={Undo2} onClick={onDeshacer} deshabilitada={guardando}>
                  Deshacer la última actualización
                </AccionMenu>
              )}
              <AccionMenu
                icono={Plus}
                onClick={() => dispatch({ type: "ABRIR_POPOVER_GUARDAR" })}
                deshabilitada={guardando}
              >
                Guardar como vista nueva…
              </AccionMenu>
              <AccionMenu
                icono={Pencil}
                onClick={iniciarRenombrar}
                deshabilitada={!configActual || guardando}
                motivo={!configActual ? SIN_VISTA : null}
              >
                Renombrar vista…
              </AccionMenu>
              <AccionMenu
                icono={Star}
                onClick={onPredeterminar}
                deshabilitada={!configActual || !!configActual.isDefault || guardando}
                // "Ya se abre por defecto" ya dice por qué no está disponible.
                motivo={!configActual ? SIN_VISTA : null}
              >
                {configActual?.isDefault
                  ? "Ya se abre por defecto"
                  : "Abrir por defecto"}
              </AccionMenu>
              <div role="separator" className="border-t border-gray-100 my-1" />
              <AccionMenu
                icono={Trash2}
                onClick={() => dispatch({ type: "CONFIRMAR_ELIMINAR" })}
                deshabilitada={!configActual || guardando}
                motivo={!configActual ? SIN_VISTA : null}
                peligro
              >
                Eliminar vista
              </AccionMenu>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MenuAccionesConfig;
