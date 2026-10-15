import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Toaster } from "react-hot-toast";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { NavbarSlotContext } from "./navbarSlotContext";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children } : LayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Slot del Navbar donde los reportes montan su encabezado vía portal.
  const [navbarSlot, setNavbarSlot] = useState<HTMLElement | null>(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    if (!isSidebarOpen) return;
    const cerrarConEscape = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setIsSidebarOpen(false);
    };
    window.addEventListener("keydown", cerrarConEscape);
    return () => window.removeEventListener("keydown", cerrarConEscape);
  }, [isSidebarOpen]);

  // Foco del menú lateral: al abrir entra en el reporte actual (o el primero);
  // al cerrar, si estaba adentro (al cerrarse queda inert y lo pierde), vuelve
  // al botón de hamburguesa en vez de caer al inicio de la página.
  const estabaAbierto = useRef(false);
  useEffect(() => {
    const menu = document.getElementById("menu-reportes");
    if (isSidebarOpen) {
      const destino =
        menu?.querySelector<HTMLElement>('[aria-current="page"]') ??
        menu?.querySelector<HTMLElement>("a");
      destino?.focus({ preventScroll: true });
    } else if (estabaAbierto.current) {
      const foco = document.activeElement;
      if (!foco || foco === document.body || menu?.contains(foco)) {
        document.querySelector<HTMLElement>('[aria-controls="menu-reportes"]')?.focus();
      }
    }
    estabaAbierto.current = isSidebarOpen;
  }, [isSidebarOpen]);

  return (
    // Contenedor en Columna: Navbar arriba, contenido abajo
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden text-gray-900 font-sans">
      <Toaster position="bottom-right" reverseOrder={false} />
      <Navbar
        toggleSidebar={toggleSidebar}
        sidebarAbierto={isSidebarOpen}
        reportSlotRef={setNavbarSlot}
      />

      <div className="flex-1 flex relative overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onNavegar={() => setIsSidebarOpen(false)} />

        <main className="flex-1 w-full h-full overflow-x-hidden overflow-y-auto bg-gray-50">
          <NavbarSlotContext.Provider value={navbarSlot}>
            {children}
          </NavbarSlotContext.Provider>
        </main>

        {isSidebarOpen && (
          <button
            type="button"
            className="absolute inset-0 z-10 cursor-default"
            tabIndex={-1}
            onClick={toggleSidebar}
            title="Cerrar menú"
            aria-label="Cerrar menú"
          />
        )}
      </div>
    </div>
  );
};

export default Layout;
