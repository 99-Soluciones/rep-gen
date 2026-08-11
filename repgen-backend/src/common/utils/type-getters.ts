export class TypeGetters {
  static getString = (value: unknown): string => {
    return typeof value === 'string' ? value : '';
  };

  static getNumber = (value: unknown): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };
}
