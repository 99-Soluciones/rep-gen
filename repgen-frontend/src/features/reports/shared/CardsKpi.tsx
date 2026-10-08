type ColorKpi = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'gray' | 'navy' | 'emerald' | 'sky';

const CLASES_COLOR: Record<ColorKpi, { texto: string; iconoBg: string; iconoTexto: string }> = {
  blue:   { texto: 'text-blue-600',   iconoBg: 'bg-blue-50',   iconoTexto: 'text-blue-500' },
  navy:   { texto: 'text-blue-700',   iconoBg: 'bg-blue-100',   iconoTexto: 'text-blue-600' },
  sky:    { texto: 'text-sky-600',    iconoBg: 'bg-sky-50',    iconoTexto: 'text-sky-500' },
  green:  { texto: 'text-green-600',  iconoBg: 'bg-green-50',  iconoTexto: 'text-green-500' },
  emerald: { texto: 'text-emerald-600', iconoBg: 'bg-emerald-50', iconoTexto: 'text-emerald-500' },
  yellow: { texto: 'text-yellow-600', iconoBg: 'bg-yellow-50', iconoTexto: 'text-yellow-500' },
  red:    { texto: 'text-red-600',    iconoBg: 'bg-red-50',    iconoTexto: 'text-red-500' },
  purple: { texto: 'text-purple-600', iconoBg: 'bg-purple-50', iconoTexto: 'text-purple-500' },
  orange: { texto: 'text-orange-600', iconoBg: 'bg-orange-50', iconoTexto: 'text-orange-500' },
  gray:   { texto: 'text-gray-600',   iconoBg: 'bg-gray-50',   iconoTexto: 'text-gray-500' },
};

interface CardsKpiProps {
  titulo: string;
  valor: {
    cantidad: number;
    tipo: 'moneda' | 'porcentaje' | 'unidades';
    tipoDeUnidades?: string;
  };
  color: { positivo: ColorKpi; negativo: ColorKpi };
  icono: React.ReactNode;
}

const formatValor = ({ cantidad, tipo, tipoDeUnidades }: CardsKpiProps['valor']): string => {
  switch (tipo) {
    case 'moneda':
      return cantidad.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    case 'porcentaje':
      return cantidad.toLocaleString('es-MX', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    case 'unidades':
      return `${cantidad.toLocaleString('es-MX')} ${tipoDeUnidades ?? ''}`.trim();
  }
};

const CardsKpi = ({
  titulo,
  valor,
  color,
  icono,
}: CardsKpiProps) => {
  const clases =
    valor.cantidad >= 0 ? CLASES_COLOR[color.positivo] : CLASES_COLOR[color.negativo];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 sm:px-4 sm:py-3 flex items-center justify-between">
      <div className="flex-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {titulo}
        </p>
        <p className={`text-lg sm:text-xl font-bold mt-0.5 ${clases.texto}`}>
          {formatValor(valor)}
        </p>
      </div>
      <div className={`p-2.5 rounded-full ${clases.iconoBg}`}>
        <svg
          className={`w-5 h-5 ${clases.iconoTexto}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {icono}
        </svg>
      </div>
    </div>
  );
};

export default CardsKpi;
