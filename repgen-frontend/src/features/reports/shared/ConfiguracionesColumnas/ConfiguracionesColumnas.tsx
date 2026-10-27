import { useEffect, useReducer, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import type { Column } from "ag-grid-community";
import type { PeriodoVista } from "@repgen/shared-types";
import toast from "react-hot-toast";
import { ChevronDown, Save } from "lucide-react";
import {
  createReportConfig,
  updateReportConfig,
  deleteReportConfig,
  type ReportConfigResponse,
} from "../api/report-configs.api";
import {
  aplicarVista,
  capturarVista,
  huellaVista,
  PERIODOS,
  problemaNombreVista,
  resolverPeriodo,
  restaurarOriginal,
  type Rango,
  type VistaCapturada,
} from "./vista";
import {
  estadoInicialMenuColumnas,
  menuColumnasReducer,
} from "./ConfiguracionesColumnas.reducer";
import MenuAccionesConfig from "./MenuAccionesConfig";
import { avisarConDeshacer } from "../avisarConDeshacer";
import PopoverGuardarConfig from "./PopoverGuardarConfig";
import { protegerSalida, type Salida } from "../../../../shared/utils/salidaProtegida";
import { ApiError } from "../../../../shared/api/http";

/**
 * Con la sesión expirada reintentar no sirve: se dice por qué y que lo que hay
 * en pantalla sigue ahí. Cualquier otro fallo sí puede ser momentáneo.
 */
const avisarErrorVista = (error: unknown, queFallo: string, alRepetirNombre?: () => void) => {
  // Otra pestaña guardó una vista con ese nombre: se recargan las vistas y el
  // aviso junto al campo lo dice (el panel sigue abierto con lo escrito).
  if (error instanceof ApiError && error.status === 409) {
    toast.error(`${queFallo}: ya hay una vista con ese nombre.`);
    alRepetirNombre?.();
    return;
  }
  if (error instanceof ApiError && error.status === 401) {
    toast.error(
      `${queFallo}: tu sesión expiró. Lo que ves en la tabla sigue aquí; para guardar, vuelve a abrir el reporte desde FileMaker.`,
    );
    return;
  }
  toast.error(`${queFallo}. Inténtalo de nuevo.`);
};

interface ConfiguracionesColumnasProps {
  referenciaGrid: React.RefObject<AgGridReact | null>;
  setColumnasVisibles: (val: Column[]) => void;
  reportId: string;
  configs: ReportConfigResponse[];
  onConfigsChange: () => Promise<void>;
  /** Rango de fechas aplicado: una vista con periodo lo compara y lo fija. */
  rango?: Rango;
  onAplicarRango?: (desde: string, hasta: string) => void;
  /** Columnas + filtros actuales del grid (useReporteGrid lo actualiza con cada cambio). */
  vistaActual?: VistaCapturada | null;
  /** Estado del grid al abrir/guardar la vista: la referencia de "sin cambios". */
  vistaBase?: { configId: string | null; huella: string } | null;
  /** Avisa que se aplicó o guardó una vista (o "Ninguna") para fijar la referencia. */
  onVistaAplicada?: (configId: string | null) => void;
  /**
   * Vista que estaba elegida en este reporte (al volver a una pestaña). Sin
   * ella, el selector arranca en la predeterminada.
   */
  vistaInicial?: string | null;
  /** Avisa qué vista quedó elegida, para recuperarla al volver a la pestaña. */
  onElegirVista?: (configId: string | null) => void;
}

const TEXTO_PERDIDA: Record<Salida["motivo"] | "vista", string> = {
  vista: "Si cambias de vista se pierden.",
  reporte: "Si sales del reporte se pierden.",
  sesion: "Si cierras sesión se pierden.",
};

const ConfiguracionesColumnas: React.FC<ConfiguracionesColumnasProps> = ({
  referenciaGrid,
  setColumnasVisibles,
  reportId,
  configs,
  onConfigsChange,
  rango,
  onAplicarRango,
  vistaActual,
  vistaBase,
  onVistaAplicada,
  vistaInicial,
  onElegirVista,
}) => {
  const [configSeleccionada, setConfigSeleccionadaLocal] = useState<string | null>(
    vistaInicial ?? null,
  );
  const [inicializado, setInicializado] = useState(vistaInicial !== undefined);
  // Toda elección del usuario se recuerda por pestaña (la inicial no hace
  // falta: useReporteGrid ya la anota al aplicar la predeterminada).
  const setConfigSeleccionada = (id: string | null) => {
    setConfigSeleccionadaLocal(id);
    onElegirVista?.(id);
  };
  const [estado, dispatch] = useReducer(
    menuColumnasReducer,
    estadoInicialMenuColumnas,
  );
  const [guardando, setGuardando] = useState(false);
  // Versión previa a la última "Actualizar vista", para deshacer también desde
  // el menú ⋮ (el toast se va solo y por teclado cuesta alcanzarlo).
  const [versionAnterior, setVersionAnterior] = useState<ReportConfigResponse | null>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);
  // Vista elegida en el selector mientras hay cambios sin guardar: se pregunta
  // antes de aplicarla ({ id: null } = "Ninguna").
  const [cambioPendiente, setCambioPendiente] = useState<{ id: string | null } | null>(null);
  // En Windows las flechas cambian el valor de un <select> cerrado y disparan
  // "change": recorrer la lista aplicaría cada vista (y su periodo, con una
  // consulta a FileMaker). Con teclado la opción queda en espera hasta Enter o
  // salir del selector; con el mouse se aplica al elegirla.
  const [vistaEnEspera, setVistaEnEspera] = useState<{ id: string | null } | null>(null);
  const conFlechasRef = useRef(false);
  // Salir del reporte o cerrar sesión con cambios sin guardar: se pregunta con
  // el mismo aviso que al cambiar de vista (salidaProtegida.ts).
  const [salidaPendiente, setSalidaPendiente] = useState<Salida | null>(null);
  // Ya se eligió salir: la recarga o el cambio de página no vuelven a preguntar.
  const saliendoRef = useRef(false);

  // Inicializa el selector con la config predeterminada (la que se auto-aplica
  // al cargar). Patrón de ajuste de estado durante el render recomendado por
  // React para derivar de props asíncronas, sin useEffect. Solo una vez, para
  // no pisar la selección manual del usuario.
  if (!inicializado && configs.length > 0) {
    setInicializado(true);
    const def = configs.find((c) => c.isDefault);
    if (def) setConfigSeleccionadaLocal(def.id);
  }

  // Selección vigente para el Deshacer del aviso, que corre después (y puede
  // llegar con otra vista ya abierta).
  const seleccionRef = useRef(configSeleccionada);
  useEffect(() => {
    seleccionRef.current = configSeleccionada;
  }, [configSeleccionada]);

  const api = referenciaGrid.current?.api;
  const configActual = configs.find((c) => c.id === configSeleccionada) ?? null;
  // Lo mismo vale para una vista nueva y para renombrar (que puede conservar su nombre).
  const errorNombre = problemaNombreVista(
    estado.nombreInput,
    configs,
    estado.modoRenombrar ? configSeleccionada : null,
  );

  // "• sin guardar": columnas o filtros distintos de lo guardado. Las fechas no
  // cuentan: recorrerlas (‹ ›, otro mes) es navegar, no editar la vista, y no
  // debe activar el aviso de salida. Solo se comparan las columnas que existen
  // en ambos lados, para que un campo nuevo del reporte no marque como
  // modificadas todas las vistas viejas.
  // Se calcula solo con props/estado (nunca leyendo el grid en el render).
  const modificada = (() => {
    if (!vistaActual) return false;
    if (!configActual) {
      // "— Ninguna —": filtros puestos, o columnas cambiadas desde que el grid
      // quedó limpio, son trabajo que se perdería al abrir una vista.
      if (vistaActual.filterModel) return true;
      return (
        vistaBase?.configId === null &&
        huellaVista(vistaActual.columnState, null) !== vistaBase.huella
      );
    }
    const actual = vistaActual;
    const huellaActualCompleta = huellaVista(actual.columnState, actual.filterModel);
    // Lo normal: comparar contra el grid tal como quedó al abrir/guardar la vista.
    if (vistaBase?.configId === configActual.id) {
      return huellaActualCompleta !== vistaBase.huella;
    }
    // Sin referencia todavía: comparar contra lo guardado.
    const guardadas = new Set(configActual.columnState.map((c) => c.colId));
    const existentes = new Set(actual.columnState.map((c) => c.colId));
    const filtrosGuardados = Object.fromEntries(
      Object.entries(configActual.filterModel ?? {}).filter(([id]) => existentes.has(id)),
    );
    const huellaActual = huellaVista(
      actual.columnState.filter((c) => guardadas.has(c.colId)),
      actual.filterModel,
    );
    const huellaGuardada = huellaVista(
      configActual.columnState.filter((c) => existentes.has(c.colId)),
      filtrosGuardados,
    );
    return huellaActual !== huellaGuardada;
  })();

  // Fechas distintas del periodo de la vista: un aviso tranquilo para volver,
  // no un cambio sin guardar.
  const periodoDeLaVista = configActual?.periodo
    ? PERIODOS.find((p) => p.valor === configActual.periodo)
    : undefined;
  const fueraDelPeriodo = (() => {
    if (!configActual?.periodo || !rango) return false;
    const esperado = resolverPeriodo(configActual.periodo);
    return esperado.desde !== rango.desde || esperado.hasta !== rango.hasta;
  })();

  // Mientras haya cambios sin guardar: guardián de las salidas de la app y
  // aviso nativo del navegador al recargar o cerrar la pestaña.
  useEffect(() => {
    if (!modificada) return;
    const retirarGuardian = protegerSalida(setSalidaPendiente);
    const avisarAlCerrar = (evento: BeforeUnloadEvent) => {
      if (saliendoRef.current) return;
      evento.preventDefault();
    };
    window.addEventListener("beforeunload", avisarAlCerrar);
    return () => {
      retirarGuardian();
      window.removeEventListener("beforeunload", avisarAlCerrar);
    };
  }, [modificada]);

  const quedarse = () => {
    salidaPendiente?.cancelar?.();
    setSalidaPendiente(null);
    setCambioPendiente(null);
    contenedorRef.current?.querySelector<HTMLElement>("select")?.focus();
  };

  const salirSinGuardar = (salida: Salida) => {
    saliendoRef.current = true;
    setSalidaPendiente(null);
    salida.continuar();
  };

  const motivoSinGuardar = guardando
    ? "Guardando la vista."
    : configActual && !modificada
      ? `«${configActual.name}» no tiene cambios sin guardar.`
      : null;

  const aplicarPeriodo = (periodo: PeriodoVista | null | undefined) => {
    if (!periodo || !onAplicarRango) return;
    const { desde, hasta } = resolverPeriodo(periodo);
    onAplicarRango(desde, hasta);
  };

  // Al cerrar el menú o el popover su contenido desaparece: el foco vuelve al
  // botón ⋮ en vez de caer en <body>.
  const cerrarTodo = () => {
    dispatch({ type: "CERRAR_TODO" });
    contenedorRef.current
      ?.querySelector<HTMLElement>("[aria-controls='menu-acciones-vista']")
      ?.focus();
  };

  // Menú o "Nueva vista" abiertos: un clic fuera los cierra y ese clic sigue su
  // curso (antes un velo invisible se lo tragaba).
  const flotanteAbierto = estado.menuAbierto || estado.popoverGuardarAbierto;
  useEffect(() => {
    if (!flotanteAbierto) return;
    const alPresionar = (evento: PointerEvent) => {
      if (!contenedorRef.current?.contains(evento.target as Node)) dispatch({ type: "CERRAR_TODO" });
    };
    document.addEventListener("pointerdown", alPresionar);
    return () => document.removeEventListener("pointerdown", alPresionar);
  }, [flotanteAbierto]);

  const aplicarConfig = (config: ReportConfigResponse) => {
    if (!api) return;
    aplicarVista(api, config);
    setColumnasVisibles(api.getColumns() ?? []);
    aplicarPeriodo(config.periodo);
    onVistaAplicada?.(config.id);
  };

  // Cambiar de vista reemplaza columnas y filtros: con cambios sin guardar (en
  // una vista o en "Ninguna") se pregunta primero.
  const elegirVista = (id: string | null) => {
    setVistaEnEspera(null);
    if (id === configSeleccionada) return;
    if (modificada) setCambioPendiente({ id });
    else handleSeleccionar(id);
  };

  const handleSeleccionar = (id: string | null) => {
    setCambioPendiente(null);
    setConfigSeleccionada(id);
    if (id) {
      const config = configs.find((c) => c.id === id);
      if (config) aplicarConfig(config);
    } else if (api) {
      // "— Ninguna —": columnas originales del reporte y sin filtros; las fechas no se tocan.
      restaurarOriginal(api);
      setColumnasVisibles(api.getColumns() ?? []);
      onVistaAplicada?.(null);
    }
  };

  const handleGuardarComo = async (periodo: PeriodoVista | null) => {
    if (!api || !estado.nombreInput.trim() || errorNombre) return;
    setGuardando(true);
    try {
      const nueva = await createReportConfig(
        reportId,
        estado.nombreInput.trim(),
        { ...capturarVista(api), periodo },
        false,
      );
      await onConfigsChange();
      setConfigSeleccionada(nueva.id);
      // La vista nueva queda abierta tal como se guardó, periodo incluido.
      aplicarPeriodo(periodo);
      onVistaAplicada?.(nueva.id);
      toast.success(`Vista "${nueva.name}" guardada`);
      cerrarTodo();
    } catch (error) {
      avisarErrorVista(error, "No se pudo guardar la vista", () => void onConfigsChange());
    }
    setGuardando(false);
  };

  // Vuelve a guardar la versión anterior. El grid no se toca: los cambios
  // siguen en pantalla y el botón vuelve a marcarlos como sin guardar.
  const deshacerActualizacion = async (anterior: ReportConfigResponse) => {
    setVersionAnterior(null);
    cerrarTodo();
    setGuardando(true);
    try {
      await updateReportConfig(anterior.id, {
        columnState: anterior.columnState,
        filterModel: anterior.filterModel ?? null,
        periodo: anterior.periodo ?? null,
      });
      await onConfigsChange();
      if (seleccionRef.current === anterior.id) {
        // Sigue abierta: sin foto del grid para la versión anterior, se compara
        // contra lo guardado y los cambios en pantalla vuelven a marcarse.
        onVistaAplicada?.(null);
        toast.success(`Se restauró la versión anterior de "${anterior.name}"`);
      } else {
        // Ya se abrió otra vista (su referencia no se toca): los cambios que se
        // habían guardado no están en pantalla, así que se pierden. Se dice.
        toast.success(
          `Se restauró la versión anterior de "${anterior.name}". Los cambios que habías guardado se descartaron.`,
        );
      }
    } catch {
      toast.error("No se pudo deshacer. La vista quedó con los cambios.");
    }
    setGuardando(false);
  };

  /** Devuelve true si se guardó. */
  const handleGuardarCambios = async (): Promise<boolean> => {
    if (!api || !configActual) return false;
    const anterior = configActual;
    setGuardando(true);
    let guardada = false;
    try {
      // Actualizar guarda columnas y filtros; el periodo de la vista se queda
      // (las fechas en pantalla son navegación, no parte del cambio).
      const periodo = anterior.periodo ?? null;
      await updateReportConfig(anterior.id, { ...capturarVista(api), periodo });
      await onConfigsChange();
      onVistaAplicada?.(anterior.id);
      setVersionAnterior(anterior);
      // Si el aviso se va, Deshacer sigue en el menú ⋮ de esta vista.
      avisarConDeshacer(`Vista "${anterior.name}" actualizada.`, () =>
        void deshacerActualizacion(anterior),
      );
      cerrarTodo();
      guardada = true;
    } catch (error) {
      avisarErrorVista(error, "No se pudo actualizar la vista");
    }
    setGuardando(false);
    return guardada;
  };

  const handleRenombrar = async () => {
    if (!configSeleccionada || !estado.nombreInput.trim() || errorNombre) return;
    setGuardando(true);
    try {
      await updateReportConfig(configSeleccionada, {
        name: estado.nombreInput.trim(),
      });
      await onConfigsChange();
      toast.success("Vista renombrada");
      cerrarTodo();
    } catch (error) {
      avisarErrorVista(error, "No se pudo renombrar la vista", () => void onConfigsChange());
    }
    setGuardando(false);
  };

  const handlePredeterminar = async () => {
    if (!configSeleccionada) return;
    setGuardando(true);
    try {
      await updateReportConfig(configSeleccionada, { isDefault: true });
      await onConfigsChange();
      toast.success(`"${configActual?.name}" se abrirá por defecto`);
      cerrarTodo();
    } catch (error) {
      avisarErrorVista(error, "No se pudo cambiar la vista predeterminada");
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
    } catch (error) {
      avisarErrorVista(error, "No se pudo eliminar la vista");
    }
    setGuardando(false);
  };

  return (
    <div
      ref={contenedorRef}
      className="relative flex min-w-0 max-w-full items-center gap-2"
      onKeyDown={(e) => {
        // Escape cierra menú/popover y devuelve el foco al botón ⋮. El input de
        // Renombrar maneja su propio Escape (vuelve a la lista del menú).
        if (e.key !== "Escape" || (e.target instanceof HTMLInputElement && estado.modoRenombrar)) return;
        if (cambioPendiente || salidaPendiente) {
          quedarse();
          return;
        }
        if (!flotanteAbierto) return;
        cerrarTodo();
      }}
      onBlur={(e) => {
        // El foco salió del grupo (Tab, otro control): se cierra lo flotante.
        const destino = e.relatedTarget as Node | null;
        if (flotanteAbierto && destino && !e.currentTarget.contains(destino)) {
          dispatch({ type: "CERRAR_TODO" });
        }
      }}
    >
      {/* Grupo segmentado: selector de vista + guardar + menú ⋮ comparten un
          solo borde con divisores internos, para leerse como un único control. */}
      <div className="flex items-stretch pointer-coarse:min-h-10 bg-white border border-gray-300 rounded-lg shadow-sm divide-x divide-gray-200">
        <label className="relative flex min-w-0 items-center gap-1.5 pl-3 pr-2 rounded-l-lg focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500">
          <span className="text-sm text-gray-500 shrink-0">Vista:</span>
          <select
            value={(vistaEnEspera ? vistaEnEspera.id : configSeleccionada) ?? ""}
            onKeyDown={(e) => {
              if (["ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(e.key) && !e.altKey) {
                conFlechasRef.current = true;
              } else if (e.key === "Enter" && vistaEnEspera) {
                e.preventDefault();
                elegirVista(vistaEnEspera.id);
              } else if (e.key === "Escape" && vistaEnEspera) {
                setVistaEnEspera(null);
              }
            }}
            onBlur={() => {
              if (vistaEnEspera) elegirVista(vistaEnEspera.id);
            }}
            onChange={(e) => {
              const id = e.target.value || null;
              if (conFlechasRef.current) {
                conFlechasRef.current = false;
                setVistaEnEspera({ id });
                return;
              }
              elegirVista(id);
            }}
            // Una vista guarda columnas, filtros y (opcional) un periodo: "Vista", no "de columnas".
            aria-label="Vista"
            // El selector es angosto: el nombre completo queda a la vista al pasar el cursor.
            title={configActual?.name}
            className="pr-6 py-2 text-sm font-medium bg-transparent text-gray-700 outline-none cursor-pointer appearance-none min-w-0 max-w-[160px] sm:max-w-[240px] truncate"
          >
            <option value="">— Ninguna —</option>
            {configs.map((c) => (
              <option
                key={c.id}
                value={c.id}
                // El lector de pantalla no lee "estrella": dice "predeterminada".
                aria-label={c.isDefault ? `${c.name} (predeterminada)` : undefined}
              >
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
            if (motivoSinGuardar) return;
            if (configActual) {
              void handleGuardarCambios();
            } else {
              dispatch({ type: "ABRIR_POPOVER_GUARDAR" });
            }
          }}
          // aria-disabled y no disabled: sigue en el orden de tabulación y el
          // motivo llega por teclado y lector de pantalla (como Exportar).
          aria-disabled={motivoSinGuardar ? true : undefined}
          aria-describedby={motivoSinGuardar ? "motivo-guardar-vista" : undefined}
          aria-label={
            !configActual
              ? modificada
                ? "Guardar vista (cambios sin guardar)"
                : "Guardar vista"
              : modificada
                ? "Actualizar vista (cambios sin guardar)"
                : "Actualizar vista"
          }
          title={
            !configActual
              ? "Guarda las columnas y filtros actuales como una vista nueva"
              : modificada
                ? `Guarda las columnas y filtros actuales en "${configActual.name}"`
                : `"${configActual.name}" no tiene cambios sin guardar`
          }
          className={`group relative flex items-center gap-1.5 px-3 text-sm transition-colors hover:bg-blue-50 hover:text-blue-700 aria-disabled:opacity-40 aria-disabled:cursor-not-allowed aria-disabled:hover:bg-transparent aria-disabled:hover:text-inherit focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
            modificada ? "font-semibold text-blue-700" : "font-medium text-gray-700"
          }`}
        >
          <Save
            className={`w-4 h-4 shrink-0 group-hover:text-blue-600 ${
              modificada ? "text-blue-600" : "text-gray-500"
            }`}
          />
          {/* En teléfono queda el ícono (y el punto): el nombre accesible sigue completo. */}
          <span className="hidden whitespace-nowrap sm:inline">
            {configActual ? "Actualizar vista" : "Guardar vista"}
          </span>
          {motivoSinGuardar && (
            <span id="motivo-guardar-vista" className="sr-only">
              {motivoSinGuardar}
            </span>
          )}
          {/* Cambios sin guardar: punto azul en el botón que los guarda, no en el nombre. */}
          {modificada && (
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-blue-600" />
          )}
        </button>

        <MenuAccionesConfig
          configActual={configActual}
          guardando={guardando}
          modificada={modificada}
          estado={estado}
          dispatch={dispatch}
          onGuardarCambios={() => void handleGuardarCambios()}
          onRenombrar={() => void handleRenombrar()}
          onPredeterminar={() => void handlePredeterminar()}
          onEliminar={() => void handleEliminar()}
          onDeshacer={
            versionAnterior && versionAnterior.id === configActual?.id
              ? () => void deshacerActualizacion(versionAnterior)
              : undefined
          }
          errorNombre={errorNombre}
        />
      </div>

      {fueraDelPeriodo && periodoDeLaVista && configActual?.periodo && (
        <button
          type="button"
          onClick={() => aplicarPeriodo(configActual.periodo)}
          className="shrink-0 rounded text-xs font-medium text-blue-700 underline-offset-2 hover:underline pointer-coarse:min-h-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Volver a {periodoDeLaVista.etiqueta.toLowerCase()}
        </button>
      )}

      <PopoverGuardarConfig
        guardando={guardando}
        estado={estado}
        dispatch={dispatch}
        onGuardarComo={(periodo) => void handleGuardarComo(periodo)}
        onCancelar={cerrarTodo}
        errorNombre={errorNombre}
      />

      {(cambioPendiente || salidaPendiente) && (
        <div
          role="alertdialog"
          aria-labelledby="aviso-cambios-vista"
          className="absolute right-0 top-full mt-2 z-50 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-3 flex flex-col gap-3"
          onKeyDown={(e) => {
            // Tab y Shift+Tab se quedan dentro del aviso hasta elegir una opción.
            if (e.key !== "Tab") return;
            const botones = [
              ...e.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"),
            ];
            const primero = botones[0];
            const ultimo = botones[botones.length - 1];
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
          <p id="aviso-cambios-vista" className="text-sm text-gray-700 break-words">
            {configActual ? (
              <>
                Tienes cambios sin guardar en{" "}
                <strong className="font-semibold">«{configActual.name}»</strong>.
              </>
            ) : (
              "Tienes filtros o columnas sin guardar."
            )}{" "}
            {TEXTO_PERDIDA[salidaPendiente?.motivo ?? "vista"]}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              autoFocus
              disabled={guardando}
              onClick={quedarse}
              className="text-sm px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-40 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={guardando}
              onClick={() => {
                if (salidaPendiente) salirSinGuardar(salidaPendiente);
                else if (cambioPendiente) handleSeleccionar(cambioPendiente.id);
              }}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Descartar cambios
            </button>
            {configActual ? (
              <button
                type="button"
                disabled={guardando}
                onClick={async () => {
                  const salida = salidaPendiente;
                  const cambio = cambioPendiente;
                  if (!(await handleGuardarCambios())) return;
                  if (salida) salirSinGuardar(salida);
                  else if (cambio) handleSeleccionar(cambio.id);
                }}
                className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-marca-morado disabled:opacity-40 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
              >
                {guardando
                  ? "Guardando…"
                  : salidaPendiente
                    ? "Actualizar y salir"
                    : "Actualizar y cambiar"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  // Sin vista abierta no hay qué actualizar: se guarda como nueva
                  // y el cambio de vista o la salida se cancelan (el usuario
                  // decide después).
                  salidaPendiente?.cancelar?.();
                  setSalidaPendiente(null);
                  setCambioPendiente(null);
                  dispatch({ type: "ABRIR_POPOVER_GUARDAR" });
                }}
                className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-marca-morado font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
              >
                Guardar como vista nueva
              </button>
            )}
          </div>
        </div>
      )}

      {/* Velo invisible solo para el aviso de cambios: un clic fuera equivale a Cancelar. */}
      {(cambioPendiente || salidaPendiente) && (
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          className="fixed inset-0 z-40 cursor-default"
          onClick={() => {
            quedarse();
            cerrarTodo();
          }}
        />
      )}
    </div>
  );
};

export default ConfiguracionesColumnas;
