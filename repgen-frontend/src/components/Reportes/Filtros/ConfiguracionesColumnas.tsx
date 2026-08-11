import { useReducer, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import type { Column } from "ag-grid-community";
import toast from "react-hot-toast";
import { ChevronDown, Save } from "lucide-react";
import {
  createReportConfig,
  updateReportConfig,
  deleteReportConfig,
  type ReportConfigResponse,
  type ColumnStateEntry,
} from "../../../features/reports/shared/api/report-configs.api";
import {
  estadoInicialMenuColumnas,
  menuColumnasReducer,
} from "./ConfiguracionesColumnas.reducer";
import MenuAccionesConfig from "./MenuAccionesConfig";
import PopoverGuardarConfig from "./PopoverGuardarConfig";

interface ConfiguracionesColumnasProps {
  referenciaGrid: React.RefObject<AgGridReact | null>;
  setColumnasVisibles: (val: Column[]) => void;
  reportId: string;
  configs: ReportConfigResponse[];
  onConfigsChange: () => Promise<void>;
}

const ConfiguracionesColumnas: React.FC<ConfiguracionesColumnasProps> = ({
  referenciaGrid,
  setColumnasVisibles,
  reportId,
  configs,
  onConfigsChange,
}) => {
  const [configSeleccionada, setConfigSeleccionada] = useState<string | null>(
    null,
  );
  const [inicializado, setInicializado] = useState(false);
  const [estado, dispatch] = useReducer(
    menuColumnasReducer,
    estadoInicialMenuColumnas,
  );
  const [guardando, setGuardando] = useState(false);

  // Inicializa el selector con la config predeterminada (la que se auto-aplica
  // al cargar). Patrón de ajuste de estado durante el render recomendado por
  // React para derivar de props asíncronas, sin useEffect. Solo una vez, para
  // no pisar la selección manual del usuario.
  if (!inicializado && configs.length > 0) {
    setInicializado(true);
    const def = configs.find((c) => c.isDefault);
    if (def) setConfigSeleccionada(def.id);
  }

  const api = referenciaGrid.current?.api;
  const configActual = configs.find((c) => c.id === configSeleccionada) ?? null;

  const cerrarTodo = () => {
    dispatch({ type: "CERRAR_TODO" });
  };

  const aplicarConfig = (config: ReportConfigResponse) => {
    if (!api) return;
    api.applyColumnState({ state: config.columnState, applyOrder: true });
    setColumnasVisibles(api.getColumns() ?? []);
  };

  const handleSeleccionar = (id: string | null) => {
    setConfigSeleccionada(id);
    if (id) {
      const config = configs.find((c) => c.id === id);
      if (config) aplicarConfig(config);
    }
  };

  const handleGuardarComo = async () => {
    if (!api || !estado.nombreInput.trim()) return;
    setGuardando(true);
    try {
      const columnState = api.getColumnState();
      const nueva = await createReportConfig(
        reportId,
        estado.nombreInput.trim(),
        columnState as ColumnStateEntry[],
        false,
      );
      await onConfigsChange();
      setConfigSeleccionada(nueva.id);
      toast.success(`Vista "${nueva.name}" guardada`);
      cerrarTodo();
    } catch {
      toast.error("Error al guardar la vista");
    }
    setGuardando(false);
  };

  const handleGuardarCambios = async () => {
    if (!api || !configActual) return;
    setGuardando(true);
    try {
      const columnState = api.getColumnState();
      await updateReportConfig(configActual.id, {
        columnState: columnState as ColumnStateEntry[],
      });
      await onConfigsChange();
      toast.success(`Cambios guardados en "${configActual.name}"`);
      cerrarTodo();
    } catch {
      toast.error("Error al guardar los cambios");
    }
    setGuardando(false);
  };

  const handleRenombrar = async () => {
    if (!configSeleccionada || !estado.nombreInput.trim()) return;
    setGuardando(true);
    try {
      await updateReportConfig(configSeleccionada, {
        name: estado.nombreInput.trim(),
      });
      await onConfigsChange();
      toast.success("Vista renombrada");
      cerrarTodo();
    } catch {
      toast.error("Error al renombrar la vista");
    }
    setGuardando(false);
  };

  const handlePredeterminar = async () => {
    if (!configSeleccionada) return;
    setGuardando(true);
    try {
      await updateReportConfig(configSeleccionada, { isDefault: true });
      await onConfigsChange();
      toast.success("Predeterminada actualizada");
      cerrarTodo();
    } catch {
      toast.error("Error al establecer la predeterminada");
    }
    setGuardando(false);
  };

  const handleEliminar = async () => {
    if (!configSeleccionada) return;
    setGuardando(true);
    try {
      await deleteReportConfig(configSeleccionada);
      await onConfigsChange();
      setConfigSeleccionada(null);
      toast.success("Vista eliminada");
      cerrarTodo();
    } catch {
      toast.error("Error al eliminar la vista");
    }
    setGuardando(false);
  };

  return (
    <div className="relative shrink-0">
      {/* Grupo segmentado: selector de vista + guardar + menú ⋮ comparten un
          solo borde con divisores internos, para leerse como un único control. */}
      <div className="flex items-stretch bg-white border border-gray-300 rounded-lg shadow-sm divide-x divide-gray-200">
        <label className="relative flex items-center gap-1.5 pl-3 pr-2 rounded-l-lg">
          <span className="text-sm text-gray-500 shrink-0">Vista:</span>
          <select
            value={configSeleccionada ?? ""}
            onChange={(e) =>
              handleSeleccionar(e.target.value || null)
            }
            aria-label="Vista de columnas"
            className="pr-6 py-2 text-sm font-medium bg-transparent text-gray-700 outline-none cursor-pointer appearance-none max-w-[160px] truncate"
          >
            <option value="">— Ninguna —</option>
            {configs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.isDefault ? "★ " : ""}
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </label>

        <button
          type="button"
          onClick={() => {
            if (configActual) {
              void handleGuardarCambios();
            } else {
              dispatch({ type: "ABRIR_POPOVER_GUARDAR" });
            }
          }}
          disabled={guardando}
          title={
            configActual
              ? `Guardar cambios en "${configActual.name}"`
              : "Guardar como vista nueva"
          }
          className="group flex items-center gap-1.5 px-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40 transition-colors"
        >
          <Save className="w-4 h-4 text-gray-500 group-hover:text-blue-600 shrink-0" />
          <span className="whitespace-nowrap">Guardar</span>
        </button>

        <MenuAccionesConfig
          configActual={configActual}
          guardando={guardando}
          estado={estado}
          dispatch={dispatch}
          onGuardarCambios={() => void handleGuardarCambios()}
          onRenombrar={() => void handleRenombrar()}
          onPredeterminar={() => void handlePredeterminar()}
          onEliminar={() => void handleEliminar()}
        />
      </div>

      <PopoverGuardarConfig
        guardando={guardando}
        estado={estado}
        dispatch={dispatch}
        onGuardarComo={() => void handleGuardarComo()}
      />

      {/* Overlay invisible para cerrar al hacer click fuera */}
      {(estado.menuAbierto || estado.popoverGuardarAbierto) && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 cursor-default"
          onClick={cerrarTodo}
        />
      )}
    </div>
  );
};

export default ConfiguracionesColumnas;
