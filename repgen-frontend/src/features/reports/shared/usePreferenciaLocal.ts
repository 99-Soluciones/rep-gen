import { useState } from "react";

/**
 * Preferencia de este navegador (p. ej. el resumen abierto o cerrado). Si el
 * almacenamiento no está disponible (modo privado, bloqueado) vale el
 * predeterminado y la app sigue igual.
 */
export const usePreferenciaLocal = (clave: string, predeterminado: boolean) => {
  const [valor, setValor] = useState(() => {
    try {
      const guardado = localStorage.getItem(clave);
      return guardado === null ? predeterminado : guardado === "1";
    } catch {
      return predeterminado;
    }
  });
  const cambiar = (nuevo: boolean) => {
    setValor(nuevo);
    try {
      localStorage.setItem(clave, nuevo ? "1" : "0");
    } catch {
      // Sin almacenamiento: dura lo que dure la página.
    }
  };
  return [valor, cambiar] as const;
};
