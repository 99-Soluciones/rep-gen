import type { ReactNode } from "react";
import { useState } from "react";
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

  return (
    // Contenedor en Columna: Navbar arriba, contenido abajo
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden text-gray-900 font-sans">
      <Toaster position="top-right" reverseOrder={false} />
      <Navbar toggleSidebar={toggleSidebar} reportSlotRef={setNavbarSlot} />

      <div className="flex-1 flex relative overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} />

        <main className="flex-1 w-full h-full overflow-x-hidden overflow-y-auto bg-gray-50">
          <NavbarSlotContext.Provider value={navbarSlot}>
            {children}
          </NavbarSlotContext.Provider>
        </main>

        {isSidebarOpen && (
          <button
            type="button"
            className="absolute inset-0 z-10 cursor-default"
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
