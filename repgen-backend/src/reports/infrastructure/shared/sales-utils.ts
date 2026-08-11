import { DateFormatUtils } from '../../../common/utils';

export const CANCELED_STATUS = 'Cancelada';
export const RETURN_STATUS = 'Devolución';

export type DateRange = { startDate: string; endDate: string };

/**
 * Determina el estado de un CFDI (Comprobante Fiscal Digital por Internet) basado en su fecha, fecha de cancelación, días de crédito y monto de pago.
 * @param dateCDFI - La fecha de emisión del CFDI en formato string.
 * @param dateCancelled - La fecha de cancelación del CFDI en formato string, si aplica.
 * @param creditDays - Los días de crédito disponibles.
 * @param paymentAmount - El monto pagado.
 * @returns El estado del CFDI.
 */
export function stateCFDI(
  dateCDFI: string,
  dateCancelled: string,
  creditDays: number,
  paymentAmount: number,
): string {
  if (dateCancelled) {
    return CANCELED_STATUS;
  }

  if (paymentAmount === 0) {
    return 'Pagada';
  }

  const formatDate = DateFormatUtils.formatDateFMtoDMY(new Date(dateCDFI));
  const diasTranscurridos = DateFormatUtils.getDaysDifference(
    new Date(formatDate),
    new Date(),
  );

  if (creditDays > diasTranscurridos) {
    return 'Vigente';
  }

  return 'Vencida';
}

/**
 * Verifica si una fecha está dentro de un rango de fechas.
 * @param devoDate - La fecha a verificar.
 * @param startDate - La fecha de inicio del rango.
 * @param endDate - La fecha de fin del rango.
 * @returns true si la fecha está dentro del rango, false en caso contrario.
 */
export function inRangeDate(
  devoDate: string,
  startDate: string,
  endDate: string,
): boolean {
  if (!devoDate) return false;
  const devoTime = DateFormatUtils.formatDateToYMD(devoDate);
  return (
    new Date(devoTime).getTime() >= new Date(startDate).getTime() &&
    new Date(devoTime).getTime() <= new Date(endDate).getTime()
  );
}

export function safeDateInRange(
  value: string | undefined,
  range: DateRange,
): boolean {
  return !!value && inRangeDate(value, range.startDate, range.endDate);
}

export function normalizeExchangeRate(value: number): number {
  return value > 0 ? value : 1;
}

export function negate(value: number): number {
  return -1 * value;
}

export function extractSerieFolio(value: string): {
  serie: string;
  folio: string;
} {
  const [serie = '', folio = ''] = value.split('-');
  return { serie, folio };
}
