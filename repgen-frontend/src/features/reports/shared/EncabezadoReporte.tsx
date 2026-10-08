import type { ReactNode } from "react";
import { createPortal } from "react-dom";

import { useNavbarSlot } from "../../../app/layout/navbarSlotContext";

interface EncabezadoReporteProps {
  titulo: string;
  encabezadoExtra?: ReactNode;
}

/**
 * Encabezado del reporte (título + extras como los tabs de Ventas). Se monta
 * en el slot central del Navbar vía portal; el rango de fechas vive aparte en
 * FiltroFechas, dentro de la barra de controles de la tabla.
 */
const EncabezadoReporte = ({ titulo, encabezadoExtra }: EncabezadoReporteProps) => {
  // Layout provee el elemento del slot por contexto. Es null si el Layout no
  // está montado (tests).
  const slotNavbar = useNavbarSlot();

  const encabezado = (
    <div className="flex flex-wrap items-center gap-3 min-w-0">
      <h2 className="text-lg font-bold text-gray-800 truncate sm:text-xl">
        {titulo}
      </h2>
      {encabezadoExtra ? (
        <div className="shrink-0">{encabezadoExtra}</div>
      ) : null}
    </div>
  );

  if (slotNavbar) {
    return createPortal(encabezado, slotNavbar);
  }

  // Fallback inline: mismo encabezado sobre el contenido cuando el slot del
  // Navbar no existe (por ejemplo en tests que montan el reporte solo).
  return <div className="flex flex-col p-4 pt-4 pb-2 gap-4">{encabezado}</div>;
};

export default EncabezadoReporte;
