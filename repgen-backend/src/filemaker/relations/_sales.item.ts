export const sales_item_relations = {
  bodega: {
    _: `venta.itm|BODEGA_|_x_ventaID`,
  },
  cliente: {
    _: `venta.itm|CLIENTE_|_x_ventaID`,
    Classify1: `venta.itm|cliente.classify1|_x_ventaID`,
    Classify2: `venta.itm|cliente.classify2|_x_ventaID`,
    Classify3: `venta.itm|cliente.classify3|_x_ventaID`,
    Classify4: `venta.itm|cliente.classify4|_x_ventaID`,
  },
  DEVO: {
    contIngreso: `venta.itm|devo.contIngreso_|_x_devoID`,
    devoITM: `venta.itm|devo.devoITM_|_x_devoID`,
    venta: `venta.itm|devo.venta_|_x_ventaID`,
  },
  inv: {
    ITM: {
      classify1: `venta.itm|inv.ITM.classify1|_x_invItmID`,
      classify2: `venta.itm|inv.ITM.classify2|_x_invItmID`,
      classify3: `venta.itm|inv.ITM.classify3|_x_invItmID`,
      classify4: `venta.itm|inv.ITM.classify4|_x_invItmID`,
      _: `venta.itm|inv.ITM_|_x_invItmID`,
      _pref: `venta.itm|invITM._pref.invITM|_x_tenent`,
    },
  },
  LOT: {
    _: `venta.itm|LOT_|_x_lotProdIDU`,
  },
  poFACTURA: {
    _: `venta.itm|poFACTURA_|_x_poItmIDU`,
  },
  repVENTA: {
    _: `venta.itm|repVENTA_|_x_ventaID`,
  },
  sat: {
    PS: `venta.itm|sat.PS|_x_invItmID`,
    UNITventa: `venta.itm|sat.UNITventa_|_x_invItmID`,
  },
  USER: {
    _id_userRec: `venta.itm|USER_|_x_id_userRec`,
    _ventaID: `venta.itm|USER_|_x_ventaID`,
  },
  venta: {
    _: `venta.itm|VENTA_|_x_ventaID`,
    prefClassify: `venta.itm|venta.prefClassify|_x_ventaID`,
  },
};
