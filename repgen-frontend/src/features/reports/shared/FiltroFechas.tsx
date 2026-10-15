import { useEffect, useRef, useState, type FormEvent } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";

import { formatearFecha, obtenerFechaHoyFormateada } from "../../../shared/utils/fechas";
import type { PeriodoVista } from "@repgen/shared-types";
import { detectarPeriodo, PERIODOS, resolverPeriodo } from "./ConfiguracionesColumnas/vista";

interface FiltroFechasProps {
  fechaDesde: string;
  setFechaDesde: (val: string) => void;
  fechaHasta: string;
  setFechaHasta: (val: string) => void;
}

const ID_PANEL = "panel-fechas";

/**
 * Rango de fechas de la tabla. En la barra se lee como un enunciado de lo que
 * está cargado ("Mes actual · 01/10/2026 – 15/10/2026"); al pulsarlo se abre
 * el formulario. Ocupa la mitad que los cuatro controles sueltos y el rango
 * aplicado siempre está a la vista (Confianza en el dato). Se renderiza
 * a la izquierda de la barra de la tabla, vía el slot `accionesToolbarInicio`.
 */
const FiltroFechas = (props: FiltroFechasProps) => {
  const { fechaDesde, fechaHasta } = props;
  const [abierto, setAbierto] = useState(false);
  const grupoRef = useRef<HTMLDivElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);

  const cerrar = (devolverFoco = true) => {
    setAbierto(false);
    if (devolverFoco) botonRef.current?.focus();
  };

  // Clic fuera cierra sin aplicar, como cualquier panel desplegable.
  useEffect(() => {
    if (!abierto) return;
    const cerrarFuera = (event: PointerEvent) => {
      if (!grupoRef.current?.contains(event.target as Node)) setAbierto(false);
    };
    document.addEventListener("pointerdown", cerrarFuera);
    return () => document.removeEventListener("pointerdown", cerrarFuera);
  }, [abierto]);

  const periodo = PERIODOS.find(
    ({ valor }) => valor === detectarPeriodo({ desde: fechaDesde, hasta: fechaHasta }),
  );
  // Mismo año: solo una vez, al final ("01/10 – 15/10/2026"); cabe mejor en la barra.
  const mismoAnio = fechaDesde.slice(0, 4) === fechaHasta.slice(0, 4);
  const rango = `${formatearFecha(fechaDesde).slice(0, mismoAnio ? 5 : undefined)} – ${formatearFecha(fechaHasta)}`;

  return (
    <div
      ref={grupoRef}
      className="relative shrink-0"
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !abierto) return;
        event.stopPropagation();
        cerrar();
      }}
    >
      <button
        ref={botonRef}
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
        aria-controls={ID_PANEL}
        aria-label={`Fechas: ${periodo ? `${periodo.etiqueta}, ` : ""}del ${formatearFecha(fechaDesde)} al ${formatearFecha(fechaHasta)}. Cambiar`}
        className="group flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 pointer-coarse:min-h-10 text-sm text-gray-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-gray-500 group-hover:text-blue-600" aria-hidden="true" />
        <span className="whitespace-nowrap tabular-nums">
          {periodo && <span className="font-medium">{periodo.etiqueta} · </span>}
          {rango}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform motion-reduce:transition-none ${abierto ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {abierto && <FormularioFechas {...props} onCerrar={cerrar} />}
    </div>
  );
};

/**
 * Borrador local: se monta al abrir el panel, así cerrarlo sin aplicar descarta
 * lo elegido. Los cambios solo se aplican (y disparan una consulta) con
 * "Aplicar" o Enter. No hay toast de éxito: la confirmación es la tabla
 * recargada (o su estado de error).
 */
const FormularioFechas = ({
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
  onCerrar,
}: FiltroFechasProps & { onCerrar: (devolverFoco?: boolean) => void }) => {
  const [borradorFechas, setBorradorFechas] = useState({
    fechaDesde,
    fechaHasta,
  });
  // Error junto a los campos (no en un toast): queda visible, se anuncia y se
  // asocia a los inputs con aria-describedby.
  const [error, setError] = useState<{ mensaje: string; campos: ("desde" | "hasta")[] } | null>(null);

  const aplicarFechas = (evento: FormEvent) => {
    evento.preventDefault();
    if (!borradorFechas.fechaDesde || !borradorFechas.fechaHasta) {
      setError({
        mensaje: "Completa las dos fechas.",
        campos: [
          ...(!borradorFechas.fechaDesde ? (["desde"] as const) : []),
          ...(!borradorFechas.fechaHasta ? (["hasta"] as const) : []),
        ],
      });
      return;
    }
    if (borradorFechas.fechaDesde > borradorFechas.fechaHasta) {
      setError({
        mensaje: "La fecha «Desde» no puede ser posterior a «Hasta».",
        campos: ["desde", "hasta"],
      });
      return;
    }
    setError(null);
    setFechaDesde(borradorFechas.fechaDesde);
    setFechaHasta(borradorFechas.fechaHasta);
    onCerrar();
  };

  const conError = (campo: "desde" | "hasta") => error?.campos.includes(campo) ?? false;

  // El periodo llena las fechas del borrador; como Desde/Hasta, se confirma con
  // "Aplicar". Un solo modo de confirmar, y recorrer la lista con las flechas
  // no dispara una consulta a FileMaker por cada opción.
  const desdeRef = useRef<HTMLInputElement>(null);
  const periodoBorrador = detectarPeriodo({
    desde: borradorFechas.fechaDesde,
    hasta: borradorFechas.fechaHasta,
  });
  const elegirPeriodo = (periodo: PeriodoVista | "") => {
    if (!periodo) {
      // "Personalizado": las fechas se eligen a mano.
      desdeRef.current?.focus();
      return;
    }
    const { desde, hasta } = resolverPeriodo(periodo);
    setError(null);
    setBorradorFechas({ fechaDesde: desde, fechaHasta: hasta });
  };

  const fechasSinCambios =
    borradorFechas.fechaDesde === fechaDesde &&
    borradorFechas.fechaHasta === fechaHasta;

  const claseCampo = (campo: "desde" | "hasta") =>
    `w-full rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
      conError(campo) ? "border-red-600" : "border-gray-300"
    }`;
  const claseEtiqueta = "text-xs font-medium text-gray-600";

  return (
    <form
      id={ID_PANEL}
      aria-label="Cambiar fechas"
      noValidate // la validación propia da mensajes más claros que los nativos
      onSubmit={aplicarFechas}
      // Tab fuera del panel lo cierra sin aplicar (el foco ya se fue: no se mueve).
      onBlur={(evento) => {
        const destino = evento.relatedTarget;
        if (destino && !evento.currentTarget.parentElement?.contains(destino)) onCerrar(false);
      }}
      className="absolute left-0 top-full z-50 mt-2 flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
    >
      <label className="flex flex-col gap-1">
        <span className={claseEtiqueta}>Periodo</span>
        <select
          // Al abrir, el foco entra en la primera decisión.
          autoFocus
          value={periodoBorrador ?? ""}
          onChange={(e) => elegirPeriodo(e.target.value as PeriodoVista | "")}
          className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Personalizado</option>
          {PERIODOS.map(({ valor, etiqueta }) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex min-w-0 flex-col gap-1">
          <span className={claseEtiqueta}>Desde</span>
          <input
            ref={desdeRef}
            type="date"
            aria-label="Fecha desde"
            aria-invalid={conError("desde") || undefined}
            aria-describedby={conError("desde") ? "fechas-error" : undefined}
            max={borradorFechas.fechaHasta || obtenerFechaHoyFormateada()}
            value={borradorFechas.fechaDesde}
            onChange={(e) => {
              setError(null);
              setBorradorFechas((prev) => ({ ...prev, fechaDesde: e.target.value }));
            }}
            className={claseCampo("desde")}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1">
          <span className={claseEtiqueta}>Hasta</span>
          <input
            type="date"
            aria-label="Fecha hasta"
            aria-invalid={conError("hasta") || undefined}
            aria-describedby={conError("hasta") ? "fechas-error" : undefined}
            min={borradorFechas.fechaDesde}
            max={obtenerFechaHoyFormateada()}
            value={borradorFechas.fechaHasta}
            onChange={(e) => {
              setError(null);
              setBorradorFechas((prev) => ({ ...prev, fechaHasta: e.target.value }));
            }}
            className={claseCampo("hasta")}
          />
        </label>
      </div>
      {error && (
        <p id="fechas-error" role="alert" className="text-xs text-red-600">
          {error.mensaje}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => onCerrar()}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={fechasSinCambios}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-marca-morado disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        >
          Aplicar
        </button>
      </div>
    </form>
  );
};

export default FiltroFechas;
