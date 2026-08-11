# Winston Logger Configuration Reference

## Log Levels

Winston uses the following log levels (in order of severity):

```
error:   0
warn:    1
info:    2
http:    3
debug:   4
```

Only logs at or above the configured level are logged. For example, if level is 'info', then error, warn, and info are logged, but http and debug are not.

## Environment Variables

Configure logging behavior via `.env`:

```env
# Core logging
NODE_ENV=development                 # development | production | test
LOG_LEVEL=info                       # error | warn | info | http | debug
LOG_DIR=./logs                       # Directory for log files
SERVICE_NAME=reportes-backend        # Service identifier in logs

# ELK Stack (optional)
ELK_ENABLED=false                    # true | false
ELK_HOST=localhost                   # Elasticsearch host
ELK_PORT=9200                        # Elasticsearch port
```

## Log Formats

### Development (Console)

Colorized, human-readable format:

```
2024-05-07 14:23:45 [info]: User authentication successful {"userId":123,"email":"user@example.com"}
2024-05-07 14:23:46 [error]: Database connection failed {"error":"ECONNREFUSED","port":5432}
```

### Production (File)

JSON format for structured logging:

```json
{
  "level": "info",
  "message": "User authentication successful",
  "timestamp": "2024-05-07T14:23:45.123Z",
  "service": "reportes-backend",
  "environment": "production",
  "userId": 123,
  "email": "user@example.com"
}
```

## Transports Configuration

### Console Transport

Used in development for immediate visibility:

```typescript
new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
      return `${timestamp} [${level}]: ${message} ${metaStr}`;
    }),
  ),
})
```

### File Transport (Daily Rotation)

Automatically creates new files daily:

```typescript
new DailyRotateFile({
  filename: `${logDir}/combined-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',           // Create new file each day
  maxSize: '20m',                      // Rotate if file exceeds 20MB
  maxFiles: 14,                        // Keep 14 days of logs
  level: 'info',                       // Only log 'info' and above
  format: winston.format.json(),       // JSON format
})
```

### Elasticsearch Transport

For centralized log aggregation (requires ELK Stack running):

```typescript
new ElasticsearchTransport({
  level: 'info',
  clientOpts: { node: 'http://localhost:9200' },
  index: 'logs-reportes-backend',     // Index name pattern
})
```

## Customizing Formats

### Add Custom Fields to All Logs

```typescript
defaultMeta: {
  service: 'reportes-backend',
  environment: process.env.NODE_ENV,
  hostname: os.hostname(),
  version: packageJson.version,
}
```

### Custom Format Function

```typescript
const customFormat = winston.format.printf(
  ({ timestamp, level, message, ...rest }) => {
    const context = rest.context || 'APP';
    return `[${timestamp}] ${level.toUpperCase()} [${context}] ${message}`;
  },
);
```

### Stack Trace Formatting

```typescript
winston.format.errors({ stack: true })  // Include stack traces
```

## Usage Examples

### Basic Logging

```typescript
this.logger.info('Operation started', { operation: 'fetchUsers' });
this.logger.warn('Performance issue', { duration: '2000ms' });
this.logger.error('Operation failed', error, { retries: 3 });
```

### Contextual Logging

```typescript
this.logger.log('User logged in', 'AuthService', {
  userId: user.id,
  email: user.email,
  timestamp: new Date(),
});
```

### Structured Metadata

```typescript
this.logger.info('API request completed', {
  method: 'GET',
  path: '/api/users',
  statusCode: 200,
  duration: '145ms',
  requestId: 'abc-123-def',
});
```

## Performance Tuning

### Optimize for Production

```env
LOG_LEVEL=warn                        # Only log warnings and errors
LOG_DIR=/var/log/app                  # Use faster disk location
```

### Reduce File I/O

```typescript
// Batch write logs (default: immediate)
new DailyRotateFile({
  maxSize: '50m',        // Larger file size before rotation
  maxFiles: 30,          // Keep longer history
})
```

### Sampling Non-Critical Logs

```typescript
// Only log 10% of debug messages in production
if (process.env.NODE_ENV === 'production' && Math.random() > 0.1) {
  return;
}
this.logger.debug('Detailed debug info', meta);
```

## Error Handling

### Unhandled Exceptions

The logger automatically captures:
- Uncaught exceptions
- Unhandled promise rejections
- NestJS filter-caught errors

```typescript
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', new Error(String(reason)));
});
```

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Error Rate**: `level: 'error'` count per hour
2. **Response Time**: `duration` field in HTTP logs
3. **Failed Requests**: `status >= 400`
4. **Database Errors**: Logs containing 'ECONNREFUSED'

### Kibana Alert Example

Create alert when error rate exceeds 10/hour:

```json
{
  "trigger": {
    "schedule": { "interval": "5m" }
  },
  "input": {
    "search": {
      "request": {
        "indices": ["logs-*"],
        "body": {
          "query": {
            "range": {
              "@timestamp": {
                "gte": "now-1h"
              }
            }
          },
          "aggs": {
            "error_count": {
              "filter": {
                "match": { "level": "error" }
              }
            }
          }
        }
      }
    }
  },
  "condition": {
    "threshold": { "value": 10 }
  }
}
```

## Troubleshooting

### Logs Not Appearing

1. Check log level: `console.log(process.env.LOG_LEVEL)`
2. Verify directory exists: `ls -la ./logs`
3. Check permissions: `chmod 755 ./logs`
4. Review file size limits

### High Disk Usage

- Reduce `maxFiles` to keep fewer days
- Decrease `maxSize` threshold
- Set lower `LOG_LEVEL` (e.g., 'warn' instead of 'info')

### Elasticsearch Connection Issues

```bash
# Test connection
curl -v http://localhost:9200

# Check Elasticsearch logs
docker-compose logs elasticsearch
```

### Performance Degradation

1. Reduce logging frequency
2. Implement sampling for debug logs
3. Check file system I/O
4. Monitor Elasticsearch disk usage

## Best Practices

1. ✅ Always include context in logs
2. ✅ Use appropriate log levels
3. ✅ Avoid logging sensitive data (passwords, tokens)
4. ✅ Include request IDs for tracing
5. ✅ Rotate logs to prevent disk fills
6. ✅ Monitor log volume in production
7. ❌ Don't log inside tight loops
8. ❌ Don't change log level at runtime
9. ❌ Don't log stack traces for known errors
