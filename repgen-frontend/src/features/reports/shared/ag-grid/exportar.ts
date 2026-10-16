import type { AgGridReact } from "ag-grid-react";
import toast from "react-hot-toast";

export const exportarDatos = (
  referenciaGrid: React.RefObject<AgGridReact | null>,
  nombreArchivo: string,
): React.MouseEventHandler<HTMLButtonElement> => {
  return () => {
    const api = referenciaGrid.current?.api;
    if (api) {
      const registros = api.getDisplayedRowCount();
      if (registros === 0) {
        toast.error("No hay registros que exportar con estas fechas y filtros.");
        return;
      }
      // Un importe sin su moneda en Excel parece pesos: si la columna de moneda
      // de un importe visible está oculta, se agrega al final del archivo.
      const visibles = api.getAllDisplayedColumns();
      const campos = new Set(visibles.map((c) => c.getColDef().field));
      const monedasOcultas = [
        ...new Set(
          visibles
            .map((c) => (c.getColDef().context as { campoMoneda?: string } | undefined)?.campoMoneda)
            .filter((campo): campo is string => !!campo && !campos.has(campo)),
        ),
      ]
        .map((campo) => api.getColumns()?.find((c) => c.getColDef().field === campo))
        .filter((c) => c !== undefined);
      api.exportDataAsCsv({
        // El nombre ya trae el rango aplicado (reporte_x_2026-09-01_a_2026-09-30).
        fileName: `${nombreArchivo}.csv`,
        allColumns: false,
        columnKeys: monedasOcultas.length ? [...visibles, ...monedasOcultas] : undefined,
        // La fila de totales no viaja: en Excel un SUM() la contaría dos veces.
        skipPinnedBottom: true,
        // Valor crudo, no el formateado ("$1,234.50"): Excel lo toma como número.
        processCellCallback: ({ value }) => value ?? "",
      });
      const nota = monedasOcultas.length
        ? ` (con ${monedasOcultas.map((c) => c.getColDef().headerName).join(", ")}, que estaba oculta)`
        : "";
      // Qué se llevó, dicho para todos (antes solo lo oía el lector de pantalla).
      const columnas = visibles.length + monedasOcultas.length;
      toast.success(
        `${registros.toLocaleString("es-MX")} ${registros === 1 ? "registro exportado" : "registros exportados"} a ${nombreArchivo}.csv: ${columnas} ${columnas === 1 ? "columna" : "columnas"}${nota}, sin la fila de totales`,
      );
    }
  };
};
