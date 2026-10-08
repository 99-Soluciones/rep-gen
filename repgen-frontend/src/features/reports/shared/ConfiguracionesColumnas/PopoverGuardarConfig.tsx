import type { Dispatch } from "react";
import type { MenuColumnasAction, MenuColumnasState } from "./ConfiguracionesColumnas.reducer";

interface PopoverGuardarConfigProps {
  guardando: boolean;
  estado: MenuColumnasState;
  dispatch: Dispatch<MenuColumnasAction>;
  onGuardarComo: () => void;
}

/**
 * Panel para crear una vista nueva. No tiene botón disparador propio: se abre
 * desde el botón "Guardar" del grupo (cuando no hay vista seleccionada) o
 * desde la opción "Guardar como vista nueva..." del menú ⋮, y se ancla al
 * contenedor `relative` del grupo en ConfiguracionesColumnas.
 */
const PopoverGuardarConfig = ({
  guardando,
  estado,
  dispatch,
  onGuardarComo,
}: PopoverGuardarConfigProps) => {
  if (!estado.popoverGuardarAbierto) return null;

  return (
    <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-white border border-gray-200 rounded-lg shadow-xl p-3 flex flex-col gap-2 animate-in fade-in zoom-in duration-150">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Nueva vista
      </p>
      <input
        type="text"
        aria-label="Nombre de la vista"
        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-blue-500 focus:border-blue-500 w-full"
        placeholder="Nombre de la vista"
        value={estado.nombreInput}
        onChange={(e) =>
          dispatch({ type: "SET_NOMBRE_INPUT", value: e.target.value })
        }
        onKeyDown={(e) => {
          if (e.key === "Enter") onGuardarComo();
          if (e.key === "Escape") dispatch({ type: "CERRAR_POPOVER_GUARDAR" });
        }}
      />
      <p className="text-xs text-gray-400">
        Guarda las columnas actuales como una vista nueva.
      </p>
      <button
        type="button"
        onClick={onGuardarComo}
        disabled={!estado.nombreInput.trim() || guardando}
        aria-label="Guardar vista nueva"
        className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-marca-morado disabled:opacity-40 font-medium"
      >
        {guardando ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );
};

export default PopoverGuardarConfig;
