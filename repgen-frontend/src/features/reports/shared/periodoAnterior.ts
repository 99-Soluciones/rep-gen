import type { Rango } from "./ConfiguracionesColumnas/vista";

// Fechas "YYYY-MM-DD" en hora local, sin pasar por UTC (como el resto de la app).
const leer = (iso: string) => {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
};
const escribir = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
const ultimoDia = (anio: number, mes: number) => new Date(anio, mes + 1, 0).getDate();

/**
 * El periodo con el que se compara el rango cargado, como lo leería finanzas:
 * - Desde el día 1 y dentro del mismo mes (mes actual, mes anterior, una
 *   quincena): los mismos días del mes anterior. 1–15 oct → 1–15 sep;
 *   1–31 oct → 1–30 sep.
 * - Desde el 1 de enero y dentro del mismo año (año en curso): el mismo tramo
 *   del año anterior.
 * - Cualquier otro rango: el mismo número de días justo antes.
 */
export const periodoAnterior = ({ desde, hasta }: Rango): Rango => {
  const inicio = leer(desde);
  const fin = leer(hasta);
  const mismoMes = inicio.getFullYear() === fin.getFullYear() && inicio.getMonth() === fin.getMonth();

  if (inicio.getDate() === 1 && mismoMes) {
    const anio = inicio.getMonth() === 0 ? inicio.getFullYear() - 1 : inicio.getFullYear();
    const mes = (inicio.getMonth() + 11) % 12;
    // Mes completo → mes anterior completo; si no, el mismo día, o el último si no existe.
    const diaFin = fin.getDate() === ultimoDia(fin.getFullYear(), fin.getMonth())
      ? ultimoDia(anio, mes)
      : Math.min(fin.getDate(), ultimoDia(anio, mes));
    return { desde: escribir(new Date(anio, mes, 1)), hasta: escribir(new Date(anio, mes, diaFin)) };
  }

  if (inicio.getMonth() === 0 && inicio.getDate() === 1 && inicio.getFullYear() === fin.getFullYear()) {
    const anio = fin.getFullYear() - 1;
    const dia = Math.min(fin.getDate(), ultimoDia(anio, fin.getMonth()));
    return { desde: escribir(new Date(anio, 0, 1)), hasta: escribir(new Date(anio, fin.getMonth(), dia)) };
  }

  const dias = Math.round((fin.getTime() - inicio.getTime()) / 86_400_000);
  const finAnterior = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() - 1);
  const inicioAnterior = new Date(finAnterior.getFullYear(), finAnterior.getMonth(), finAnterior.getDate() - dias);
  return { desde: escribir(inicioAnterior), hasta: escribir(finAnterior) };
};
