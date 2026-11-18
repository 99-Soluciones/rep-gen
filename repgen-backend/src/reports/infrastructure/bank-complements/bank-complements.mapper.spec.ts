import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RawRecord } from '../../../filemaker/ifilemaker';
import { cleanData } from './bank-complements.mapper';
import schema from './bancos-complementos.schema.json';
import { COMP_EGRESO, EGRESO, INGRESO, MOV } from './bank-complements.fields';

/*
 * Reglas de la ficha que los datos dorados de octubre no cubren (no hubo
 * transferencias, egresos con REP ni pagos a clientes). Parte de la muestra
 * anonimizada de la ficha: 7388 (dos ingresos), 7360 (egreso sin
 * complementos) y 7526 (sin identificar).
 */
const MUESTRA = join(
  __dirname,
  '../../../../docs/reports/fichas/bank-complements/Bancos_Complementos_ResponseFM',
);
const muestra = (): RawRecord[] =>
  (
    JSON.parse(readFileSync(MUESTRA, 'utf8')) as {
      response: { data: RawRecord[] };
    }
  ).response.data;

const registro = (idBanco: number): RawRecord =>
  muestra().find((r) => r.fieldData[MOV.id] === idBanco)!;

type Fila = Record<string, unknown>;
const portal = (r: RawRecord, nombre: string) =>
  (r.portalData as Record<string, Fila[]>)[nombre];

/** Renglón de complemento de egreso con todas las llaves del schema vacías. */
const complementoEgreso = (valores: Fila): Fila => ({
  ...Object.fromEntries(
    schema.properties.portalData.properties.ComplementosEgreso.items.required.map(
      (k) => [k, ''],
    ),
  ),
  ...valores,
});

describe('bank-complements cleanData', () => {
  it('egreso con transferencia: "Transferencia a banco" con su id', () => {
    const r = registro(7360);
    Object.assign(portal(r, 'contEgreso')[0], {
      [EGRESO.transferenciaId]: 7400,
      [EGRESO.proveedorId]: '',
    });
    const [fila] = cleanData([r]);
    expect(fila).toMatchObject({
      tipoTransaccion: 'Transferencia a banco',
      bancoTransferenciaId: 7400,
      clienteProveedorId: null,
    });
  });

  it('ingreso con transferencia: "Transferencia desde banco"', () => {
    const r = registro(7388);
    Object.assign(portal(r, 'contIngreso')[0], {
      [INGRESO.transferenciaId]: 7401,
      [INGRESO.clienteId]: '',
    });
    expect(cleanData([r])[0].tipoTransaccion).toBe('Transferencia desde banco');
  });

  it('ingreso de un proveedor y egreso a un cliente', () => {
    const ing = registro(7388);
    Object.assign(portal(ing, 'contIngreso')[0], {
      [INGRESO.clienteId]: '',
      [INGRESO.proveedorId]: 12,
    });
    const egr = registro(7360);
    Object.assign(portal(egr, 'contEgreso')[0], {
      [EGRESO.proveedorId]: '',
      [EGRESO.clienteId]: 31,
    });
    const filas = cleanData([ing, egr]);
    expect(filas.find((f) => f.ingresoId)).toMatchObject({
      tipoTransaccion: 'Pago de proveedor',
      clienteProveedorId: 12,
    });
    expect(filas.find((f) => f.egresoId)).toMatchObject({
      tipoTransaccion: 'Pago a cliente',
      clienteProveedorId: 31,
    });
  });

  it('egreso con REP de proveedor: folio del REP y saldos de la conciliación', () => {
    const r = registro(7360);
    const egresoId = portal(r, 'contEgreso')[0][EGRESO.id];
    portal(r, 'ComplementosEgreso').push(
      complementoEgreso({
        [COMP_EGRESO.conciliacionId]: egresoId,
        [COMP_EGRESO.monto]: 1000.1,
        [COMP_EGRESO.repSerie]: 'P',
        [COMP_EGRESO.repFolio]: 77,
        [COMP_EGRESO.repUuid]: 'uuid-rep',
        [COMP_EGRESO.facturaSerie]: 'FB',
        [COMP_EGRESO.facturaFolio]: 12,
        [COMP_EGRESO.facturaMetodoPago]: 'PPD',
        [COMP_EGRESO.fecha]: '10/30/2026',
      }),
    );
    const [fila] = cleanData([r]);
    expect(fila).toMatchObject({
      pagoFolio: 'P-77',
      pagoUuid: 'uuid-rep',
      pagoFecha: '2026-10-30',
      facturaSerieFolio: 'FB-12',
      facturaMetodoPago: 'PPD',
      conciliacionMontoTotal: 2513.14,
      conciliacionMontoComplementado: 1000.1,
      conciliacionSaldoPorComplementar: 1513.04,
      ventaId: null,
    });
  });

  it('salto de línea de FileMaker en el concepto → espacio', () => {
    const r = registro(7526);
    (r.fieldData as Fila)[MOV.concepto] = 'PAGO FACTURA\r 3235  REF';
    expect(cleanData([r])[0].bancoConcepto).toBe('PAGO FACTURA 3235 REF');
  });

  it('movimiento sin conciliar: un renglón "Sin identificar" con todo en null', () => {
    const [fila, ...resto] = cleanData([registro(7526)]);
    expect(resto).toEqual([]);
    expect(fila).toMatchObject({
      tipoTransaccion: 'Sin identificar',
      ingresoId: null,
      clienteProveedor: null,
      pagoGranTotalMxn: null,
      facturaUuid: null,
    });
  });

  it('un registro sin un portal del layout es error, no filas vacías', () => {
    const r = registro(7360);
    delete (r.portalData as Record<string, unknown>).ComplementosEgreso;
    expect(() => cleanData([r])).toThrow('Bancos con complementos inválido');
  });
});
