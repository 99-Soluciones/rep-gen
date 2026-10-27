import { useEffect, useRef, useState, type FormEvent } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import { formatearFecha, obtenerFechaHoyFormateada } from "../../../shared/utils/fechas";
import type { PeriodoVista } from "@repgen/shared-types";
import { detectarPeriodo, PERIODOS, resolverPeriodo, type Rango } from "./ConfiguracionesColumnas/vista";
import { desplazarRango } from "./desplazarRango";

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

  // ‹ › aplican directo (un clic explícito): el periodo de al lado del mismo tamaño.
  const anterior = desplazarRango({ desde: fechaDesde, hasta: fechaHasta }, -1);
  const siguiente = desplazarRango({ desde: fechaDesde, hasta: fechaHasta }, 1);
  const irA = (destino: Rango | null) => {
    if (!destino) return;
    props.setFechaDesde(destino.desde);
    props.setFechaHasta(destino.hasta);
  };
  const enPalabras = (r: Rango) => `${formatearFecha(r.desde)} al ${formatearFecha(r.hasta)}`;
  const claseFlecha =
    // Azules en reposo: navegar por periodos es la acción más usada de la barra.
    // Deshabilitadas pasan a gris; un azul tenue seguiría pareciendo pulsable.
    "flex w-9 shrink-0 items-center justify-center text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 aria-disabled:cursor-not-allowed aria-disabled:text-gray-300 aria-disabled:hover:bg-transparent aria-disabled:hover:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 pointer-coarse:w-10";

  return (
    <div
      ref={grupoRef}
      // En teléfono no puede pasar del ancho de la barra: el › quedaba recortado.
      className="relative min-w-0 max-w-full shrink-0"
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !abierto) return;
        event.stopPropagation();
        cerrar();
      }}
    >
      <div className="flex max-w-full items-stretch divide-x divide-gray-200 overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => irA(anterior)}
        aria-disabled={anterior ? undefined : true}
        aria-label={anterior ? `Periodo anterior: del ${enPalabras(anterior)}` : "No hay periodo anterior"}
        className={claseFlecha}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <button
        ref={botonRef}
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
        aria-controls={ID_PANEL}
        aria-label={`Fechas: ${periodo ? `${periodo.etiqueta}, ` : ""}del ${formatearFecha(fechaDesde)} al ${formatearFecha(fechaHasta)}. Cambiar`}
        // Las flechas no se encogen; el enunciado sí, con "…" solo si de verdad no
        // cabe (el nombre accesible lo dice completo). Bajo sm sin los íconos
        // decorativos: la caja entera ya se lee como botón.
        className="group flex min-w-0 items-center gap-2 px-3 py-1.5 pointer-coarse:min-h-10 text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
      >
        <CalendarDays className="hidden h-4 w-4 shrink-0 text-gray-500 group-hover:text-blue-600 sm:block" aria-hidden="true" />
        <span className="min-w-0 truncate tabular-nums">
          {periodo && <span className="font-medium">{periodo.etiqueta} · </span>}
          {rango}
        </span>
        <ChevronDown
          className={`hidden h-4 w-4 shrink-0 text-gray-400 transition-transform motion-reduce:transition-none sm:block ${abierto ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      <button
        type="button"
        onClick={() => irA(siguiente)}
        aria-disabled={siguiente ? undefined : true}
        aria-label={siguiente ? `Periodo siguiente: del ${enPalabras(siguiente)}` : "No hay periodo siguiente: el rango llega a hoy"}
        className={claseFlecha}
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>
      </div>

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
    if (fechasSinCambios) return;
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
          // Un <select> no envía el formulario con Enter: se pide a mano, como en las fechas.
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }}
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
          // aria-disabled: sigue enfocable y dice por qué (DESIGN.md).
          aria-disabled={fechasSinCambios || undefined}
          aria-describedby={fechasSinCambios ? "fechas-sin-cambios" : undefined}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-marca-morado aria-disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        >
          Aplicar
        </button>
        {fechasSinCambios && (
          <span id="fechas-sin-cambios" className="sr-only">
            Las fechas son las que ya están cargadas.
          </span>
        )}
      </div>
    </form>
  );
};

export default FiltroFechas;
