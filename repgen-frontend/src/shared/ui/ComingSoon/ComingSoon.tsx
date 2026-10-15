import { Hourglass } from "lucide-react";
import { Link } from "react-router-dom";

interface ComingSoonProps {
  titulo?: string;
  mensaje?: string;
}

/**
 * Estado vacío para reportes que aún no existen: una hoja blanca del sistema
 * (DESIGN.md), sin degradados ni animación, con un camino de salida concreto.
 */
const ComingSoon = ({
  titulo = "Este reporte aún no está disponible",
  mensaje = "Mientras tanto, puedes consultar Bancos y Ventas desde el menú.",
}: ComingSoonProps) => (
  <div className="flex min-h-full items-center justify-center p-6">
    <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
        <Hourglass className="h-6 w-6 text-blue-600" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-bold text-gray-800">{titulo}</h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{mensaje}</p>
      <Link
        to="/bancos"
        className="mt-6 inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Ir a Bancos
      </Link>
    </div>
  </div>
);

export default ComingSoon;
