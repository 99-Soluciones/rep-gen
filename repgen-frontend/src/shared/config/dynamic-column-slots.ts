export const DYNAMIC_COLUMN_SLOTS = {
  cliente: [
    "clasificacion1",
    "clasificacion2",
    "clasificacion3",
    "clasificacion4",
  ],
  articulo: ["categoria1", "categoria2", "categoria3", "categoria4"],
} as const;

export type DynamicColumnSlot =
  | `cliente.${(typeof DYNAMIC_COLUMN_SLOTS.cliente)[number]}`
  | `articulo.${(typeof DYNAMIC_COLUMN_SLOTS.articulo)[number]}`;
