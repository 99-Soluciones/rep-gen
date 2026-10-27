/**
 * Salir del reporte (otro reporte del menú, cerrar sesión) con trabajo sin
 * guardar. Quien tiene el trabajo (el selector de vistas) se registra como
 * guardián mientras haya cambios; quien saca al usuario llama a `salir`, y el
 * guardián pregunta antes de continuar. Hay un solo reporte en pantalla, así
 * que basta un guardián.
 */
export interface Salida {
  motivo: "reporte" | "sesion";
  continuar: () => void;
  /** Al quedarse (p. ej. liberar la navegación bloqueada). */
  cancelar?: () => void;
}

type Guardian = (salida: Salida) => void;

let guardian: Guardian | null = null;

/** Registra al guardián; devuelve la función que lo retira. */
export const protegerSalida = (nuevo: Guardian) => {
  guardian = nuevo;
  return () => {
    if (guardian === nuevo) guardian = null;
  };
};

export const hayTrabajoSinGuardar = () => guardian !== null;

/** Sale ya, o deja que el guardián pregunte primero. */
export const salir = (salida: Salida) => {
  if (guardian) guardian(salida);
  else salida.continuar();
};
