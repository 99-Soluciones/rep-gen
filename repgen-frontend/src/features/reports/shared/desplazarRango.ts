import type { Rango } from "./ConfiguracionesColumnas/vista";

const leer = (iso: string) => {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
};
const escribir = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
const ultimoDia = (anio: number, mes: number) => new Date(anio, mes + 1, 0).getDate();
const minimo = (a: string, b: string) => (a < b ? a : b);

/**
 * Las flechas ‹ › junto a las fechas: el periodo anterior o siguiente del
 * mismo tamaño, como se navega un estado de cuenta.
 * - Un mes (completo, o del 1 a hoy): el mes entero de al lado; el mes en
 *   curso llega hasta hoy. ‹ desde "Mes actual" da el mes anterior completo.
 * - Un año (completo, o del 1 de enero a hoy): el año de al lado.
 * - Cualquier otro rango: los mismos días, corridos.
 * Nunca pasa de hoy: null cuando el periodo siguiente aún no empieza.
 */
export const desplazarRango = ({ desde, hasta }: Rango, direccion: -1 | 1, hoy = new Date()): Rango | null => {
  const hoyIso = escribir(hoy);
  const inicio = leer(desde);
  const fin = leer(hasta);
  const mismoMes = inicio.getFullYear() === fin.getFullYear() && inicio.getMonth() === fin.getMonth();
  const finDeMes = fin.getDate() === ultimoDia(fin.getFullYear(), fin.getMonth());

  if (inicio.getDate() === 1 && mismoMes && (finDeMes || hasta === hoyIso)) {
    const destino = new Date(inicio.getFullYear(), inicio.getMonth() + direccion, 1);
    const nuevoDesde = escribir(destino);
    if (nuevoDesde > hoyIso) return null;
    const finDestino = escribir(new Date(destino.getFullYear(), destino.getMonth(), ultimoDia(destino.getFullYear(), destino.getMonth())));
    return { desde: nuevoDesde, hasta: minimo(finDestino, hoyIso) };
  }

  const mismoAnio = inicio.getFullYear() === fin.getFullYear();
  const finDeAnio = fin.getMonth() === 11 && fin.getDate() === 31;
  if (inicio.getMonth() === 0 && inicio.getDate() === 1 && mismoAnio && (finDeAnio || hasta === hoyIso)) {
    const anio = inicio.getFullYear() + direccion;
    const nuevoDesde = `${anio}-01-01`;
    if (nuevoDesde > hoyIso) return null;
    return { desde: nuevoDesde, hasta: minimo(`${anio}-12-31`, hoyIso) };
  }

  const dias = Math.round((fin.getTime() - inicio.getTime()) / 86_400_000) + 1;
  const nuevoInicio = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + dias * direccion);
  const nuevoFin = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate() + dias * direccion);
  const nuevoDesde = escribir(nuevoInicio);
  if (nuevoDesde > hoyIso) return null;
  return { desde: nuevoDesde, hasta: minimo(escribir(nuevoFin), hoyIso) };
};
