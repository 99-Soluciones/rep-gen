export const sales_relations = {
  preferenciasCliente: { _: `venta_|_prefCLIENTE|x` },
  bodega: { _: `venta_|BODEGA_|_x_bodegaID` },
  cliente: {
    _: `venta_|CLIENTE_|_x_clienteID`,
    Classify1: `venta_|cliente.Classify1|_x_clienteID`,
    Classify2: `venta_|cliente.Classify2|_x_clienteID`,
    Classify3: `venta_|cliente.Classify3|_x_clienteID`,
    Classify4: `venta_|cliente.Classify4|_x_clienteID`,
  },
  DEVO: {
    contINGRESO: `venta_|DEVO.contINGRESO_|_x_id_devo`,
    _: `venta_|DEVO_|_x_ventaID`,
  },
  USER: {
    repCobranza: `venta_|USER.repCobranza_|_x_clienteID`,
    repVent: `venta_|USER.repVent_|_x_clienteID`,
    _: `venta_|USER_|_x_repVent`,
  },
};
