import { LineaEstado, NotaRegistros, SeccionEstado } from "../shared/EstadoKpi";
import type { TotalesVentas } from "./useTotalesVentas";
import type { VentasRouteType } from "./ReporteVentas";

interface KpiPanelVentasProps {
  totales: TotalesVentas;
  currentType: VentasRouteType;
  registros: number;
  filtrado: boolean;
}

// Cancelaciones y devoluciones llegan en negativo: el neto es la suma visible
// de los tres renglones de arriba.
const KpiPanelVentas = ({ totales, currentType, registros, filtrado }: KpiPanelVentasProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-x-8 gap-y-5">
    <NotaRegistros registros={registros} filtrado={filtrado} />

    <SeccionEstado
      titulo="Importes"
      nota="Solo cuenta importes positivos y los negativos de facturas canceladas o con devolución; por eso puede diferir del total al pie de la tabla."
    >
      <LineaEstado etiqueta="Facturado" valor={totales.totalVentas} />
      <LineaEstado etiqueta="Cancelaciones" valor={totales.totalCancelaciones} />
      <LineaEstado etiqueta="Devoluciones" valor={totales.totalDevoluciones} />
      <LineaEstado etiqueta="Facturación neta" valor={totales.facturacionNeta} total />
    </SeccionEstado>

    {currentType === "facturas" ? (
      <SeccionEstado titulo="Facturas">
        <LineaEstado etiqueta="Vigentes" valor={totales.facturasVigentes} tipo="unidades" />
        <LineaEstado etiqueta="Pagadas" valor={totales.facturasPagadas} tipo="unidades" />
        <LineaEstado etiqueta="Vencidas" valor={totales.facturasVencidas} tipo="unidades" />
        <LineaEstado etiqueta="Canceladas" valor={totales.facturasCanceladas} tipo="unidades" />
        <LineaEstado etiqueta="Con devolución" valor={totales.devoluciones} tipo="unidades" />
      </SeccionEstado>
    ) : (
      <SeccionEstado titulo="Rentabilidad">
        <LineaEstado etiqueta="Costo directo" valor={totales.costoDirecto} />
        <LineaEstado etiqueta="Ganancia bruta" valor={totales.gananciaBruta} />
      </SeccionEstado>
    )}
  </div>
);

export default KpiPanelVentas;
