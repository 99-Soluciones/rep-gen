import { Zap, Rocket } from "lucide-react";
import "./ComingSoon.css";

interface ComingSoonProps {
  titulo?: string;
  mensaje?: string;
  icono?: "rocket" | "zap";
}

const ComingSoon = ({
  titulo = "Reporte en Desarrollo",
  mensaje = "Estamos trabajando intensamente para ofrecerte reportes aún más potentes y útiles",
  icono = "rocket",
}: ComingSoonProps) => {
  const IconComponent = icono === "rocket" ? Rocket : Zap;

  return (
    <div className="coming-soon-container">
      <div className="coming-soon-content">
        <div className="coming-soon-icon">
          <IconComponent size={64} />
        </div>

        <h1 className="coming-soon-titulo">{titulo}</h1>

        <p className="coming-soon-mensaje">{mensaje}</p>

        <div className="coming-soon-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
