export interface MenuColumnasState {
  menuAbierto: boolean;
  popoverGuardarAbierto: boolean;
  modoRenombrar: boolean;
  confirmandoEliminar: boolean;
  nombreInput: string;
}

export const estadoInicialMenuColumnas: MenuColumnasState = {
  menuAbierto: false,
  popoverGuardarAbierto: false,
  modoRenombrar: false,
  confirmandoEliminar: false,
  nombreInput: "",
};

export type MenuColumnasAction =
  | { type: "CERRAR_TODO" }
  | { type: "ABRIR_MENU" }
  | { type: "ABRIR_POPOVER_GUARDAR" }
  | { type: "INICIAR_RENOMBRAR"; nombre: string }
  | { type: "CANCELAR_RENOMBRAR" }
  | { type: "CERRAR_POPOVER_GUARDAR" }
  | { type: "CONFIRMAR_ELIMINAR" }
  | { type: "CANCELAR_ELIMINAR" }
  | { type: "SET_NOMBRE_INPUT"; value: string };

export function menuColumnasReducer(
  state: MenuColumnasState,
  action: MenuColumnasAction,
): MenuColumnasState {
  switch (action.type) {
    case "CERRAR_TODO":
      return estadoInicialMenuColumnas;
    case "ABRIR_MENU":
      return {
        ...state,
        menuAbierto: !state.menuAbierto,
        popoverGuardarAbierto: false,
        modoRenombrar: false,
        confirmandoEliminar: false,
      };
    case "ABRIR_POPOVER_GUARDAR":
      return {
        ...state,
        popoverGuardarAbierto: !state.popoverGuardarAbierto,
        menuAbierto: false,
        nombreInput: "",
      };
    case "INICIAR_RENOMBRAR":
      return {
        ...state,
        nombreInput: action.nombre,
        modoRenombrar: true,
        confirmandoEliminar: false,
      };
    case "CANCELAR_RENOMBRAR":
      return { ...state, modoRenombrar: false };
    case "CERRAR_POPOVER_GUARDAR":
      return { ...state, popoverGuardarAbierto: false };
    case "CONFIRMAR_ELIMINAR":
      return { ...state, confirmandoEliminar: true };
    case "CANCELAR_ELIMINAR":
      return { ...state, confirmandoEliminar: false };
    case "SET_NOMBRE_INPUT":
      return { ...state, nombreInput: action.value };
    default:
      return state;
  }
}
