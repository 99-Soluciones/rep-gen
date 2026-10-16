import type { ReactNode } from "react";
import { formatearFecha } from "../../../shared/utils/fechas";
import { ID_RESUMEN } from "./PanelKpiLateral";
import type { EstadoCifras } from "./estadoCifras";
import type { ComparacionPeriodo } from "./useComparacionPeriodo";
import { formatearMoneda } from "./ag-grid/formato";

const moneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const entero = new Intl.NumberFormat("es-MX");

/**
 * KPIs como estado de cuenta ("El Libro Mayor Claro", DESIGN.md): renglones
 * etiqueta / cifra alineados a la derecha y un total con regla encima, para
 * que se vea cómo se llega al neto. Solo los negativos llevan color (rojo).
 */
export const SeccionEstado = ({
  titulo,
  nota,
  children,
}: {
  titulo: string;
  /** Aclaración breve debajo de las cifras (p. ej. qué cuenta el total). */
  nota?: string;
  children: ReactNode;
}) => (
  <section className="flex flex-col gap-1">
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
      {titulo}
    </h3>
    <dl className="flex flex-col">{children}</dl>
    {nota && <p className="mt-1 text-xs leading-relaxed text-gray-500">{nota}</p>}
  </section>
);

interface LineaEstadoProps {
  etiqueta: string;
  valor: number;
  tipo?: "moneda" | "unidades";
  /** Renglón de resultado: regla superior y cifra destacada. */
  total?: boolean;
  /** Moneda de la cifra si no es MXN ("USD 1,000.00", como en la tabla). */
  codigoMoneda?: string;
}

export const LineaEstado = ({
  etiqueta,
  valor,
  tipo = "moneda",
  total = false,
  codigoMoneda,
}: LineaEstadoProps) => (
  <div
    className={`flex items-baseline justify-between gap-4 py-1 ${
      total ? "mt-1 pt-2 border-t border-gray-300" : ""
    }`}
  >
    <dt className={total ? "text-sm font-semibold text-gray-800" : "text-sm text-gray-600"}>
      {etiqueta}
    </dt>
    <dd
      className={`text-right tabular-nums whitespace-nowrap ${
        total ? "text-lg font-bold" : "text-sm font-medium"
      } ${valor < 0 ? "text-red-600" : "text-gray-900"}`}
    >
      {/* `|| 0` evita "-$0.00" cuando llega -0 (p. ej. cargos negados en cero). */}
      {tipo === "unidades"
        ? entero.format(valor || 0)
        : codigoMoneda && codigoMoneda !== "MXN"
          ? formatearMoneda(valor || 0, codigoMoneda)
          : moneda.format(valor || 0)}
    </dd>
  </div>
);

const porcentaje = new Intl.NumberFormat("es-MX", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

/**
 * El resultado frente al periodo anterior, debajo del renglón total:
 * "vs. 01/09 – 15/09/2026   $34,800.00 · +12.1%". El periodo anterior se lee
 * completo, así que con filtros en la tabla no se compara (no serían lo mismo).
 */
export const LineaComparacion = ({
  actual,
  comparacion,
  filtrado,
}: {
  actual: number;
  comparacion: ComparacionPeriodo;
  filtrado: boolean;
}) => {
  const rango = `${formatearFecha(comparacion.rango.desde).slice(0, 5)} – ${formatearFecha(comparacion.rango.hasta)}`;
  let detalle: ReactNode;
  if (filtrado) {
    detalle = "Sin comparar: la tabla tiene filtros";
  } else if (comparacion.estado === "cargando") {
    detalle = "Calculando…";
  } else if (comparacion.estado === "error" || comparacion.valor === null) {
    detalle = "No se pudo leer";
  } else {
    const anterior = comparacion.valor;
    const cambio = anterior === 0 ? null : (actual - anterior) / Math.abs(anterior);
    detalle = (
      <>
        <span className={anterior < 0 ? "text-red-600" : "text-gray-700"}>
          {moneda.format(anterior || 0)}
        </span>
        {cambio !== null && (
          <span className={cambio < 0 ? "text-red-600" : "text-gray-700"}> · {porcentaje.format(cambio)}</span>
        )}
      </>
    );
  }
  return (
    <div className="flex items-baseline justify-between gap-4 pt-0.5 text-xs">
      <dt className="text-gray-600">vs. {rango}</dt>
      <dd aria-busy={comparacion.estado === "cargando" && !filtrado} className="text-right tabular-nums text-gray-600">
        {detalle}
      </dd>
    </div>
  );
};

/**
 * Deja claro sobre qué se calcularon las cifras: el rango cargado y cuántas
 * filas quedaron tras los filtros de la tabla. Quien solo mira el resumen no
 * ve la barra de la tabla.
 */
export const NotaRegistros = ({
  registros,
  total,
  desde,
  hasta,
}: {
  /** Filas que quedan tras los filtros de la tabla. */
  registros: number;
  /** Filas cargadas en el rango. */
  total: number;
  desde: string;
  hasta: string;
}) => (
  <div className="col-span-full flex flex-col gap-0.5 text-xs">
    <p className="font-medium text-gray-700 tabular-nums">
      {formatearFecha(desde)} – {formatearFecha(hasta)}
    </p>
    <p className="text-gray-500">
      {registros === total
        ? `Calculado sobre ${entero.format(total)} ${total === 1 ? "registro" : "registros"}`
        : `Calculado sobre ${entero.format(registros)} de ${entero.format(total)} registros (con los filtros de la tabla)`}
    </p>
  </div>
);

/**
 * Bajo xl el resumen queda debajo de la tabla, fuera de la primera pantalla:
 * la cifra resultado se adelanta en una línea, para quien entra a ver "cómo
 * vamos" sin bajar. "Ver resumen" abre el panel y lleva el foco hasta él.
 */
export const ResultadoCompacto = ({
  etiqueta,
  valor,
  estado = null,
  filtrado = false,
  onAbrirResumen,
}: {
  etiqueta: string;
  valor: number;
  estado?: EstadoCifras;
  /** La cifra sale solo de las filas que dejan los filtros de la tabla. */
  filtrado?: boolean;
  onAbrirResumen: () => void;
}) => {
  const sinCifra = estado === "primeraCarga";
  // Con un error no hay cifra que adelantar: la tabla ya lo explica.
  if (estado === "error") return null;
  return (
    <div
      aria-busy={estado === "cargando" || sinCifra}
      className={`mx-2 mt-2 flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-sm xl:hidden ${
        estado === "cargando" ? "opacity-50" : ""
      }`}
    >
      <p className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-sm">
        <span className="text-gray-600">{etiqueta}</span>
        <span
          className={`font-bold tabular-nums whitespace-nowrap ${
            !sinCifra && valor < 0 ? "text-red-600" : "text-gray-900"
          }`}
        >
          {/* Antes de la primera carga no hay cifra: un $0.00 diría "no hubo movimientos". */}
          {sinCifra ? "—" : moneda.format(valor || 0)}
        </span>
        {filtrado && !sinCifra && <span className="text-xs text-gray-500">· filtrado</span>}
      </p>
      <button
        type="button"
        onClick={() => {
          onAbrirResumen();
          // Tras abrirse el panel: el foco lo trae a la vista (y al lector de pantalla).
          setTimeout(() => document.getElementById(ID_RESUMEN)?.focus(), 0);
        }}
        className="shrink-0 rounded text-sm font-medium text-blue-700 underline-offset-2 hover:underline pointer-coarse:min-h-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Ver resumen
      </button>
    </div>
  );
};
