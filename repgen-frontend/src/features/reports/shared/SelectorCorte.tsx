import { useState } from "react";

/**
 * Fecha de corte con "Aplicar": elegir la fecha no consulta; se consulta al
 * aplicar (botón o Enter). Aplicar se deshabilita si la fecha no cambió o no
 * es válida (vacía o futura).
 */
const SelectorCorte = ({
  fechaCorte,
  hoy,
  onAplicar,
}: {
  fechaCorte: string;
  hoy: string;
  onAplicar: (fecha: string) => void;
}) => {
  const [borrador, setBorrador] = useState(fechaCorte);
  const valida = borrador !== "" && borrador <= hoy;
  const puedeAplicar = valida && borrador !== fechaCorte;

  return (
    <form
      className="flex items-center gap-2 text-sm text-gray-700"
      onSubmit={(e) => {
        e.preventDefault();
        if (puedeAplicar) onAplicar(borrador);
      }}
    >
      <label className="flex items-center gap-2">
        <span className="font-medium">Corte al</span>
        <input
          type="date"
          aria-label="Fecha de corte"
          value={borrador}
          max={hoy}
          required
          onChange={(e) => setBorrador(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm tabular-nums"
        />
      </label>
      <button
        type="submit"
        // aria-disabled: sigue enfocable y dice por qué (DESIGN.md).
        aria-disabled={!puedeAplicar || undefined}
        aria-describedby={puedeAplicar ? undefined : "corte-sin-cambios"}
        className="rounded-lg bg-blue-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-marca-morado aria-disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
      >
        Aplicar
      </button>
      {!puedeAplicar && (
        <span id="corte-sin-cambios" className="sr-only">
          {valida ? "Es el corte que ya está cargado" : "Elige una fecha que no sea futura"}
        </span>
      )}
    </form>
  );
};

export default SelectorCorte;
