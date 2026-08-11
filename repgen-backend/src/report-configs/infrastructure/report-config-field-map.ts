export const reportConfigFieldMap = {
  id: '_id_configRec',
  userId: '_idu_userRec',
  reportId: 'configReporte_idReporte',
  name: 'configReporte_nombre',
  columnState: 'configReporte_columnsJSON',
  isDefault: 'configReporte_esDefault',
  createdAt: 'configReporte_fechaCreacion',
  updatedAt: 'configReporte_fechaModificacion',
} as const;

export const REPORT_CONFIG_LAYOUT = 'api_configReporte';
