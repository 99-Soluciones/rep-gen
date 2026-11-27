import { useRef, useState, type InputHTMLAttributes, type Ref } from "react";
import { CalendarDays } from "lucide-react";
import { formatearFecha, interpretarFecha } from "../../../shared/utils/fechas";

type CampoFechaProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "min" | "max"
> & {
  /** "YYYY-MM-DD" o "" (lo que espera FileMaker y AG Grid). */
  value: string;
  /** "YYYY-MM-DD", o "" mientras lo escrito no es una fecha completa. */
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  ref?: Ref<HTMLInputElement>;
};

const aTexto = (iso: string) => (iso ? formatearFecha(iso) : "");

/**
 * Fecha en dd/mm/aaaa, como se muestra en la tabla. El <input type="date">
 * nativo toma el formato del idioma del navegador (mm/dd/aaaa en inglés) y no
 * se puede forzar, así que se escribe en un campo de texto; el botón abre el
 * calendario nativo de un input oculto. Hacia fuera siempre es ISO.
 */
const CampoFecha = ({ value, onChange, min, max, className, ref, ...resto }: CampoFechaProps) => {
  const [texto, setTexto] = useState(() => aTexto(value));
  const [valorAnterior, setValorAnterior] = useState(value);
  const calendarioRef = useRef<HTMLInputElement>(null);

  // Cambio desde fuera (periodo, limpiar filtro…): sin pisar lo que se está
  // escribiendo si ya equivale ("1/9/2026" es el 2026-09-01).
  if (value !== valorAnterior) {
    setValorAnterior(value);
    if (interpretarFecha(texto) !== value) setTexto(aTexto(value));
  }

  const cambiar = (nuevoTexto: string, iso: string) => {
    setTexto(nuevoTexto);
    if (iso !== value) onChange(iso);
  };

  const bloqueado = Boolean(resto.readOnly || resto.disabled);

  return (
    <div className="relative w-full">
      <input
        {...resto}
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd/mm/aaaa"
        value={texto}
        onChange={(e) => cambiar(e.target.value, interpretarFecha(e.target.value))}
        className={`${className ?? ""} ps-8!`}
      />
      <button
        type="button"
        disabled={bloqueado}
        onClick={() => {
          try {
            calendarioRef.current?.showPicker?.();
          } catch {
            // Navegador sin showPicker en este contexto: queda escribir la fecha.
          }
        }}
        aria-label={`Calendario: ${resto["aria-label"] ?? "fecha"}`}
        className="absolute left-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {/* Solo para el calendario: el navegador lo abre junto a este input invisible. */}
      <input
        ref={calendarioRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        min={min}
        max={max}
        value={value}
        onChange={(e) => cambiar(aTexto(e.target.value), e.target.value)}
        className="pointer-events-none absolute bottom-0 left-1 h-full w-6 opacity-0"
      />
    </div>
  );
};

export default CampoFecha;
