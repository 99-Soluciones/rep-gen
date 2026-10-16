import { MoreVertical, Pencil, Plus, Save, Star, Trash2, Undo2 } from "lucide-react";
import type { Dispatch, KeyboardEvent } from "react";
import type { ReportConfigResponse } from "../api/report-configs.api";
import type { MenuColumnasAction, MenuColumnasState } from "./ConfiguracionesColumnas.reducer";

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
}

// Al abrir el menú (o volver a la lista desde Renombrar/Eliminar) el foco entra
// en la primera acción disponible, como en cualquier menú de escritorio.
const enfocarPrimeraAccion = (lista: HTMLDivElement | null) => {
  lista?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
};

// Teclado de menú: flechas (circulares), Inicio y Fin entre las acciones
// disponibles. Tab no recorre el menú: lo cierra y sigue de largo.
const navegarMenu = (evento: KeyboardEvent<HTMLDivElement>, cerrar: () => void) => {
  if (evento.key === "Tab") {
    cerrar();
    return;
  }
  const acciones = [
    ...evento.currentTarget.querySelectorAll<HTMLButtonElement>("[role=menuitem]:not(:disabled)"),
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
        className="flex items-center justify-center px-2 text-gray-600 rounded-r-lg hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
          className="absolute right-0 top-full mt-2 z-50 w-64 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
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
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
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
              <p className="text-xs text-gray-500">
                Cambia el nombre de la vista seleccionada.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onRenombrar}
                  disabled={!estado.nombreInput.trim() || guardando}
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
              <p className="text-sm text-gray-700">
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
              <button
                type="button"
                role="menuitem"
                onClick={onGuardarCambios}
                disabled={!configActual || !modificada || guardando}
                className="w-full flex items-start gap-2.5 px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:bg-blue-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
                <span>
                  Actualizar vista
                  {configActual ? ` "${configActual.name}"` : ""}
                </span>
              </button>
              {onDeshacer && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={onDeshacer}
                  disabled={guardando}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:bg-blue-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 disabled:opacity-40 transition-colors"
                >
                  <Undo2 className="w-4 h-4 text-gray-500 shrink-0" />
                  Deshacer la última actualización
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => dispatch({ type: "ABRIR_POPOVER_GUARDAR" })}
                disabled={guardando}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:bg-blue-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 disabled:opacity-40 transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-500 shrink-0" />
                Guardar como vista nueva…
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={iniciarRenombrar}
                disabled={!configActual || guardando}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:bg-blue-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Pencil className="w-4 h-4 text-gray-500 shrink-0" />
                Renombrar vista…
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={onPredeterminar}
                disabled={!configActual || configActual.isDefault || guardando}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:bg-blue-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Star className="w-4 h-4 text-gray-500 shrink-0" />
                {configActual?.isDefault
                  ? "Ya se abre por defecto"
                  : "Abrir por defecto"}
              </button>
              <div role="separator" className="border-t border-gray-100 my-1" />
              <button
                type="button"
                role="menuitem"
                onClick={() => dispatch({ type: "CONFIRMAR_ELIMINAR" })}
                disabled={!configActual || guardando}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 focus:outline-none focus-visible:bg-red-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                Eliminar vista
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MenuAccionesConfig;
