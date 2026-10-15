import toast from "react-hot-toast";

/**
 * Aviso de éxito con un botón "Deshacer". Dura más que un aviso normal porque
 * trae una acción; quien lo usa debería ofrecer otra vía para deshacer cuando
 * el aviso ya se fue (p. ej. el menú ⋮ de las vistas).
 */
export const avisarConDeshacer = (mensaje: string, onDeshacer: () => void) =>
  toast.success(
    (t) => (
      <span className="flex items-center gap-3">
        <span>{mensaje}</span>
        <button
          type="button"
          onClick={() => {
            toast.dismiss(t.id);
            onDeshacer();
          }}
          className="shrink-0 rounded font-semibold text-blue-700 hover:underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Deshacer
        </button>
      </span>
    ),
    { duration: 10000 },
  );
