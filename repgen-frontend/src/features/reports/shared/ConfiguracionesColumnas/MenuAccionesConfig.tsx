import { MoreVertical, Pencil, Plus, Save, Star, Trash2 } from "lucide-react";
import type { Dispatch } from "react";
import type { ReportConfigResponse } from "../api/report-configs.api";
import type { MenuColumnasAction, MenuColumnasState } from "./ConfiguracionesColumnas.reducer";

interface MenuAccionesConfigProps {
  configActual: ReportConfigResponse | null;
  guardando: boolean;
  estado: MenuColumnasState;
  dispatch: Dispatch<MenuColumnasAction>;
  onGuardarCambios: () => void;
  onRenombrar: () => void;
  onPredeterminar: () => void;
  onEliminar: () => void;
}

const MenuAccionesConfig = ({
  configActual,
  guardando,
  estado,
  dispatch,
  onGuardarCambios,
  onRenombrar,
  onPredeterminar,
  onEliminar,
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
        className="flex items-center justify-center px-2 text-gray-600 rounded-r-lg hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Acciones de la vista"
        aria-label="Acciones de la vista"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {estado.menuAbierto && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
          {estado.modoRenombrar ? (
            <div className="p-3 flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Renombrar vista
              </p>
              <input
                type="text"
                aria-label="Nombre de la vista"
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-blue-500 focus:border-blue-500 w-full"
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
              <p className="text-xs text-gray-400">
                Cambia el nombre de la vista seleccionada.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onRenombrar}
                  disabled={!estado.nombreInput.trim() || guardando}
                  className="flex-1 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-marca-morado disabled:opacity-40 font-medium"
                >
                  {guardando ? "Guardando..." : "Renombrar"}
                </button>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "CANCELAR_RENOMBRAR" })}
                  className="text-sm px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
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
                  className="flex-1 text-sm px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                >
                  {guardando ? "Eliminando..." : "Sí, eliminar"}
                </button>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "CANCELAR_ELIMINAR" })}
                  className="text-sm px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  No
                </button>
              </div>
            </div>
          ) : (
            <div className="py-1">
              <button
                type="button"
                onClick={onGuardarCambios}
                disabled={!configActual || guardando}
                className="w-full flex items-start gap-2.5 px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
                <span>
                  Guardar cambios
                  {configActual ? ` en "${configActual.name}"` : ""}
                </span>
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "ABRIR_POPOVER_GUARDAR" })}
                disabled={guardando}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-500 shrink-0" />
                Guardar como vista nueva...
              </button>
              <button
                type="button"
                onClick={iniciarRenombrar}
                disabled={!configActual || guardando}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Pencil className="w-4 h-4 text-gray-500 shrink-0" />
                Renombrar vista...
              </button>
              <button
                type="button"
                onClick={onPredeterminar}
                disabled={!configActual || configActual.isDefault || guardando}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Star className="w-4 h-4 text-amber-500 shrink-0" />
                {configActual?.isDefault
                  ? "Ya es predeterminada"
                  : "Predeterminar"}
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                type="button"
                onClick={() => dispatch({ type: "CONFIRMAR_ELIMINAR" })}
                disabled={!configActual || guardando}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
