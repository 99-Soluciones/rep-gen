import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

/** A partir de aquí los datos se marcan como viejos (el enunciado dice hace cuánto). */
export const MINUTOS_PARA_VIEJOS = 15;

const hora = new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit" });

/** "25 min", "3 h", "2 días": una pestaña abierta desde ayer no dice "1440 min". */
const antiguedad = (minutos: number) =>
  minutos < 60
    ? `${minutos} min`
    : minutos < 24 * 60
      ? `${Math.floor(minutos / 60)} h`
      : `${Math.floor(minutos / (24 * 60))} ${Math.floor(minutos / (24 * 60)) === 1 ? "día" : "días"}`;

interface ActualizarDatosProps {
  /** Fin de la última carga correcta; null antes de la primera. */
  cargadoEn: Date | null;
  estaCargando: boolean;
  onActualizar: () => void;
}

/**
 * "Datos de las 10:42": de cuándo son las cifras en pantalla, y el botón para
 * volver a leerlas de FileMaker con el mismo rango. No toca columnas, filtros
 * ni vistas: solo trae los registros otra vez. Pasados 15 minutos lo dice
 * ("hace 25 min") y el ícono toma el azul que actúa.
 */
const ActualizarDatos = ({ cargadoEn, estaCargando, onActualizar }: ActualizarDatosProps) => {
  // Reloj de minuto: el "hace N min" avanza aunque nada más cambie.
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), 60_000);
    return () => clearInterval(intervalo);
  }, []);

  if (!cargadoEn && !estaCargando) return null;

  const minutos = cargadoEn ? Math.floor((ahora - cargadoEn.getTime()) / 60_000) : 0;
  const viejos = minutos >= MINUTOS_PARA_VIEJOS;
  // Sin una carga previa no hay nada que "actualizar": es la primera lectura.
  const texto = estaCargando
    ? cargadoEn
      ? "Actualizando…"
      : "Cargando datos…"
    : `Datos de las ${hora.format(cargadoEn!)}${viejos ? ` · hace ${antiguedad(minutos)}` : ""}`;

  return (
    <button
      type="button"
      onClick={() => {
        if (!estaCargando) onActualizar();
      }}
      // aria-disabled y no disabled: mientras carga sigue enfocable (DESIGN.md).
      aria-disabled={estaCargando || undefined}
      aria-label={
        estaCargando ? (cargadoEn ? "Actualizando datos" : "Cargando datos") : `${texto}. Actualizar datos`
      }
      className={`group shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 pointer-coarse:min-h-10 text-sm whitespace-nowrap tabular-nums transition-colors hover:bg-blue-50 hover:text-blue-700 aria-disabled:cursor-wait aria-disabled:hover:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        viejos ? "font-medium text-gray-900" : "text-gray-600"
      }`}
    >
      <RefreshCw
        aria-hidden="true"
        className={`h-4 w-4 shrink-0 ${estaCargando ? "animate-spin motion-reduce:animate-none" : ""} ${
          viejos ? "text-blue-600" : "text-gray-500 group-hover:text-blue-600"
        }`}
      />
      {texto}
    </button>
  );
};

export default ActualizarDatos;
