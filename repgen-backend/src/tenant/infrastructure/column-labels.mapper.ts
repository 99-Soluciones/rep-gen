import type {
  ColumnLabelsRecord,
  ColumnLabelsResponse,
} from '../domain/column-labels';

const empty = (value?: string): string => value?.trim() ?? '';

export function mapColumnLabelsRecord(
  record: ColumnLabelsRecord,
): ColumnLabelsResponse {
  return {
    cliente: {
      clasificacion1: empty(record.clienteClasificacion1),
      clasificacion2: empty(record.clienteClasificacion2),
      clasificacion3: empty(record.clienteClasificacion3),
      clasificacion4: empty(record.clienteClasificacion4),
    },
    articulo: {
      categoria1: empty(record.invClasificacion1),
      categoria2: empty(record.invClasificacion2),
      categoria3: empty(record.invClasificacion3),
      categoria4: empty(record.invClasificacion4),
    },
  };
}
