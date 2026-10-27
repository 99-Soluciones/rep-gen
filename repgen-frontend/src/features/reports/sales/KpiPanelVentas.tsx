import { LineaEstado, NotaRegistros, ResultadoResumen, SeccionEstado } from "../shared/EstadoKpi";
import type { ComparacionPeriodo } from "../shared/useComparacionPeriodo";
import type { TotalesVentas } from "./useTotalesVentas";
import type { VentasRouteType } from "./ReporteVentas";

interface KpiPanelVentasProps {
  totales: TotalesVentas;
  comparacion: ComparacionPeriodo;
  currentType: VentasRouteType;
  registros: number;
  total: number;
  desde: string;
  hasta: string;
}

// Cancelaciones y devoluciones llegan en negativo: el neto es la suma visible
// de los tres renglones de arriba.
const KpiPanelVentas = ({ totales, comparacion, currentType, registros, total, desde, hasta }: KpiPanelVentasProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-x-8 gap-y-5">
    <ResultadoResumen
      etiqueta="Facturación neta"
      valor={totales.facturacionNeta}
      comparacion={comparacion}
      filtrado={registros !== total}
    />
    <NotaRegistros registros={registros} total={total} desde={desde} hasta={hasta} />

    <SeccionEstado titulo="Importes">
      <LineaEstado etiqueta="Facturación bruta" valor={totales.totalVentas} />
      <LineaEstado etiqueta="Cancelaciones" valor={totales.totalCancelaciones} />
      <LineaEstado etiqueta="Devoluciones" valor={totales.totalDevoluciones} />
      <LineaEstado etiqueta="Facturación neta" valor={totales.facturacionNeta} total />
    </SeccionEstado>

    {currentType === "facturas" && (
      <SeccionEstado titulo="Importe">
        <LineaEstado etiqueta="Importe sin descuentos" valor={totales.importeSinDescuentos} />
      </SeccionEstado>
    )}

    {currentType === "facturas" ? (
      <SeccionEstado titulo="Facturas">
        <LineaEstado etiqueta="Vigentes" valor={totales.facturasVigentes} tipo="unidades" />
        <LineaEstado etiqueta="Pagadas" valor={totales.facturasPagadas} tipo="unidades" />
        <LineaEstado etiqueta="Vencidas" valor={totales.facturasVencidas} tipo="unidades" />
        <LineaEstado etiqueta="Canceladas" valor={totales.facturasCanceladas} tipo="unidades" />
        <LineaEstado etiqueta="Con devolución" valor={totales.devoluciones} tipo="unidades" />
      </SeccionEstado>
    ) : (
      // Como el resumen de FileMaker: los % salen del importe (una base en 0 no muestra %).
      <>
        <SeccionEstado titulo="Facturas">
          <LineaEstado etiqueta="Facturadas" valor={totales.facturas} tipo="unidades" />
        </SeccionEstado>
        <SeccionEstado titulo="Importe">
          <LineaEstado etiqueta="Sin descuentos" valor={totales.importeSinDescuentos} />
          <LineaEstado
            etiqueta="Descuentos"
            valor={-totales.descuentos}
            porcentaje={totales.descuentos / totales.importeSinDescuentos}
          />
          <LineaEstado etiqueta="Con descuentos" valor={totales.importeConDescuentos} total />
        </SeccionEstado>
        <SeccionEstado titulo="Rentabilidad">
          <LineaEstado
            etiqueta="Costo directo"
            valor={totales.costoDirecto}
            porcentaje={totales.costoDirecto / totales.importeConDescuentos}
          />
          <LineaEstado
            etiqueta="Ganancia bruta"
            valor={totales.gananciaBruta}
            porcentaje={totales.gananciaBruta / totales.importeConDescuentos}
            total
          />
        </SeccionEstado>
      </>
    )}
  </div>
);

export default KpiPanelVentas;
