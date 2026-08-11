import type { AgGridReact } from "ag-grid-react";

export const exportarDatos = (
  referenciaGrid: React.RefObject<AgGridReact | null>,
  nombreArchivo: string,
): React.MouseEventHandler<HTMLButtonElement> => {
  return () => {
    if (referenciaGrid.current) {
      referenciaGrid.current.api.exportDataAsCsv({
        fileName: `${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.csv`,
        allColumns: false,
      });
    }
  };
};
