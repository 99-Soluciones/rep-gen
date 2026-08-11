# Testing Logging in NestJS

## Unit Testing Logger Service

### Test Setup

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [LoggerService],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

### Test Logging Methods

```typescript
describe('LoggerService methods', () => {
  it('should log info messages', () => {
    const spy = jest.spyOn(console, 'log');
    
    service.log('Test message', 'TestContext');
    
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should log errors with stack trace', () => {
    const error = new Error('Test error');
    const spy = jest.spyOn(console, 'error');
    
    service.error('Error occurred', error);
    
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should log warnings', () => {
    const spy = jest.spyOn(console, 'warn');
    
    service.warn('Warning message', { key: 'value' });
    
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should log debug messages', () => {
    const spy = jest.spyOn(console, 'debug');
    
    service.debug('Debug message', { details: 'info' });
    
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
```

## Mocking Logger in Service Tests

```typescript
describe('UserService', () => {
  let service: UserService;
  let mockLogger: { log: jest.Mock; error: jest.Mock };

  beforeEach(async () => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should log when user is created', async () => {
    const user = { id: 1, name: 'Test User' };
    
    await service.createUser(user);
    
    expect(mockLogger.log).toHaveBeenCalledWith(
      'User created',
      expect.objectContaining({ userId: user.id }),
    );
  });

  it('should log error on creation failure', async () => {
    const error = new Error('Database error');
    
    jest.spyOn(db, 'insert').mockRejectedValueOnce(error);
    
    await expect(service.createUser({})).rejects.toThrow();
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
```

## Integration Testing

### Test with Real Logger

```typescript
describe('LoggerService Integration', () => {
  let service: LoggerService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env.test',
          isGlobal: true,
        }),
      ],
      providers: [LoggerService],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should write logs to file', async () => {
    const fs = require('fs');
    const logDir = configService.get('LOG_DIR');

    service.log('Integration test message');

    // Wait for file write
    await new Promise((resolve) => setTimeout(resolve, 100));

    const files = fs.readdirSync(logDir);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should respect log level configuration', () => {
    const infoSpy = jest.spyOn(service, 'info');
    const debugSpy = jest.spyOn(service, 'debug');

    service.info('Info message');
    service.debug('Debug message');

    expect(infoSpy).toHaveBeenCalled();
    // Debug might not be called if log level is 'info'
  });
});
```

## E2E Testing with Logger

```typescript
describe('App (e2e)', () => {
  let app: INestApplication;
  let logger: LoggerService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    logger = app.get(LoggerService);
    await app.init();
  });

  it('should log HTTP requests', (done) => {
    const spy = jest.spyOn(logger, 'info');

    request(app.getHttpServer())
      .get('/api/users')
      .expect(200)
      .end(() => {
        // Give some time for async logging
        setTimeout(() => {
          expect(spy).toHaveBeenCalledWith(
            expect.stringContaining('GET'),
            expect.any(Object),
          );
          spy.mockRestore();
          done();
        }, 100);
      });
  });

  it('should log errors on 500', (done) => {
    const spy = jest.spyOn(logger, 'error');

    request(app.getHttpServer())
      .get('/api/error')
      .expect(500)
      .end(() => {
        setTimeout(() => {
          expect(spy).toHaveBeenCalled();
          spy.mockRestore();
          done();
        }, 100);
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

## Verifying Logs in Kibana

### 1. Check Elasticsearch Indices

```bash
curl -X GET "localhost:9200/_cat/indices?v"
```

Look for indices matching `logs-*` pattern.

### 2. Query Recent Logs

```bash
curl -X GET "localhost:9200/logs-*/_search?pretty" \
  -H 'Content-Type: application/json' \
  -d'{
    "size": 10,
    "query": {
      "range": {
        "@timestamp": {
          "gte": "now-1h"
        }
      }
    }
  }'
```

### 3. Check for Specific Service

```bash
curl -X GET "localhost:9200/logs-*/_search?pretty" \
  -H 'Content-Type: application/json' \
  -d'{
    "query": {
      "match": {
        "service": "reportes-backend"
      }
    }
  }'
```

## Test Configuration

Create `.env.test`:

```env
NODE_ENV=test
LOG_LEVEL=debug
LOG_DIR=./logs/test
ELK_ENABLED=false
SERVICE_NAME=reportes-backend-test
```

## Performance Testing

### Load Test Logging

```typescript
describe('Logger Performance', () => {
  it('should handle high volume logs efficiently', async () => {
    const startTime = Date.now();
    const logCount = 10000;

    for (let i = 0; i < logCount; i++) {
      service.log(`Log message ${i}`, undefined, { index: i });
    }

    const duration = Date.now() - startTime;
    const logsPerSecond = (logCount / duration) * 1000;

    console.log(`Logged ${logCount} messages in ${duration}ms`);
    console.log(`Performance: ${logsPerSecond.toFixed(0)} logs/second`);

    expect(logsPerSecond).toBeGreaterThan(1000); // At least 1000 logs/sec
  });
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Logging

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      elasticsearch:
        image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
        env:
          discovery.type: single-node
          ES_JAVA_OPTS: -Xms256m -Xmx256m
        options: >-
          --health-cmd "curl http://localhost:9200/_cluster/health"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 9200:9200

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: pnpm install
      - run: pnpm test
        env:
          ELK_ENABLED: true
          ELK_HOST: localhost
          ELK_PORT: 9200
```
