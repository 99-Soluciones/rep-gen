// Contratos de API compartidos entre repgen-backend y repgen-frontend.
// Solo tipos: este paquete no tiene (ni debe tener) codigo en runtime.
// El campo "exports" solo expone la condicion "types", asi que cualquier
// import de valor (no type-only) falla en compilacion a proposito.

/** Estado de una columna de AG Grid persistido en una configuracion de reporte. */
export interface ColumnStateEntry {
  colId: string;
  hide?: boolean;
  width?: number;
  sort?: 'asc' | 'desc' | null;
  sortIndex?: number | null;
  pinned?: 'left' | 'right' | null;
  aggFunc?: string | null;
}

/** Configuracion de columnas de un reporte tal como la expone la API. */
export interface ReportConfigResponse {
  id: string;
  reportId: string;
  name: string;
  columnState: ColumnStateEntry[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Etiquetas de columnas personalizadas por tenant (GET /tenant/column-labels). */
export interface ColumnLabelsResponse {
  cliente: {
    clasificacion1: string;
    clasificacion2: string;
    clasificacion3: string;
    clasificacion4: string;
  };
  articulo: {
    categoria1: string;
    categoria2: string;
    categoria3: string;
    categoria4: string;
  };
}

/** Features habilitadas para el tenant (GET /tenant/features). */
export interface TenantFeaturesResponse {
  reportConfigs: boolean;
}
