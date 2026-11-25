import type { ColDef, ColGroupDef } from "ag-grid-community";
import type { ColumnContext } from "./construir-columnas";

/**
 * Las columnas agrupadas por sección consecutiva (Cliente, Factura, Banco…)
 * para la franja sobre los encabezados. `marryChildren`: una columna no se
 * puede arrastrar fuera de su sección.
 */
export const agruparPorSeccion = <T>(columnas: ColDef<T>[]): ColGroupDef<T>[] =>
  columnas.reduce<ColGroupDef<T>[]>((grupos, columna) => {
    const seccion = (columna.context as ColumnContext).claseColumna;
    const ultimo = grupos.at(-1);
    if (ultimo?.headerName === seccion) ultimo.children.push(columna);
    else grupos.push({ headerName: seccion, groupId: seccion, marryChildren: true, children: [columna] });
    return grupos;
  }, []);
