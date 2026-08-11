import { banks_relations as relations } from '../../../filemaker/relations';

export const bankFieldMapJson = {
  data: {
    idBanco: '_id_banco',
    fecha: '_fecha',
    formaPago: '_idu_formaPago_v0_22_1',
    concepto: 'mConceptoDeBancoTexto_v0_20_0',
    abono: 'monto_ORIG_abono_v0_22_1',
    cargo: 'monto_ORIG_cargo_v0_22_1',
    saldoPorComplementar: 'saldo_ORIG_porComplementar_v0_22_1',
    saldoPorIdentificar: 'saldo_ORIG_porID_v0_22_1',
    tipoDeCambio: 'tc_tipoCambioValor_v0_26_1',
    textoComplementario: 'mConciliacionTexto_parteDelCOMPLEMENTO_v0_22_1',
    idTransaccionBanco: '__id_bancoITM',
    saldoBanco: 'monto_ORIG_bancoRunningSaldo',
    banco: {
      nombre: `${relations.contBanco._}::datos_nombre`,
      cuentaNumero: `${relations.contBanco._}::datos_cuentaNumero`,
      moneda: `${relations.contBanco._}::_idu_moneda`,
      cuentaContable: `${relations.contBanco._}::cuentaContable_Temp_v0_20_2r`,
    },
    ingreso: {
      notaCreditoSerieFolio: `${relations.contIngreso._}::cfdiNotaCredOrCargo_SerieFolio_v0_20_2r`,
      estado: `${relations.contIngreso._}::isT_Abierto_Cerrado`,
      estadoAlt: `${relations.contIngreso._}::isT.Abierto|Cerrado`,
    },
    egreso: {
      notaCreditoSerieFolio: `${relations.contEgreso._}::cfdi_serieFolio_v0_18_1`,
      estado: `${relations.contEgreso._}::isT_Abierto_Cerrado`,
      estadoAlt: `${relations.contEgreso._}::isT.Abierto|Cerrado`,
    },
    cliente: {
      ingreso: {
        nombreComercial: `${relations.cliente.ingreso}::destLocal_dirNombreComercial`,
        rfc: `${relations.cliente.ingreso}::fiscal_RFC`,
      },
      egreso: {
        nombreComercial: `${relations.cliente.egreso}::destLocal_dirNombreComercial`,
        rfc: `${relations.cliente.egreso}::fiscal_RFC`,
      },
    },
    proveedor: {
      ingreso: {
        nombreComercial: `${relations.proveedor.ingreso}::local_NombreComercial`,
        rfc: `${relations.proveedor.ingreso}::fiscal_RFC`,
      },
      egreso: {
        nombreComercial: `${relations.proveedor.egreso}::local_NombreComercial`,
        rfc: `${relations.proveedor.egreso}::fiscal_RFC`,
      },
    },
  },
} as const;
