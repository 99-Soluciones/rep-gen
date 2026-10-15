import { useState, type Dispatch } from "react";
import type { PeriodoVista } from "@repgen/shared-types";
import { PERIODOS } from "./vista";
import type { MenuColumnasAction, MenuColumnasState } from "./ConfiguracionesColumnas.reducer";

interface PopoverGuardarConfigProps {
  guardando: boolean;
  estado: MenuColumnasState;
  dispatch: Dispatch<MenuColumnasAction>;
  onGuardarComo: (periodo: PeriodoVista | null) => void;
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
  // Se desmonta al cerrarse, así cada vista nueva empieza "Sin periodo".
  const [periodo, setPeriodo] = useState<PeriodoVista | "">("");
  if (!estado.popoverGuardarAbierto) return null;

  const guardar = () => onGuardarComo(periodo || null);

  return (
    <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-white border border-gray-200 rounded-lg shadow-xl p-3 flex flex-col gap-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Nueva vista
      </p>
      <input
        type="text"
        autoFocus
        aria-label="Nombre de la vista"
        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
        placeholder="Nombre de la vista"
        value={estado.nombreInput}
        onChange={(e) =>
          dispatch({ type: "SET_NOMBRE_INPUT", value: e.target.value })
        }
        onKeyDown={(e) => {
          // Escape lo maneja ConfiguracionesColumnas: cierra y devuelve el foco a ⋮.
          if (e.key === "Enter") guardar();
        }}
      />
      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
        Periodo
        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value as PeriodoVista | "")}
          className="text-sm font-normal text-gray-700 border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <option value="">Sin periodo (no cambia las fechas)</option>
          {PERIODOS.map(({ valor, etiqueta }) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-gray-500">
        Guarda las columnas y los filtros actuales. Con un periodo, al abrir la
        vista se cargan esas fechas.
      </p>
      <button
        type="button"
        onClick={guardar}
        disabled={!estado.nombreInput.trim() || guardando}
        aria-label="Guardar vista nueva"
        className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-marca-morado disabled:opacity-40 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
      >
        {guardando ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );
};

export default PopoverGuardarConfig;
