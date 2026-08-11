# ⚡ Winston Logger Cheat Sheet - Mapeo de Código

Este documento es una referencia rápida que mapea exactamente qué hace cada parte del código.

## 🗺️ Archivo: `src/common/logger/logger.service.ts`

### Sección 1: Declaración (Líneas 7-9)

```typescript
export class LoggerService implements NestLoggerService {
  private logger!: winston.Logger;  // ← Objeto de Winston
  private elasticsearchClient: Client | null = null;

  constructor(private configService: ConfigService) {
    this.initializeLogger();  // ← Se ejecuta al crear la instancia
  }
```

**¿Qué pasa?**

- Winston aún no está inicializado
- `!` (non-null assertion) significa que se asignará en `initializeLogger()`
- `configService` es inyectado por NestJS

---

### Sección 2: Lectura de Configuración (Líneas 14-17)

```typescript
private initializeLogger(): void {
  const nodeEnv: string = this.configService.get('NODE_ENV', 'development');
  const logLevel: string = this.configService.get('LOG_LEVEL', 'info');
  const logDir: string = this.configService.get('LOG_DIR', './logs');
```

**¿Qué pasa?**

- Lee `.env`
- Si `LOG_LEVEL` no existe, usa `'info'` por defecto
- `logLevel` es el **nivel global de filtro**

**De .env:**

```env
LOG_LEVEL=info    # ← Se lee aquí
```

---

### Sección 3: Transport Console (Líneas 19-32)

```typescript
new winston.transports.Console({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    // ↑ Línea 21: Añade @timestamp con este formato

    winston.format.colorize(),
    // ↑ Línea 22: Red para error, Yellow para warn, etc.

    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      // ↑ Línea 23: Función personalizada
      // Recibe: { timestamp, level, message, ...meta }
      // meta = los datos que pasaste (userId, duration, etc)

      const metaStr = Object.keys(meta).length
        ? JSON.stringify(meta, null, 2)
        : '';
      // ↑ Líneas 24-27: Si hay metadata, conviértela a JSON indent

      return `${timestamp} [${level}]: ${message} ${metaStr}`;
      // ↑ Línea 28: Formato final
    }),
  ),
}),
```

**¿Qué pasa?**

- Cuando llamas `logger.info()`, Winston pasa el log por este transport
- **Orden importa**: timestamp primero → colorize → printf
- El `printf` es lo último, formatea la cadena final
- Se envía a `console.log` (ves en terminal inmediatamente)

**Ejemplo de salida:**

```
2026-05-07 14:30:45 [info]: Usuario autenticado {
  "userId": 123,
  "email": "user@example.com"
}
```

---

### Sección 4: Transport File - Errores (Líneas 34-44)

```typescript
new DailyRotateFile({
  filename: `${logDir}/error-%DATE%.log`,
  // ↑ Línea 35: %DATE% → 2026-05-07, 2026-05-08, etc

  datePattern: 'YYYY-MM-DD',
  // ↑ Línea 36: Cómo se formatea la fecha

  maxSize: '20m',
  // ↑ Línea 37: Rota si supera 20MB

  maxFiles: 14,
  // ↑ Línea 38: Mantiene 14 archivos máximo (borra viejos)

  level: 'error',
  // ↑ Línea 39: IMPORTANTE - solo logs con level === 'error'

  format: winston.format.combine(
    winston.format.timestamp(),  // ↑ Añade @timestamp
    winston.format.json(),       // ↑ Convierte a JSON
  ),
}),
```

**¿Qué pasa?**

- Si llamas `logger.error()`, Winston verifica: ¿level === 'error'? ✅ SÍ → Escribe en archivo
- Si llamas `logger.info()`, verifica: ¿level === 'error'? ❌ NO → Ignora este archivo
- Rotación automática: 1 archivo por día, máximo 14 días de historia

**Archivos generados:**

```
logs/
├── error-2026-05-07.log
├── error-2026-05-08.log
├── error-2026-05-09.log
└── ... (máximo 14 días)
```

---

### Sección 5: Transport File - Combinado (Líneas 46-56)

```typescript
new DailyRotateFile({
  filename: `${logDir}/combined-%DATE%.log`,
  // ↑ IDÉNTICO a error, pero:

  level: 'info',
  // ↑ Línea 51: Cualquier log con level >= 'info' entra aquí
  // Entonces: error ✅, warn ✅, info ✅, debug ❌
```

**¿Qué pasa?**

- Si llamas `logger.info()`: ✅ Escribe
- Si llamas `logger.warn()`: ✅ Escribe
- Si llamas `logger.error()`: ✅ Escribe (TAMBIÉN en error-\*.log)
- Si llamas `logger.debug()` (y LOG_LEVEL=info): ❌ Ignorado globalmente

---

### Sección 6: Winston createLogger (Líneas 59-73)

```typescript
this.logger = winston.createLogger({
  level: logLevel,
  // ↑ Línea 60: logLevel viene de .env (defecto: 'info')
  // ESTE es el filtro global - se aplica ANTES de transports

  format: winston.format.combine(
    winston.format.timestamp(),
    // ↑ Línea 63: Añade @timestamp a nivel global

    winston.format.errors({ stack: true }),
    // ↑ Línea 64: Si hay Error, incluye .stack

    winston.format.splat(),
    // ↑ Línea 65: Permite interpolación de strings

    winston.format.json(),
    // ↑ Línea 66: Estructura todo como JSON
  ),

  defaultMeta: {
    service: this.getServiceName(), // ↑ 'reportes-backend'
    environment: nodeEnv, // ↑ 'development'
    timestamp: new Date().toISOString(), // ↑ Timestamp actual
  },
  // ↑ Líneas 69-73: ESTOS CAMPOS SE AÑADEN A CADA LOG

  transports, // ← Array con los 3 transports arriba
});
```

**¿Qué pasa?**

- Cada log pasa por estos formatos globales PRIMERO
- Luego se distribuye a cada transport (que puede aplicar más formatos)
- `defaultMeta` se **añade automáticamente** a todos tus logs

---

### Sección 7: Métodos Públicos

#### `log()` (Línea 75)

```typescript
log(message: string, context?: string, meta?: any): void {
  this.logger.info(message, {
    context,
    ...meta,
  });
}
```

**Uso:**

```typescript
this.logger.log("Mensaje", "MiServicio", { extra: "datos" });
```

#### `error()` (Línea 80)

```typescript
error(message: string, trace?: string | Error, meta?: any): void {
  const error = trace instanceof Error ? trace : new Error(trace);
  this.logger.error(message, {
    stack: error.stack,
    message: error.message,
    ...meta,
  });
}
```

**Uso:**

```typescript
try {
  // ...
} catch (error) {
  this.logger.error("Operación falló", error, { paso: "validation" });
  // ↑ Automáticamente incluye stack trace
}
```

#### `warn()`, `debug()`, `info()` (Líneas 95, 99, 103)

```typescript
warn(message: string, meta?: any): void {
  this.logger.warn(message, meta);
}

debug(message: string, meta?: any): void {
  this.logger.debug(message, meta);
}

info(message: string, meta?: any): void {
  this.logger.info(message, meta);
}
```

---

### Sección 8: Shutdown Graceful (Línea 113)

```typescript
async onModuleDestroy(): Promise<void> {
  await new Promise<void>((resolve) => {
    this.logger.on('finish', resolve);
    this.logger.end();
  });
}
```

**¿Qué pasa?**

- Se ejecuta cuando NestJS cierra la aplicación
- `logger.end()` dice a Winston que no acepte más logs
- `on('finish')` espera a que terminen las escrituras asincrónicas
- Garantiza que todos los logs se escriban antes de cerrar

**Sin esto:**

```typescript
logger.info("Último log");
process.exit(0); // ← Puede que el log no se escriba
```

**Con esto:**

```typescript
// NestJS cierra → onModuleDestroy() → espera escrituras → exit seguro
```

---

## 🗺️ Archivo: `src/common/logger/http-logger.middleware.ts`

### Flujo Completo (Líneas 9-42)

```typescript
@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const startTime = Date.now();
    // ↑ Línea 14-16: Captura datos iniciales

    const logger = this.logger; // ← Evita cambios de `this` adentro

    const originalSend = res.send;
    res.send = function (data: any) {
      // ↑ Línea 19: Reemplaza res.send con nuestro wrapper

      const duration = Date.now() - startTime;
      const status = res.statusCode;
      // ↑ Líneas 20-21: Calcula duración y obtiene status

      logger.info(`${method} ${originalUrl}`, {
        method,
        url: originalUrl,
        status,
        duration: `${duration}ms`,
        ip,
        userAgent: req.get("user-agent"),
        body: sanitizeBody(req.body),
      });
      // ↑ Línea 23-30: Llama logger.info (INFO level)

      if (status >= 400) {
        logger.warn(`HTTP ${status} - ${method} ${originalUrl}`, {
          method,
          url: originalUrl,
          status,
          duration: `${duration}ms`,
          ip,
        });
        // ↑ Línea 32-39: Para 4xx/5xx, también llama logger.warn
      }

      return originalSend.call(this, data);
      // ↑ Línea 41: Ejecuta res.send ORIGINAL, envía respuesta al cliente
    };

    next();
    // ↑ Línea 44: Continúa con siguiente middleware/controlador
  }
}
```

**Secuencia temporal:**

```
1. HTTP request entra
2. Middleware: startTime = 2026-05-07 14:30:45.100
3. Middleware: Reemplaza res.send
4. Middleware: Llama next() → va a controlador
5. Controlador: Procesa (ejemplo: 145ms)
6. Controlador: res.send(resultado) → ejecuta WRAPPER
7. Wrapper: duration = 145ms, status = 200
8. Wrapper: Llama logger.info()  ← LOGS EN CONSOLA + ARCHIVO
9. Wrapper: Ejecuta res.send ORIGINAL
10. Cliente: Recibe respuesta
```

---

## 🔍 Ejemplo Completo: Trace de un Log

### Código que ejecutas:

```typescript
// En http-logger.middleware.ts línea 23
logger.info(`GET /api/v1/reports`, {
  status: 200,
  duration: "145ms",
  userId: 123,
});
```

### Qué sucede internamente:

**Paso 1: LoggerService.info() (tu código, línea 103)**

```typescript
info(message: string, meta?: any): void {
  this.logger.info(message, meta);  // ← Delega a Winston
}
```

**Paso 2: Winston recibe el log**

```javascript
// Winston crea objeto log:
{
  level: 'info',
  message: 'GET /api/v1/reports',
  status: 200,
  duration: '145ms',
  userId: 123,
}
```

**Paso 3: Verifica nivel global (línea 60)**

```javascript
// ¿'info' >= 'info' (logLevel de .env)?
// ✅ SÍ → Procede
```

**Paso 4: Aplica formatos globales (líneas 63-66)**

```javascript
// Añade:
{
  level: 'info',
  message: 'GET /api/v1/reports',
  status: 200,
  duration: '145ms',
  userId: 123,
  '@timestamp': '2026-05-07T14:30:45.123Z',
  service: 'reportes-backend',
  environment: 'development',
}
```

**Paso 5: Transport Console (línea 21)**

```
Aplica: printf({ timestamp: '14:30:45', level: 'info', ... })
Resultado: "2026-05-07 14:30:45 [info]: GET /api/v1/reports {...}"
Destino: console.log() → TERMINAL
```

**Paso 6: Transport DailyRotateFile - combined (línea 51)**

```
Aplica: json()
Resultado: {"level":"info","message":"GET /api/v1/reports",...}
Destino: logs/combined-2026-05-07.log
Timing: Asincrónico (background)
```

**Paso 7: Transport DailyRotateFile - error (línea 39)**

```
Verifica: ¿level === 'error'?
'info' === 'error'? ❌ NO
Resultado: IGNORADO
```

### Resultado Final:

**Consola (inmediato):**

```
2026-05-07 14:30:45 [info]: GET /api/v1/reports {
  "status": 200,
  "duration": "145ms",
  "userId": 123,
  "service": "reportes-backend",
  "environment": "development"
}
```

**Archivo ./logs/combined-2026-05-07.log (asincrónico, luego):**

```json
{
  "level": "info",
  "message": "GET /api/v1/reports",
  "status": 200,
  "duration": "145ms",
  "userId": 123,
  "service": "reportes-backend",
  "environment": "development",
  "@timestamp": "2026-05-07T14:30:45.123Z"
}
```

**Archivo ./logs/error-2026-05-07.log:**

```
(nada - solo se escribe si level === 'error')
```

---

## 📋 Referencia Rápida: Niveles de Log

```typescript
logger.debug("Debug"); // ← Solo si LOG_LEVEL=debug
logger.info("Info"); // ← Si LOG_LEVEL <= info
logger.warn("Warning"); // ← Si LOG_LEVEL <= warn
logger.error("Error", e); // ← Siempre (si LOG_LEVEL <= error)

// Comparación de niveles (orden):
debug < info < warn < error;
```

Si `.env` tiene `LOG_LEVEL=info`:

- ✅ info, warn, error → SE LOGUEAN
- ❌ debug → SE IGNORAN

---

## 🎯 Quick Answers

**P: ¿Cuándo se escribe en archivo?**
A: Cuando llamas `.info()`, `.warn()`, `.error()` → Se envía a transports → Winston escribe en background

**P: ¿Por qué aparece en consola pero no en archivo?**
A: Console es síncrono (inmediato), archivo es asincrónico. Espera 1 segundo y revisa el archivo

**P: ¿Qué diferencia hay entre combined y error?**
A: `combined` tiene todo (info+warn+error), `error` solo tiene errores

**P: ¿Cómo filtro solo logs de error?**
A: Revisa `logs/error-*.log` (ya están filtrados), O en consola busca `[error]`

**P: ¿Qué pasa si el proceso muere?**
A: Algunos logs pendientes pueden no escribirse. Usa `onModuleDestroy()` para flush
