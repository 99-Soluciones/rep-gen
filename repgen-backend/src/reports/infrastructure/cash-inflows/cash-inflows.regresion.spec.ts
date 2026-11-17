import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RawRecord } from '../../../filemaker/ifilemaker';
import type { ReportCashInflowRecord } from '@repgen/shared-types';
import type { DateRange } from '../shared/sales-utils';
import { cleanData } from './cash-inflows.mapper';

/*
 * Juego FABRICADO (no son capturas de FileMaker): cancelada con pago, nota de
 * crédito, anticipo, dólares, IEPS y retenciones. Protege contra regresiones;
 * no valida cómo trae FileMaker esos casos. Por eso vive en la ficha y no en
 * __golden__/.
 */
const carpeta = join(
  __dirname,
  '../../../../docs/reports/fichas/cash-inflows/segundo',
);
const leer = <T>(archivo: string): T =>
  JSON.parse(readFileSync(join(carpeta, archivo), 'utf8')) as T;

type Respuesta = { response: { data: RawRecord[] } };

describe('cash-inflows cleanData — regresión (juego fabricado)', () => {
  const pagos = leer<Respuesta>('entrada-pagos.json').response.data;
  const bancos = leer<Respuesta>('entrada-bancos.json').response.data;
  const rango = leer<DateRange>('rango.json');

  it.each(['factura', 'concepto'] as const)(
    'vista por %s: produce la salida esperada',
    (detalle) => {
      expect(cleanData(pagos, bancos, rango, detalle)).toEqual(
        leer<ReportCashInflowRecord[]>(`esperado-${detalle}.json`),
      );
    },
  );
});
