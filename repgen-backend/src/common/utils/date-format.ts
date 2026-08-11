export class DateFormatUtils {
  /**
   * Formatea una fecha al formato "YYYY-MM-DD".
   * @param date Fecha a formatear.
   * @returns Fecha formateada como string en formato "YYYY-MM-DD".
   */
  static formatDateToYMD(date: string): string {
    // const year = date.getFullYear();
    // const month = String(date.getMonth() + 1).padStart(2, '0');
    // const day = String(date.getDate()).padStart(2, '0');
    const [month, day, year] = date.split('/').map((part) => part.trim());
    return `${year}-${month}-${day}`;
  }
  /**
   * Formatea una fecha del formato Filemaker (MM/DD/YYYY) al formato "DD/MM/YYYY".
   * @param date Fecha a formatear.
   * @returns Fecha formateada como string en formato "DD/MM/YYYY".
   */
  static formatDateFMtoDMY(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  static formatDateFMtoDMYTimeStamp(dateInput: Date | string): string {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);

    const time = date.toTimeString().split(' ')[0];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}/${month}/${year} ${time}`;
  }

  /**
   * Calcula la diferencia en días entre dos fechas.
   * @param date1 Primera fecha.
   * @param date2 Segunda fecha.
   * @returns Diferencia en días entre las dos fechas.
   */
  static getDaysDifference(date1: Date, date2: Date): number {
    const timeDiff = date2.getTime() - date1.getTime();
    return Math.floor(timeDiff / (1000 * 3600 * 24));
  }
}
