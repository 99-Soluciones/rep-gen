import { useRef, useState, type FormEvent } from "react";

import { obtenerFechaHoyFormateada } from "../../../shared/utils/fechas";
import type { PeriodoVista } from "@repgen/shared-types";
import { detectarPeriodo, PERIODOS, resolverPeriodo } from "./ConfiguracionesColumnas/vista";

interface FiltroFechasProps {
  fechaDesde: string;
  setFechaDesde: (val: string) => void;
  fechaHasta: string;
  setFechaHasta: (val: string) => void;
}

/**
 * Rango de fechas con borrador local: los cambios solo se aplican (y disparan
 * una nueva consulta) con "Aplicar" o Enter. Mientras el borrador difiere, se
 * indica qué rango sigue cargado en la tabla. No hay toast de éxito: la
 * confirmación es la tabla recargada (o su estado de error). Se renderiza a la izquierda de
 * la barra de controles de la tabla, vía el slot `accionesToolbarInicio` de
 * TablaDinamica.
 */
/** "2026-09-01" → "01/09/2026" (sin pasar por Date: evita corrimientos de zona horaria). */
const formatearFecha = (iso: string) => iso.split("-").reverse().join("/");

const FiltroFechas = ({
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
}: FiltroFechasProps) => {
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
  };

  const conError = (campo: "desde" | "hasta") => error?.campos.includes(campo) ?? false;

  // El periodo llena las fechas del borrador; como Desde/Hasta, se confirma con
  // "Aplicar". Un solo modo de confirmar en la barra, y recorrer la lista con
  // las flechas no dispara una consulta a FileMaker por cada opción.
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

  return (
    <form
      noValidate // la validación propia da mensajes más claros que los nativos
      onSubmit={aplicarFechas}
      className="flex flex-wrap items-center gap-2 min-w-0"
    >
      <label className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-gray-500">Periodo:</span>
        <select
          value={periodoBorrador ?? ""}
          onChange={(e) => elegirPeriodo(e.target.value as PeriodoVista | "")}
          className="px-2 py-1 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Personalizado</option>
          {PERIODOS.map(({ valor, etiqueta }) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-gray-500">Desde:</span>
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
            setBorradorFechas((prev) => ({
              ...prev,
              fechaDesde: e.target.value,
            }));
          }}
          className={`px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            conError("desde") ? "border-red-600" : "border-gray-300"
          }`}
        />
      </label>
      <label className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-gray-500">Hasta:</span>
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
            setBorradorFechas((prev) => ({
              ...prev,
              fechaHasta: e.target.value,
            }));
          }}
          className={`px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            conError("hasta") ? "border-red-600" : "border-gray-300"
          }`}
        />
      </label>
      <button
        type="submit"
        disabled={fechasSinCambios}
        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-marca-morado transition-colors text-sm font-medium disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
      >
        Aplicar
      </button>
      {error && (
        <p id="fechas-error" role="alert" className="w-full text-xs text-red-600">
          {error.mensaje}
        </p>
      )}
      <span aria-live="polite" className="text-xs text-gray-500">
        {!fechasSinCambios &&
          `Sin aplicar · la tabla muestra ${formatearFecha(fechaDesde)} – ${formatearFecha(fechaHasta)}`}
      </span>
    </form>
  );
};

export default FiltroFechas;
