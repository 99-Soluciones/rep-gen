export const banks_relations = {
  cliente: {
    egreso: `contBanco.ITM|CLIENTE.egreso|_x_bancoItmID`,
    ingreso: `contBanco.ITM|CLIENTE.ingreso|_x_bancoItmID`,
  },
  contBanco: { _: `contBanco.ITM|contBANCO_|_x_bancoID` },
  contEgreso: { _: `contBanco.ITM|contEGRESO_|_x_bancoItmID` },
  contIngreso: { _: `contBanco.ITM|contINGRESO_|_x_bancoItmID` },
  proveedor: {
    egreso: `contBanco.ITM|PROV.egreso|_x_bancoItmID`,
    ingreso: `contBanco.ITM|PROV.ingreso|_x_bancoItmID`,
  },
};
