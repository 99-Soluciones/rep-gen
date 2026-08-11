# 🚀 QUICK START - Logger Implementation

## ¿Qué se ha hecho?

✅ **Logger instalado y funcionando en tu backend**

```tree
├── Winston (framework de logs)
├── Daily rotation (archivos diarios)
├── Console output (coloreado)
├── HTTP middleware (auto-logs de requests)
├── Structured JSON logs (para ELK Stack)
└── Skill reutilizable para futuros proyectos
```

---

## 📍 Archivos Creados

```tree
generador-reportes-backend/
├── src/common/logger/
│   ├── logger.service.ts          ← Servicio principal
│   ├── logger.module.ts            ← Módulo NestJS
│   ├── http-logger.middleware.ts   ← Logs de HTTP
│   └── index.ts                    ← Exports

.github/skills/nestjs-logging/     ← SKILL REUTILIZABLE
├── SKILL.md                        ← Guía completa
├── assets/
│   ├── logger.service.ts
│   ├── logger.module.ts
│   ├── http-logger.middleware.ts
│   └── logger.config.ts
├── references/
│   ├── elk-stack-setup.md          ← ELK Stack config
│   ├── winston-config.md           ← Opciones avanzadas
│   └── testing-logging.md          ← Tests
└── scripts/
    └── install-logging-deps.mjs    ← Script de instalación

.env (actualizado)
├── NODE_ENV=development
├── LOG_LEVEL=info
├── LOG_DIR=./logs
└── SERVICE_NAME=reportes-backend

LOGGER_IMPLEMENTATION.md            ← Guía de uso completa
LOGGER_EXAMPLES.ts                  ← Ejemplos prácticos
```

---

## 🎯 Cómo Empezar a Usar

### 1️⃣ Inyectar en un Servicio

```typescript
import { Injectable } from "@nestjs/common";
import { LoggerService } from "./common/logger/logger.service";

@Injectable()
export class MiServicio {
  constructor(private readonly logger: LoggerService) {}

  hacerAlgo() {
    this.logger.info("Mi primer log", { detalles: "aquí" });
  }
}
```

### 2️⃣ Ver los Logs

**En la consola**: Verás logs coloreados en tiempo real

**En archivos**: `./logs/combined-YYYY-MM-DD.log`

---

## 📊 Ejemplo Real: Buscar Reportes

```typescript
// reports.service.ts

async buscarVentas(filtro: BuscarVentasDto) {
  this.logger.info('Buscando ventas', {
    año: filtro.año,
    mes: filtro.mes,
    usuario: filtro.usuarioId,
  });

  try {
    const resultado = await this.filemakerService.query(filtro);

    this.logger.info('Búsqueda exitosa', {
      registrosEncontrados: resultado.length,
      duracionMs: 245,
    });

    return resultado;

  } catch (error) {
    this.logger.error('Búsqueda falló', error, {
      filtro,
      paso: 'queryExecution',
    });
    throw error;
  }
}
```

---

## 🔍 Niveles de Log

| Nivel     | Uso                 | Ejemplo                     |
| --------- | ------------------- | --------------------------- |
| **error** | Errores críticos    | `Conexión DB falló`         |
| **warn**  | Advertencias        | `Tiempo de respuesta lento` |
| **info**  | Eventos importantes | `Usuario autenticado`       |
| **debug** | Detalles técnicos   | `Conectando a DB...`        |

**Configurar en `.env`**:

```env
LOG_LEVEL=info   # development: usa 'debug', production: usa 'warn'
```

---

## 📁 Estructura de Logs

```tree
logs/
├── combined-2026-05-07.log       (todos los logs)
├── combined-2026-05-08.log
├── error-2026-05-07.log          (solo errores)
└── error-2026-05-08.log
```

**Características**:

- ✅ Rotación automática diaria
- ✅ Máximo 20MB por archivo
- ✅ Histórico de 14 días

---

## 🌐 Para ELK Stack (Futuro)

Cuando quieras centralizar logs en Kibana:

1. Cambiar `.env`:

   ```env
   ELK_ENABLED=true
   ```

2. Ejecutar:

   ```bash
   docker-compose up -d  # Ver referencias/elk-stack-setup.md
   ```

3. Acceder a: <http://localhost:5601>

---

## 📚 Documentación

| Documento                          | Descripción                    |
| ---------------------------------- | ------------------------------ |
| **LOGGER_IMPLEMENTATION.md**       | Guía completa de uso           |
| **LOGGER_EXAMPLES.ts**             | Ejemplos con mejores prácticas |
| **.github/skills/nestjs-logging/** | Skill para reutilizar          |
| **elk-stack-setup.md**             | Configuración ELK Docker       |
| **winston-config.md**              | Opciones avanzadas             |
| **testing-logging.md**             | Tests unitarios                |

---

## ✨ Lo Que Está Funcionando

| Feature               | ✅     |
| --------------------- | ------ |
| Logger Service        | Activo |
| HTTP Request Logging  | Activo |
| File Rotation (daily) | Activo |
| Console Output        | Activo |
| Error Stack Traces    | Activo |
| Metadata Support      | Activo |
| Colored Output        | Activo |

---

## 🎓 Próximos Pasos

1. **Hoy**: Prueba el logger en tus servicios
2. **Esta semana**: Revisar logs y ajustar LOG_LEVEL según necesidad
3. **Futuro**: Implementar ELK Stack si necesitas dashboard
4. **Producción**: Cambiar LOG_LEVEL a `warn` en `.env`

---

## 🆘 Si Algo No Funciona

### Log no aparece

```bash
# Verificar que existe el directorio
ls ./logs

# Verificar LOG_LEVEL en .env
echo $LOG_LEVEL

# Reiniciar servidor
pnpm run start:dev
```

### Logs muy voluminosos

```env
LOG_LEVEL=warn  # Solo warnings y errors
```

### Permiso denegado en ./logs

```bash
# Dar permisos (Linux/Mac)
chmod 755 ./logs

# Windows: ejecutar como administrador
```

---

## 📞 Referencia Rápida

**Logger Methods**:

- `this.logger.info(message, metadata?)`
- `this.logger.warn(message, metadata?)`
- `this.logger.error(message, error, metadata?)`
- `this.logger.debug(message, metadata?)`

**Archivos Key**:

- Logger Service: `src/common/logger/logger.service.ts`
- Middleware: `src/common/logger/http-logger.middleware.ts`
- Configuración: `.env`

---

## ✅ Status

**Implementación**: ✅ Completa y funcionando
**Compilación**: ✅ Sin errores  
**Servidor**: ✅ Iniciando correctamente
**Logs**: ✅ Escribiendo a `./logs/`

---

**¡Listo para usar!**

Empieza a loguear en tus servicios y visualiza los logs en:

- 🖥️ **Consola**: En tiempo real (desarrollo)
- 📂 **Archivos**: `./logs/combined-*.log` (persistencia)
- 📊 **Kibana**: (Opcional, con ELK)
