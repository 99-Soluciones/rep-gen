import { useState, type Dispatch } from "react";
import type { PeriodoVista } from "@repgen/shared-types";
import { MAX_NOMBRE_VISTA, PERIODOS } from "./vista";
import type { MenuColumnasAction, MenuColumnasState } from "./ConfiguracionesColumnas.reducer";

interface PopoverGuardarConfigProps {
  guardando: boolean;
  estado: MenuColumnasState;
  dispatch: Dispatch<MenuColumnasAction>;
  onGuardarComo: (periodo: PeriodoVista | null) => void;
  /** Cierra sin guardar y devuelve el foco a quien lo abrió. */
  onCancelar: () => void;
  /** Por qué el nombre escrito no sirve (repetido); null si sirve. */
  errorNombre?: string | null;
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
  onCancelar,
  errorNombre = null,
}: PopoverGuardarConfigProps) => {
  // Se desmonta al cerrarse, así cada vista nueva empieza "Sin periodo".
  const [periodo, setPeriodo] = useState<PeriodoVista | "">("");
  if (!estado.popoverGuardarAbierto) return null;

  const guardar = () => onGuardarComo(periodo || null);

  return (
    <div
      role="dialog"
      aria-labelledby="titulo-nueva-vista"
      className="absolute right-0 top-full mt-2 z-50 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-3 flex flex-col gap-2"
      onKeyDown={(e) => {
        // Tab y Shift+Tab se quedan en el diálogo hasta guardar o cancelar
        // (Escape lo cierra desde ConfiguracionesColumnas).
        if (e.key !== "Tab") return;
        const enfocables = [
          ...e.currentTarget.querySelectorAll<HTMLElement>("input, select, button:not(:disabled)"),
        ];
        const primero = enfocables[0];
        const ultimo = enfocables[enfocables.length - 1];
        if (!primero || !ultimo) return;
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }}
    >
      <h2 id="titulo-nueva-vista" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Nueva vista
      </h2>
      <input
        type="text"
        autoFocus
        aria-label="Nombre de la vista"
        maxLength={MAX_NOMBRE_VISTA}
        aria-invalid={errorNombre ? true : undefined}
        aria-describedby={errorNombre ? "error-nombre-vista" : undefined}
        className={`text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full ${
          errorNombre ? "border-red-600" : "border-gray-300"
        }`}
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
      {errorNombre && (
        <p id="error-nombre-vista" role="alert" className="text-xs text-red-600">
          {errorNombre}
        </p>
      )}
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
      <div className="flex gap-2">
        <button
          type="button"
          onClick={guardar}
          disabled={!estado.nombreInput.trim() || guardando || !!errorNombre}
          aria-label="Guardar vista nueva"
          className="flex-1 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-marca-morado disabled:opacity-40 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="text-sm px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default PopoverGuardarConfig;
