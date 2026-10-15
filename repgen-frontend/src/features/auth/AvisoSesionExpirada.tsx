import { useEffect, useRef } from "react";
import { Clock } from "lucide-react";
import { EVENTO_SESION_EXPIRADA } from "../../shared/api/http";

/**
 * Aviso de sesión expirada. No recarga la página: los registros ya cargados
 * siguen en pantalla y se pueden filtrar y exportar (todo es local). `<dialog>`
 * nativo: atrapa el foco y se cierra con Escape.
 */
const AvisoSesionExpirada = () => {
  const dialogoRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const abrir = () => {
      const dialogo = dialogoRef.current;
      if (dialogo && !dialogo.open) dialogo.showModal?.();
    };
    window.addEventListener(EVENTO_SESION_EXPIRADA, abrir);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, abrir);
  }, []);

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby="sesion-expirada-titulo"
      className="m-auto w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-2xl backdrop:bg-gray-900/60 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 rounded-full bg-blue-50 p-2.5">
          <Clock className="h-5 w-5 text-blue-600" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 id="sesion-expirada-titulo" className="text-lg font-bold text-gray-800">
            Tu sesión expiró
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Los registros que ya están en pantalla siguen disponibles: puedes
            filtrarlos y exportarlos. Para consultar otras fechas, vuelve a abrir
            el reporte desde FileMaker.
          </p>
        </div>
      </div>
      <form method="dialog" className="mt-6 flex justify-end">
        <button
          type="submit"
          autoFocus
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-marca-morado focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
        >
          Entendido
        </button>
      </form>
    </dialog>
  );
};

export default AvisoSesionExpirada;
