# 📝 Logger Implementation Guide - ReportesEjemplo Backend

## ✅ Lo que se ha completado

Tu backend ahora tiene un sistema completo de logging con Winston. El logger está **funcionando** y listo para usar.

### Componentes Instalados

| Componente               | Ubicación                                     | Propósito                              |
| ------------------------ | --------------------------------------------- | -------------------------------------- |
| **LoggerService**        | `src/common/logger/logger.service.ts`         | Servicio inyectable para logging       |
| **LoggerModule**         | `src/common/logger/logger.module.ts`          | Módulo NestJS                          |
| **HttpLoggerMiddleware** | `src/common/logger/http-logger.middleware.ts` | Logs automáticos de requests/responses |
| **Skill Reutilizable**   | `.github/skills/nestjs-logging/`              | Para futuros proyectos                 |

### Dependencias Instaladas

```list
✓ winston (3.19.0) - Logger framework
✓ winston-daily-rotate-file (5.0.0) - Rotación diaria de logs
✓ @elastic/elasticsearch (9.4.0) - Para ELK Stack (opcional)
```

---

## 🚀 Cómo Usar el Logger

### 1. En un Servicio

```typescript
import { Injectable } from "@nestjs/common";
import { LoggerService } from "./common/logger/logger.service";

@Injectable()
export class MiServicio {
  constructor(private readonly logger: LoggerService) {}

  hacerAlgo() {
    // Log de información
    this.logger.info("Iniciando operación", { operacion: "hacerAlgo" });

    try {
      // tu código...
      this.logger.info("Operación completada", { status: "success" });
    } catch (error) {
      // Log de error
      this.logger.error("Operación falló", error, { operacion: "hacerAlgo" });
    }
  }
}
```

### 2. Niveles de Log Disponibles

```typescript
this.logger.info("Mensaje informativo"); // Nivel: info
this.logger.warn("Advertencia importante"); // Nivel: warn
this.logger.error("Error crítico", error); // Nivel: error
this.logger.debug("Información de depuración"); // Nivel: debug
```

### 3. Con Metadatos Contextuales

```typescript
this.logger.info("Usuario logueado", {
  userId: user.id,
  email: user.email,
  timestamp: new Date(),
  requestId: "abc-123", // Para trazabilidad
});
```

---

## 📂 Ubicación de Logs

Los logs se escriben en: **`./logs/`**

```tree
logs/
├── combined-2026-05-07.log    ← Todos los logs
├── combined-2026-05-08.log
├── error-2026-05-07.log       ← Solo errores
└── error-2026-05-08.log
```

Cada archivo:

- **Rotación**: Automática cada día
- **Máximo**: 20MB por archivo
- **Historial**: Se guardan 14 días

---

## ⚙️ Configuración

### Variables de Entorno (en `.env`)

```env
# Logging básico
NODE_ENV=development          # development | production | test
LOG_LEVEL=info               # error | warn | info | debug
LOG_DIR=./logs               # Directorio de logs
SERVICE_NAME=reportes-backend # Nombre del servicio

# Para ELK Stack (futuro)
ELK_ENABLED=false            # Cambiar a true cuando uses ELK
ELK_HOST=localhost
ELK_PORT=9200
```

### Cambiar Nivel de Log

**En desarrollo**: Todos los logs (info, debug, etc.)

```env
LOG_LEVEL=debug
```

**En producción**: Solo advertencias y errores

```env
LOG_LEVEL=warn
```

---

## 📊 HTTP Logging Automático

El middleware automáticamente registra cada request:

**Log de REQUEST exitoso (200)**:

```json
{
  "level": "info",
  "message": "POST /api/v1/reports/ventas/buscar",
  "method": "POST",
  "url": "/api/v1/reports/ventas/buscar",
  "status": 200,
  "duration": "145ms",
  "ip": "127.0.0.1",
  "timestamp": "2026-05-07T13:45:30.123Z"
}
```

**Log de ERROR (400+)**:

```json
{
  "level": "warn",
  "message": "HTTP 400 - POST /api/v1/reports/ventas/buscar",
  "status": 400,
  "duration": "50ms",
  "timestamp": "2026-05-07T13:45:31.456Z"
}
```

⚠️ **Nota**: Los campos sensibles (password, token) se redactan automáticamente como `[REDACTED]`

---

## 🔍 Visualizar Logs en Desarrollo

### Opción 1: Consola (En tiempo real)

Los logs aparecen coloreados en la terminal:

```example
2026-05-07 13:45:30 [info]: Usuario autenticado {"userId":123,"email":"user@example.com"}
2026-05-07 13:45:31 [warn]: Consulta lenta {"duration":"2000ms"}
2026-05-07 13:45:32 [error]: Connection failed {"error":"ECONNREFUSED"}
```

### Opción 2: Archivos de Log

```bash
# Ver últimos 50 líneas de logs
tail -50 logs/combined-*.log

# Ver solo errores
cat logs/error-*.log | grep "error"

# Buscar un usuario específico
grep "userId:123" logs/combined-*.log
```

### Opción 3: Scripts

```bash
# Ver logs en tiempo real
tail -f logs/combined-*.log

# Contar errores
wc -l logs/error-*.log
```

---

## 🎯 Casos de Uso Comunes

### Caso 1: Registrar Búsquedas de Reportes

```typescript
// En reports.service.ts
async buscarVentas(filtro: BuscarVentasDto) {
  this.logger.info('Buscando ventas', {
    filtroAño: filtro.año,
    filterMes: filtro.mes,
    usuario: filtro.usuarioId,
  });

  try {
    const resultado = await this.filemakerService.query(...);
    this.logger.info('Búsqueda exitosa', {
      registrosEncontrados: resultado.length,
      tiempoMs: Date.now() - startTime,
    });
    return resultado;
  } catch (error) {
    this.logger.error('Búsqueda falló', error, {
      filtro: filtro,
      paso: 'queryExecution',
    });
    throw error;
  }
}
```

### Caso 2: Registrar Autenticación

```typescript
// En auth.service.ts
async login(credentials: AuthDto) {
  this.logger.info('Intento de login', { email: credentials.email });

  try {
    const user = await this.validateUser(credentials);
    this.logger.info('Usuario autenticado', {
      userId: user.id,
      email: user.email,
    });
    return this.generateToken(user);
  } catch (error) {
    this.logger.warn('Login fallido', {
      email: credentials.email,
      razón: error.message,
    });
    throw error;
  }
}
```

### Caso 3: Registrar Errores Críticos

```typescript
// En cualquier servicio
try {
  await operaciónCrítica();
} catch (error) {
  this.logger.error("Operación crítica falló", error, {
    severidad: "CRITICAL",
    acción: "Se notificará al admin",
    timestamp: new Date(),
    stack: error.stack,
  });
  // Enviar alerta al admin
  await this.notificationService.alertAdmin(error);
}
```

---

## 🚀 Próximos Pasos (Opcionales)

### 1. Activar ELK Stack para Visualización Centralizada

Si quieres un dashboard Kibana para analizar logs:

1. Cambiar `.env`:

   ```env
   ELK_ENABLED=true
   ```

2. Ejecutar Docker Compose:

   ```bash
   # Crear docker-compose.yml (ver references/elk-stack-setup.md)
   docker-compose up -d
   ```

3. Acceder a Kibana: <http://localhost:5601>

### 2. Crear Alertas en Kibana

Monitorear:

- Tasa de errores (errors/hora)
- Tiempo de respuesta promedio
- Queries lentas

### 3. Integrar con Sentry (Error Tracking)

Para producción, agregar Sentry:

```bash
pnpm add @sentry/nestjs
```

---

## 📚 Documentación Completa

La **skill reutilizable** incluye documentación avanzada:

📂 `.github/skills/nestjs-logging/`

- `SKILL.md` - Guía completa
- `references/elk-stack-setup.md` - Configuración ELK
- `references/testing-logging.md` - Tests del logger
- `references/winston-config.md` - Opciones avanzadas

Puedes usar esta skill en otros proyectos NestJS escribiendo:

```route
/nestjs-logging
```

---

## ✨ Resumen

| Feature                    | Status                   |
| -------------------------- | ------------------------ |
| Logger Service             | ✅ Activo                |
| HTTP Request Logging       | ✅ Activo                |
| File Rotation (daily)      | ✅ Activo                |
| Console Output (coloreado) | ✅ Activo                |
| Error Stack Traces         | ✅ Activo                |
| Metadata Support           | ✅ Activo                |
| ELK Integration            | ⏳ Disponible (opcional) |

---

## 🐛 Troubleshooting

### Problema: No veo los logs

**Solución**:

```bash
# Verificar que LOG_DIR existe
ls -la ./logs

# Verificar LOG_LEVEL
cat .env | grep LOG_LEVEL

# Reiniciar el servidor
pnpm run start:dev
```

### Problema: Logs muy voluminosos

**Solución**: Aumentar LOG_LEVEL

```env
LOG_LEVEL=warn  # Solo warnings y errors
```

### Problema: Permisos en ./logs

**Solución**:

```bash
# Linux/Mac
chmod 755 ./logs

# Windows: ejecutar terminal como admin
```

---

## 📞 Soporte

Para más información sobre Winston:

- [Winston Documentation](https://github.com/winstonjs/winston)
- [NestJS Logger](https://docs.nestjs.com/techniques/logger)

Para ELK Stack:

- [Elasticsearch Docs](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Kibana Guide](https://www.elastic.co/guide/en/kibana/current/index.html)

---

**Última actualización**: 7 de mayo, 2026
**Sistema**: ✅ Production Ready
