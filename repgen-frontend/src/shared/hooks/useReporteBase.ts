import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { obtenerReporte } from "../api/reports-api";
import {
  obtenerFechaHoyFormateada,
  obtenerPrimerDiaDelMes,
} from "../utils/date-formatted";

interface UseReporteBaseParams {
  endpoint: string;
  initialLimit?: number;
  initialFechaDesde?: string;
  initialFechaHasta?: string;
  initialBusqueda?: string;
  initialModeloFiltros?: Record<string, unknown>;
  onError?: (error: unknown) => void;
}

interface UseReporteBaseState<T> {
  datos: T[];
  paginaActual: number;
  totalPaginas: number;
  totalElementos: number;
  estaCargando: boolean;
  textoBusqueda: string;
  setTextoBusqueda: Dispatch<SetStateAction<string>>;
  busquedaActiva: string;
  setBusquedaActiva: Dispatch<SetStateAction<string>>;
  fechaDesde: string;
  setFechaDesde: Dispatch<SetStateAction<string>>;
  fechaHasta: string;
  setFechaHasta: Dispatch<SetStateAction<string>>;
  modeloFiltros: Record<string, unknown>;
  setModeloFiltros: Dispatch<SetStateAction<Record<string, unknown>>>;
  limite: number;
  setLimite: Dispatch<SetStateAction<number>>;
  setPaginaActual: Dispatch<SetStateAction<number>>;
}

const buildRangoFechas = (fechaDesde: string, fechaHasta: string) => ({
  fechaInicio: fechaDesde,
  fechaFin: fechaHasta,
});

export const useReporteBase = <T,>({
  endpoint,
  initialLimit = 999999,
  initialFechaDesde = obtenerPrimerDiaDelMes(),
  initialFechaHasta = obtenerFechaHoyFormateada(),
  initialBusqueda = "",
  initialModeloFiltros = {},
  onError,
}: UseReporteBaseParams): UseReporteBaseState<T> => {
  const [datos, setDatos] = useState<T[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalElementos, setTotalElementos] = useState(0);
  const [estaCargando, setEstaCargando] = useState(false);

  const [textoBusqueda, setTextoBusqueda] = useState(initialBusqueda);
  const [busquedaActiva, setBusquedaActiva] = useState(initialBusqueda);
  const [fechaDesde, setFechaDesde] = useState(initialFechaDesde);
  const [fechaHasta, setFechaHasta] = useState(initialFechaHasta);
  const [modeloFiltros, setModeloFiltros] = useState<Record<string, unknown>>(
    initialModeloFiltros,
  );
  const [limite, setLimite] = useState(initialLimit);
  const [endpointAnterior, setEndpointAnterior] = useState(endpoint);

  // Al cambiar el endpoint (otro dataset) la paginación, búsqueda y filtros
  // previos ya no aplican: se reinician durante el render, en vez de en un
  // efecto, para que la nueva solicitud salga una sola vez y sin valores
  // obsoletos. Ver
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (endpointAnterior !== endpoint) {
    setEndpointAnterior(endpoint);
    setPaginaActual(1);
    setBusquedaActiva(initialBusqueda);
    setTextoBusqueda(initialBusqueda);
    setModeloFiltros(initialModeloFiltros);
  }

  const onErrorRef = useRef(onError);
  const modeloFiltrosRef = useRef(modeloFiltros);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    modeloFiltrosRef.current = modeloFiltros;
  }, [modeloFiltros]);

  // Los filtros de columna de ag-grid se aplican localmente (client-side) y no
  // deben disparar una nueva solicitud al servidor. Por eso `modeloFiltros` no
  // forma parte de las dependencias de este efecto: se lee desde una ref para
  // que, cuando sí ocurra una nueva solicitud (por ejemplo al cambiar el rango
  // de fechas, la página o el límite), se envíe el último filtro conocido.
  useEffect(() => {
    let cancelado = false;

    const cargarDatos = async () => {
      setEstaCargando(true);
      try {
        const resultado = await obtenerReporte<T>({
          endpoint,
          pagina: paginaActual,
          limite,
          busquedaGlobal: busquedaActiva,
          modeloFiltros: modeloFiltrosRef.current,
          rangoFechas: buildRangoFechas(fechaDesde, fechaHasta),
        });

        if (!cancelado) {
          setDatos(resultado.datos);
          setTotalPaginas(resultado.totalPaginas);
          setPaginaActual(resultado.paginaActual);
          setTotalElementos(resultado.totalElementos ?? 0);
        }
      } catch (error) {
        if (!cancelado) {
          onErrorRef.current?.(error);
        }
      }
      if (!cancelado) {
        setEstaCargando(false);
      }
    };

    cargarDatos();

    return () => {
      cancelado = true;
    };
  }, [endpoint, busquedaActiva, paginaActual, limite, fechaDesde, fechaHasta]);

  return {
    datos,
    paginaActual,
    totalPaginas,
    totalElementos,
    estaCargando,
    textoBusqueda,
    setTextoBusqueda,
    busquedaActiva,
    setBusquedaActiva,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    modeloFiltros,
    setModeloFiltros,
    limite,
    setLimite,
    setPaginaActual,
  };
};
