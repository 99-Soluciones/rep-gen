import { BadRequestException } from '@nestjs/common';
import { hoyEnMexico } from '../../../common/utils';

const esFechaValida = (iso: string): boolean => {
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
};

/** Fecha de corte de un reporte: hoy en México si falta; inválida o futura → 400. */
export function validarCorte(fechaCorte: string | undefined): string {
  const hoy = hoyEnMexico();
  const corte = fechaCorte ?? hoy;
  if (!esFechaValida(corte)) {
    throw new BadRequestException('fechaCorte no es una fecha válida');
  }
  if (corte > hoy) {
    throw new BadRequestException('fechaCorte no puede ser futura');
  }
  return corte;
}
