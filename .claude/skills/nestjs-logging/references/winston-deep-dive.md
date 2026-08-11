# 🔬 Deep Dive: Flujo Interno de Winston Logger

## 🎯 Objetivo
Entender exactamente qué sucede cuando llamas `this.logger.info()` hasta que el log aparece en consola y archivo.

---

## 📊 Diagrama del Flujo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. HTTP Request llega                                           │
│    GET /api/v1/reports/ventas/buscar                            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. HttpLoggerMiddleware.use() se ejecuta                        │
│    - Guarda startTime = Date.now()                              │
│    - Reemplaza res.send con wrapper                             │
│    - Llama next()                                               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Controlador/Servicio procesa                                 │
│    - Tu lógica de negocio aquí                                  │
│    - Genera respuesta                                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. res.send(data) es llamado                                    │
│    (Pero se ejecuta nuestro WRAPPER, no la original)            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Wrapper ejecuta:                                             │
│    - duration = Date.now() - startTime                          │
│    - status = res.statusCode                                    │
│    - Llama: logger.info("GET /api/v1/...", {data})            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. LoggerService.info() recibe el mensaje                       │
│    - Llama: this.logger.info(message, meta)                     │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. winston.createLogger() procesa el log                         │
│    - Verifica nivel (comparar 'info' >= logLevel)               │
│    - Si pasa, aplica formato global (timestamp, json, etc)      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. Para CADA transport, aplica su formato propio                │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ TRANSPORT 1: Console                                    │  │
│    │ - Aplica colorize()                                     │  │
│    │ - Aplica printf() (formato personalizado)               │  │
│    │ - OUTPUT: "2026-05-07 14:30:45 [info]: ..."            │  │
│    │ - Envía a: process.stdout (terminal)                    │  │
│    └──────┬──────────────────────────────────────────────────┘  │
│           │                                                     │
│    ┌──────▼──────────────────────────────────────────────────┐  │
│    │ TRANSPORT 2: DailyRotateFile (combined)                │  │
│    │ - Aplica timestamp()                                    │  │
│    │ - Aplica json() (formato JSON completo)                │  │
│    │ - OUTPUT: {"level":"info","message":"...","@timestamp":...│
│    │ - Envía a: logs/combined-2026-05-07.log               │  │
│    └──────┬──────────────────────────────────────────────────┘  │
│           │                                                     │
│    ┌──────▼──────────────────────────────────────────────────┐  │
│    │ TRANSPORT 3: DailyRotateFile (error)                   │  │
│    │ - Solo si level === 'error'                             │  │
│    │ - Si status < 400: IGNORADO                             │  │
│    │ - Si status >= 400: Escribe en error-2026-05-07.log   │  │
│    └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. Winston envía respuesta original                             │
│    res.send(data) → respuesta al cliente                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Análisis Línea por Línea del LoggerService

Vamos a analizar qué ocurre en cada línea clave:

### **Parte 1: Inicialización (Constructor)**

```typescript
constructor(private configService: ConfigService) {
  this.initializeLogger();  // ← Se ejecuta cuando el módulo se carga
}
```

**Qué pasa:**
1. NestJS crea una instancia de `LoggerService`
2. Se inyecta `ConfigService` (acceso a variables de entorno)
3. Inmediatamente se llama `initializeLogger()`

---

### **Parte 2: Configuración de Winston (initializeLogger)**

```typescript
private initializeLogger(): void {
  const nodeEnv: string = this.configService.get('NODE_ENV', 'development');
  const logLevel: string = this.configService.get('LOG_LEVEL', 'info');
  const logDir: string = this.configService.get('LOG_DIR', './logs');
  // ↑ Lee variables de entorno (.env)
```

**Qué pasa:**
- Lee `.env` para obtener configuración
- `logLevel` define qué mensajes se loguean (si logLevel='info', solo info/warn/error se procesan, debug se ignora)

---

### **Parte 3: Configuración del Transport Console**

```typescript
new winston.transports.Console({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    // ↑ Añade campo "@timestamp" con formato legible
    
    winston.format.colorize(),
    // ↑ Colorea según nivel: [info]=cyan, [error]=red, etc
    
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      // ↑ Función personalizada que formatea la salida final
      const metaStr = Object.keys(meta).length
        ? JSON.stringify(meta, null, 2)
        : '';
      return `${timestamp} [${level}]: ${message} ${metaStr}`;
      // ↑ Ejemplo output: "2026-05-07 14:30:45 [info]: Usuario autenticado {...}"
    }),
  ),
}),
```

**Qué pasa:**
- Winston recibe el log
- Aplica transformaciones EN ORDEN (formato es una pila):
  1. Añade timestamp
  2. Colorea el nivel
  3. Aplica función printf que crea la cadena final
- La cadena formateada se envía a `console.log` (stdout)

**Salida en terminal:**
```
2026-05-07 14:30:45 [info]: Usuario autenticado {
  "userId": 123,
  "email": "user@example.com"
}
```

---

### **Parte 4: Configuración del Transport File (combined)**

```typescript
new DailyRotateFile({
  filename: `${logDir}/combined-%DATE%.log`,
  // ↑ %DATE% se reemplaza con 2026-05-07, 2026-05-08, etc
  
  datePattern: 'YYYY-MM-DD',
  // ↑ Define cómo se formatea la fecha en el nombre
  
  maxSize: '20m',
  // ↑ Si el archivo supera 20MB, crea uno nuevo
  
  maxFiles: 14,
  // ↑ Mantiene máximo 14 archivos (borra logs más viejos)
  
  level: 'info',  // ← IMPORTANTE: log.level >= 'info'
  
  format: winston.format.combine(
    winston.format.timestamp(),
    // ↑ Añade @timestamp en ISO 8601
    
    winston.format.json(),
    // ↑ Convierte TODOS los campos a JSON estructurado
  ),
}),
```

**Qué pasa:**
- Cuando llama `.info()`, Winston escribe en `combined-2026-05-07.log` (asincrónico, en background)
- El formato es JSON puro (no coloreado, para parseable)

**Salida en archivo:**
```json
{"level":"info","message":"Usuario autenticado","@timestamp":"2026-05-07T14:30:45.123Z","service":"reportes-backend","userId":123}
```

---

### **Parte 5: El Logger Principal**

```typescript
this.logger = winston.createLogger({
  level: logLevel,  // ← 'info' (viene de .env)
  
  format: winston.format.combine(
    winston.format.timestamp(),
    // ↑ Añade timestamp a nivel global (ANTES de pasarse a transports)
    
    winston.format.errors({ stack: true }),
    // ↑ Si hay Error, incluye .stack
    
    winston.format.splat(),
    // ↑ Permite interpolación: logger.log('User %s', name)
    
    winston.format.json(),
    // ↑ Convierte a JSON (aunque los transports pueden re-formatear)
  ),
  
  defaultMeta: {
    // ↑ AÑADE ESTOS CAMPOS A CADA LOG AUTOMÁTICAMENTE
    service: 'reportes-backend',
    environment: 'development',
    timestamp: new Date().toISOString(),
  },
  
  transports,  // ← Array con los 3 transports definidos arriba
});
```

**Qué pasa:**
- Cada log que llames, Winston aplica estos formatos globales primero
- Luego los pasa a cada transport (que puede aplicar sus propios formatos)
- Siempre incluye `defaultMeta` (service, environment, etc)

---

## 🔄 Flujo Cuando Llamas `logger.info()`

Ahora veremos línea por línea qué sucede desde que llamas:

```typescript
this.logger.info('Usuario autenticado', {
  userId: user.id,
  email: user.email,
  duration: '145ms',
});
```

### **Paso 1: Recepción en LoggerService.info()**

```typescript
info(message: string, meta?: any): void {
  this.logger.info(message, meta);  // ← Delega a Winston
}
```

---

### **Paso 2: Winston crea el Objeto Log Interno**

Winston internamente crea algo como:

```javascript
{
  level: 'info',              // ← Porque llamaste .info()
  message: 'Usuario autenticado',
  userId: user.id,            // ← De meta que pasaste
  email: user.email,
  duration: '145ms',
  
  // Winston AUTOMÁTICAMENTE AÑADE:
  service: 'reportes-backend',        // ← De defaultMeta
  environment: 'development',         // ← De defaultMeta
  timestamp: '2026-05-07T14:30:45.123Z', // ← De timestamp()
  
  // + cualquier otro campo agregado por formatos globales
}
```

---

### **Paso 3: Verificación de Nivel**

```
Winston compara: 'info' >= 'info' (logLevel de .env)
                   ✅ PASA → Procesa el log
                   
Si hubiera sido:   'debug' >= 'info'
                   ❌ FALLA → Ignora el log (no se ejecuta nada más)
```

---

### **Paso 4: Aplica Formatos Globales**

```typescript
// De: winston.format.combine(
//   winston.format.timestamp(),
//   winston.format.errors({ stack: true }),
//   winston.format.splat(),
//   winston.format.json(),
// )

// El objeto ahora es JSON-serializable y listo para transports
```

---

### **Paso 5: Envía a CADA Transport**

#### **Transport 1: Console**

```javascript
// Recibe el objeto log
{
  level: 'info',
  message: 'Usuario autenticado',
  userId: 123,
  ...
}

// Aplica: winston.format.colorize()
→ "info" se pone en CYAN (color)

// Aplica: winston.format.printf(...)
→ Transforma en:
   "2026-05-07 14:30:45 [info]: Usuario autenticado {
     "userId": 123,
     "email": "user@example.com",
     ...
   }"

// Escribe en: console.log() → STDOUT → Terminal
📺 VES EN LA TERMINAL INMEDIATAMENTE
```

#### **Transport 2: DailyRotateFile (combined)**

```javascript
// Recibe el mismo objeto log
{
  level: 'info',
  message: 'Usuario autenticado',
  userId: 123,
  ...
}

// Aplica: winston.format.json()
→ {"level":"info","message":"Usuario autenticado",...}

// Escribe en: ./logs/combined-2026-05-07.log
// OPERACIÓN ASINCRÓNICA (en background)

📄 APARECE EN EL ARCHIVO (cuando Winston termina de escribir)
```

#### **Transport 3: DailyRotateFile (error)**

```javascript
// Verifica: level === 'error'?
// En este caso: 'info' === 'error'? ❌ NO

// Por lo tanto: IGNORA este log, no escribe en error-*.log

✋ ESTO NO SE EJECUTA
```

---

## 🎯 Ejemplo Completo: Paso a Paso

Llamada en middleware:

```typescript
logger.info(`POST /api/v1/reports/ventas/buscar`, {
  method: 'POST',
  url: '/api/v1/reports/ventas/buscar',
  status: 200,
  duration: '145ms',
  ip: '127.0.0.1',
});
```

### **Objeto que Winston crea internamente:**

```javascript
{
  level: 'info',
  message: 'POST /api/v1/reports/ventas/buscar',
  method: 'POST',
  url: '/api/v1/reports/ventas/buscar',
  status: 200,
  duration: '145ms',
  ip: '127.0.0.1',
  
  // Agregados por defaultMeta + formatos globales:
  service: 'reportes-backend',
  environment: 'development',
  '@timestamp': '2026-05-07T14:30:45.123Z',
  symbol(for nodejs.util.inspect.custom): ...
}
```

### **Salida en CONSOLE:**

```
2026-05-07 14:30:45 [info]: POST /api/v1/reports/ventas/buscar {
  "method": "POST",
  "url": "/api/v1/reports/ventas/buscar",
  "status": 200,
  "duration": "145ms",
  "ip": "127.0.0.1",
  "service": "reportes-backend",
  "environment": "development"
}
```

### **Salida en ARCHIVO (./logs/combined-2026-05-07.log):**

```json
{"level":"info","message":"POST /api/v1/reports/ventas/buscar","method":"POST","url":"/api/v1/reports/ventas/buscar","status":200,"duration":"145ms","ip":"127.0.0.1","service":"reportes-backend","environment":"development","@timestamp":"2026-05-07T14:30:45.123Z"}
```

---

## 🚨 Caso: Error (status 500)

Llamada:

```typescript
logger.error('Búsqueda falló', error, {
  filtro,
  paso: 'queryExecution',
});
```

### **Objeto log:**

```javascript
{
  level: 'error',  // ← LEVEL CAMBIÓ
  message: 'Búsqueda falló',
  stack: 'Error: Connection refused\n    at ...',
  message: 'Connection refused',
  filtro: { año: 2025, mes: 5 },
  paso: 'queryExecution',
  service: 'reportes-backend',
  ...
}
```

### **Qué pasa en Transports:**

| Transport | ¿Se ejecuta? | Razón |
|-----------|------------|-------|
| Console | ✅ SÍ | `'error' >= 'info'` (nivel global es 'info') |
| DailyRotateFile (combined) | ✅ SÍ | `'error' >= 'info'` (level del transport es 'info') |
| DailyRotateFile (error) | ✅ SÍ | `'error' === 'error'` (level específico es 'error') |

### **Resultado:**

- Console: Muestra en ROJO + stack trace
- combined-*.log: Una línea JSON más
- error-*.log: Una línea JSON adicional (SOLO errores)

---

## ⚡ Rendimiento: ¿Es Asincrónico?

```typescript
this.logger.info('Mensaje');  // ← Esta línea retorna INMEDIATAMENTE

// La escritura a archivos sucede EN BACKGROUND
// Esto es eficiente porque no bloquea tu código
```

**Pero cuidado:**

```typescript
// Si el proceso muere inmediatamente:
this.logger.info('Log importante');
process.exit(0);  // ← El log PODRÍA NO escribirse

// Solución: Usar onModuleDestroy() para flush
async onModuleDestroy(): Promise<void> {
  await new Promise<void>((resolve) => {
    this.logger.on('finish', resolve);
    this.logger.end();  // ← Espera a que terminen escrituras
  });
}
```

---

## 📋 Resumen de Transports en TU Implementación

| Transport | Tipo | Destino | Formato | Nivel Filtro |
|-----------|------|---------|---------|-------------|
| **Console** | En-memoria | stdout (terminal) | Texto coloreado + printf | >= logLevel (.env) |
| **DailyRotateFile (combined)** | Archivo rotativo | `./logs/combined-*.log` | JSON puro | >= 'info' |
| **DailyRotateFile (error)** | Archivo rotativo | `./logs/error-*.log` | JSON puro | === 'error' |

---

## 🔑 Puntos Clave Para Memorizar

1. **Middleware captura**, **LoggerService delega a Winston**, **Winston distribuye a Transports**
2. **Cada transport formatea independientemente** (Console colorea, File JSON-ifica)
3. **Nivel actúa como filtro**: si 'info' < logLevel, se ignora
4. **defaultMeta se añade automáticamente** a todos los logs
5. **Escritura a archivos es asincrónica** (eficiente pero requiere flush en shutdown)
6. **Los archivos rotan automáticamente** por día y tamaño
7. **Sensible data se redacta** en http-logger.middleware.ts (antes de llamar logger.info)

---

## 🧪 Prueba: Inspecciona un Log Real

1. Asegúrate que el servidor está corriendo: `pnpm run start:dev`
2. Haz una llamada al API: `curl http://localhost:3000/api/v1`
3. Abre terminal en el proyecto:

```bash
# Ver últimos logs en tiempo real
tail -f generador-reportes-backend/logs/combined-*.log

# O ver los últimos 20 logs
tail -20 generador-reportes-backend/logs/combined-*.log
```

4. Verás algo como:
```json
{"level":"info","message":"GET /api/v1","method":"GET",...}
```

5. Ahora intenta un endpoint que genere error y revisa `error-*.log`
