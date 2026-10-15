import Ajv2020 from 'ajv/dist/2020';
import { RawRecord } from '../../../filemaker/ifilemaker';
import type { ReportBankRecord, BankMappedRecord } from '../../domain/banks';
import schema from './bank-report.schema.json';

import { getPortalRows, TypeGetters } from '../../../common/utils';
import { resolveMovimiento } from './banks.movement.utils';
import { mapBankRecordWithCleanKeys } from './bank-field-map.helper';

const { getString, getNumber } = TypeGetters;

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateBankRecord = ajv.compile(schema);

const BASE_BANK_DEFAULTS: ReportBankRecord = {
  idTransaccionBanco: 0,
  fecha: '',
  formaPago: '',
  concepto: '',
  abono: 0,
  cargo: 0,
  saldoPorComplementar: 0,
  tipoDeCambio: 0,
  saldoPorIdentificar: 0,
  saldoBanco: 0,
  textoComplementario: '',
  nombre_banco: '',
  numero_cuenta: '',
  moneda: '',
  estadoIngreso: '',
  estadoEgreso: '',
  nombre_comercial: '',
  rfc: '',
};

function assertBankRecord(record: RawRecord, index: number): void {
  if (validateBankRecord(record)) {
    return;
  }

  const details = ajv.errorsText(validateBankRecord.errors, {
    separator: '; ',
    dataVar: `rawData[${index}]`,
  });

  throw new Error(`Bank record invalido: ${details}`);
}

/**
 * Limpia y transforma los datos crudos de FileMaker en un formato adecuado para el reporte de bancos.
 * @param rawData Un array de registros crudos obtenidos de FileMaker, cada uno con su estructura de campos y portales.
 * @returns Un array de registros limpios y transformados para el reporte de bancos.
 */
export function cleanData(rawData: RawRecord[]): ReportBankRecord[] {
  const cleanedData = rawData.map((record: RawRecord, index: number) => {
    assertBankRecord(record, index);

    const mappedRecord: BankMappedRecord = mapBankRecordWithCleanKeys(record);
    const portals: Record<string, unknown> | null = record.portalData || null;

    const cleanedRecord: ReportBankRecord = {
      ...BASE_BANK_DEFAULTS,
      fecha: getString(mappedRecord.fecha),
      formaPago: getString(mappedRecord.formaPago),
      cuentaContable: getString(mappedRecord.banco?.cuentaContable),
      idTransaccionBanco: getNumber(mappedRecord.idTransaccionBanco),
      concepto: getString(mappedRecord.concepto),
      abono: getNumber(mappedRecord.abono),
      cargo: getNumber(mappedRecord.cargo),
      saldoPorComplementar: getNumber(mappedRecord.saldoPorComplementar),
      tipoDeCambio: getNumber(mappedRecord.tipoDeCambio),
      saldoPorIdentificar: getNumber(mappedRecord.saldoPorIdentificar),
      saldoBanco: getNumber(mappedRecord.saldoBanco),
      textoComplementario: getString(mappedRecord.textoComplementario),
    };

    const banco = mappedRecord.banco;
    const ingreso = mappedRecord.ingreso;
    const egreso = mappedRecord.egreso;
    const clienteIngresoMap = mappedRecord.cliente?.ingreso ?? null;
    const clienteEgresoMap = mappedRecord.cliente?.egreso ?? null;
    const proveedorIngresoMap = mappedRecord.proveedor?.ingreso ?? null;
    const proveedorEgresoMap = mappedRecord.proveedor?.egreso ?? null;

    const datosBanco = getPortalRows(portals, 'Banco');
    const ingresos = getPortalRows(portals, 'contIngreso');
    const egresos = getPortalRows(portals, 'contEgreso');
    const clientePorIngresos = getPortalRows(portals, 'clienteIngreso');
    const clientePorEgresos = getPortalRows(portals, 'clienteEgreso');
    const proveedorPorIngresos = getPortalRows(portals, 'proveedorIngreso');
    const proveedorPorEgresos = getPortalRows(portals, 'proveedorEgreso');

    if (datosBanco.length > 0) {
      cleanedRecord.nombre_banco =
        banco?.nombre && mappedRecord.idBanco !== 0
          ? getString(banco?.nombre)
          : 'Nota de credito' + getString(ingreso?.notaCreditoSerieFolio);
      cleanedRecord.numero_cuenta = getString(banco?.cuentaNumero);
      cleanedRecord.cuentaContable = getString(banco?.cuentaContable);

      cleanedRecord.moneda =
        banco?.moneda && mappedRecord.idBanco !== 0
          ? getString(banco?.moneda)
          : 'MXN';
    }

    if (ingresos.length > 0) {
      const estadoIngreso = getString(ingreso?.estado);
      const estadoIngresoAlt = getString(ingreso?.estadoAlt);
      cleanedRecord.estadoIngreso = estadoIngreso || estadoIngresoAlt || 'N/A';
    }

    if (egresos.length > 0) {
      const estadoEgreso = getString(egreso?.estado);
      const estadoEgresoAlt = getString(egreso?.estadoAlt);
      cleanedRecord.estadoEgreso = estadoEgreso || estadoEgresoAlt || 'N/A';
    }

    const clienteTipoMovimiento = resolveMovimiento(
      clientePorIngresos,
      clientePorEgresos,
    );
    if (clienteTipoMovimiento) {
      const clienteSeleccionado =
        clienteTipoMovimiento === 'ingreso'
          ? clienteIngresoMap
          : clienteEgresoMap;
      cleanedRecord.nombre_comercial = getString(
        clienteSeleccionado?.nombreComercial,
      );
      cleanedRecord.rfc = getString(clienteSeleccionado?.rfc);
    }

    const proveedorTipoMovimiento = resolveMovimiento(
      proveedorPorIngresos,
      proveedorPorEgresos,
    );

    if (proveedorTipoMovimiento) {
      const proveedorSeleccionado =
        proveedorTipoMovimiento === 'ingreso'
          ? proveedorIngresoMap
          : proveedorEgresoMap;
      cleanedRecord.nombre_comercial = getString(
        proveedorSeleccionado?.nombreComercial,
      );
      cleanedRecord.rfc = getString(proveedorSeleccionado?.rfc);
    }

    return cleanedRecord;
  });
  return cleanedData;
}
