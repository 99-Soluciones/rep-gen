import { createContext, useContext } from "react";

// Elemento del Navbar donde los reportes montan su encabezado (título +
// rango de fechas) vía portal. Lo provee Layout; es null cuando el slot no
// está montado (por ejemplo en tests que renderizan un reporte solo).
export const NavbarSlotContext = createContext<HTMLElement | null>(null);

export const useNavbarSlot = () => useContext(NavbarSlotContext);
