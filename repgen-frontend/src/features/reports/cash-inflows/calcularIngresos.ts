import type { ReportCashInflowRecord, TipoRenglonIngreso } from "@repgen/shared-types";

export interface TotalesIngresos {
  /** Todo lo que entró en el periodo (MXN). */
  total: number;
  aplicado: number;
  sinAplicar: number;
  noIdentificado: number;
  /** Total por banco, de mayor a menor. */
  porBanco: { banco: string; monto: number }[];
}

const centavos = (n: number) => Math.round(n * 100) / 100;

const CAMPO: Record<TipoRenglonIngreso, "aplicado" | "sinAplicar" | "noIdentificado"> = {
  "Pago aplicado": "aplicado",
  "Pago sin aplicar": "sinAplicar",
  "Pago no identificado": "noIdentificado",
};

/**
 * Ingresos del periodo por tipo de renglón y por banco. Vale para las dos
 * vistas: en la de conceptos el pago ya viene repartido entre sus renglones.
 */
export const calcularTotalesIngresos = (filas: ReportCashInflowRecord[]): TotalesIngresos => {
  const t = { total: 0, aplicado: 0, sinAplicar: 0, noIdentificado: 0 };
  const bancos = new Map<string, number>();
  for (const fila of filas) {
    const monto = fila.pagoGranTotalMxn || 0;
    t.total += monto;
    t[CAMPO[fila.tipoRenglon]] += monto;
    const banco = fila.bancoNombre || "Sin banco";
    bancos.set(banco, (bancos.get(banco) ?? 0) + monto);
  }
  return {
    total: centavos(t.total),
    aplicado: centavos(t.aplicado),
    sinAplicar: centavos(t.sinAplicar),
    noIdentificado: centavos(t.noIdentificado),
    porBanco: [...bancos]
      .map(([banco, monto]) => ({ banco, monto: centavos(monto) }))
      .sort((a, b) => b.monto - a.monto || a.banco.localeCompare(b.banco, "es")),
  };
};

/** Cifra principal: lo que usa la comparación con el periodo anterior. */
export const totalIngresos = (filas: ReportCashInflowRecord[]) => calcularTotalesIngresos(filas).total;
