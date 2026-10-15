import type { ReactNode } from "react";

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
}

export const LineaEstado = ({
  etiqueta,
  valor,
  tipo = "moneda",
  total = false,
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
      {tipo === "moneda" ? moneda.format(valor || 0) : entero.format(valor || 0)}
    </dd>
  </div>
);

/** Deja claro sobre qué filas se calcularon las cifras. */
export const NotaRegistros = ({
  registros,
  filtrado,
}: {
  registros: number;
  filtrado: boolean;
}) => (
  <p className="col-span-full text-xs text-gray-500">
    Calculado sobre {entero.format(registros)}{" "}
    {registros === 1 ? "registro" : "registros"}
    {filtrado ? (registros === 1 ? " filtrado" : " filtrados") : ""}
  </p>
);
