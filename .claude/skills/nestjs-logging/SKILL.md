---
name: nestjs-logging
description: 'Implement Winston logging in NestJS with ELK Stack integration for centralized error visualization. Use when: setting up comprehensive logging (errors, warnings, info), configuring structured logs for monitoring, integrating with Elasticsearch/Kibana dashboards, debugging production issues.'
argument-hint: 'Optional: specify log levels (error|warn|info|debug) or destination (file|elk|both)'
user-invocable: true
---

# NestJS Logging with Winston + ELK Stack

## When to Use

- Setting up new NestJS applications with comprehensive logging
- Migrating to centralized error monitoring
- Implementing structured JSON logging for production
- Creating dashboards in Kibana for error analysis
- Debugging and monitoring multi-service architectures

## What This Skill Does

Implements a production-ready logging system that:
- ✅ Captures errors, warnings, and info across all services
- ✅ Generates structured JSON logs for ELK Stack ingestion
- ✅ Writes logs to rotating files (daily rotation)
- ✅ Provides console output for development
- ✅ Integrates with NestJS modules via injectable logger
- ✅ Auto-logs HTTP requests and responses
- ✅ Captures unhandled exceptions and promise rejections
- ✅ Supports environment-based configuration

## Step-by-Step Implementation

### 1. **Install Dependencies**

Run the setup script to install all required packages:

```bash
node .github/skills/nestjs-logging/scripts/install-logging-deps.mjs
```

Or manually:
```bash
pnpm add @nestjs/config winston winston-daily-rotate-file @elastic/elasticsearch
pnpm add -D @types/node
```

### 2. **Create Logger Configuration**

Copy the logger configuration module template:
- [winston.config.ts](./assets/winston.config.ts) → `src/config/winston.config.ts`

Set environment variables in `.env`:
```
LOG_LEVEL=info
LOG_DIR=./logs
ELK_ENABLED=true
ELK_HOST=localhost
ELK_PORT=9200
NODE_ENV=development
```

### 3. **Create Logger Service**

Copy the custom logger service:
- [logger.service.ts](./assets/logger.service.ts) → `src/common/logger/logger.service.ts`
- [logger.module.ts](./assets/logger.module.ts) → `src/common/logger/logger.module.ts`

### 4. **Register Logger in App Module**

Update [app.module.ts](../../app.module.ts):
```typescript
import { LoggerModule } from './common/logger/logger.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    // ... other modules
  ],
})
export class AppModule {}
```

### 5. **Use Logger in Services**

Inject and use the logger in any service:
```typescript
import { LoggerService } from './common/logger/logger.service';

@Injectable()
export class MyService {
  constructor(private readonly logger: LoggerService) {}

  doSomething() {
    this.logger.info('Operation started', { operation: 'doSomething' });
    
    try {
      // ... business logic
      this.logger.info('Operation completed', { status: 'success' });
    } catch (error) {
      this.logger.error('Operation failed', error, { operation: 'doSomething' });
    }
  }
}
```

### 6. **Enable HTTP Request Logging (Optional)**

Create middleware for automatic HTTP logging:
- [http-logger.middleware.ts](./assets/http-logger.middleware.ts) → `src/common/logger/http-logger.middleware.ts`

Register in [main.ts](../../main.ts):
```typescript
import { HttpLoggerMiddleware } from './common/logger/http-logger.middleware';

async function bootstrap() {
  const app = createNestApplication();
  app.use(HttpLoggerMiddleware);
  // ... rest of setup
}
```

### 7. **Configure ELK Stack (Production)**

See [ELK Setup Guide](./references/elk-stack-setup.md) for:
- Docker Compose configuration
- Elasticsearch initialization
- Kibana dashboard creation
- Index pattern setup

### 8. **Test Logging**

See [Testing Guide](./references/testing-logging.md) for:
- Unit test examples
- Log verification strategies
- Mock logger setup

## Log Directory Structure

Logs are organized by level and date:
```
./logs/
├── combined-2024-05-07.log
├── error-2024-05-07.log
├── warn-2024-05-07.log
└── info-2024-05-07.log
```

Each file rotates daily and keeps 14 days of history.

## ELK Stack Integration

Once ELK is running:

1. **Verify Logs in Elasticsearch**:
   ```bash
   curl http://localhost:9200/_cat/indices
   ```

2. **Create Kibana Index Pattern**:
   - Go to Kibana: http://localhost:5601
   - Stack Management → Index Patterns → Create Pattern
   - Pattern: `logs-*`
   - Time field: `@timestamp`

3. **View Logs in Kibana**:
   - Discover → Select `logs-*` index
   - Filter by `level: error` or `service: your-app`

## Configuration Reference

See [Winston Configuration](./references/winston-config.md) for:
- Available log levels
- Transport options
- Format customization
- Performance tuning

## Understanding the Architecture

Want to understand how logging works internally? Choose your learning style:

- **Visual Learner?** → [Winston Deep Dive](./references/winston-deep-dive.md) - Flow diagrams, before/after examples, step-by-step execution walkthrough
- **Code-First Learner?** → [Winston Cheat Sheet](./references/winston-cheatsheet.md) - Line-by-line code analysis, exact mapeo with file paths, quick reference

Both cover:
- Step-by-step flow from HTTP request to log output
- How transports work (Console, File, ELK)
- When logs are written (async behavior)
- Performance considerations
- Complete code analysis

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Logs not appearing in Kibana | Check ELK_ENABLED, verify ES connection, check index pattern |
| File permission errors | Ensure write access to LOG_DIR, verify user permissions |
| High disk usage | Adjust maxFiles/maxSize in winston config |
| Missing request logs | Verify HttpLoggerMiddleware is registered before other middleware |

## Next Steps

- [ ] Set up ELK Stack monitoring (see references)
- [ ] Create Kibana dashboards for error rates
- [ ] Configure alerts for critical errors
- [ ] Implement custom log formatters
- [ ] Add performance metrics logging
