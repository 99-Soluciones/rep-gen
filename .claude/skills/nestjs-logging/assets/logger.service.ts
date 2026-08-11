import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private elasticsearchClient: Client | null = null;

  constructor(private configService: ConfigService) {
    this.initializeLogger();
  }

  private initializeLogger(): void {
    const nodeEnv = this.configService.get('NODE_ENV', 'development');
    const logLevel = this.configService.get('LOG_LEVEL', 'info');
    const logDir = this.configService.get('LOG_DIR', './logs');
    const elkEnabled = this.configService.get('ELK_ENABLED', false) === 'true';
    const elkHost = this.configService.get('ELK_HOST', 'localhost');
    const elkPort = this.configService.get('ELK_PORT', 9200);

    const transports: winston.transport[] = [
      // Console transport
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
            return `${timestamp} [${level}]: ${message} ${metaStr}`;
          }),
        ),
      }),

      // Error file transport (daily rotation)
      new DailyRotateFile({
        filename: `${logDir}/error-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: 14,
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),

      // Combined file transport (daily rotation)
      new DailyRotateFile({
        filename: `${logDir}/combined-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: 14,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ];

    // Add ELK transport if enabled
    if (elkEnabled) {
      this.elasticsearchClient = new Client({
        node: `http://${elkHost}:${elkPort}`,
      });

      transports.push(
        new ElasticsearchTransport({
          level: 'info',
          clientOpts: { node: `http://${elkHost}:${elkPort}` },
          index: `logs-${this.getServiceName()}`,
        } as any),
      );
    }

    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
      ),
      defaultMeta: {
        service: this.getServiceName(),
        environment: nodeEnv,
        timestamp: new Date().toISOString(),
      },
      transports,
    });
  }

  log(message: string, context?: string, meta?: any): void {
    this.logger.info(message, {
      context,
      ...meta,
    });
  }

  error(message: string, trace?: string | Error, meta?: any): void {
    const error = trace instanceof Error ? trace : new Error(trace);
    this.logger.error(message, {
      stack: error.stack,
      message: error.message,
      ...meta,
    });
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  verbose(message: string, meta?: any): void {
    this.logger.info(message, { level: 'verbose', ...meta });
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  private getServiceName(): string {
    return this.configService.get('SERVICE_NAME', 'reportes-backend');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.elasticsearchClient) {
      await this.elasticsearchClient.close();
    }
    await new Promise<void>((resolve) => {
      this.logger.on('finish', resolve);
      this.logger.end();
    });
  }
}

// ElasticsearchTransport implementation for Winston
class ElasticsearchTransport extends winston.Transport {
  private client: Client;
  private index: string;

  constructor(options: any) {
    super(options);
    this.client = new Client(options.clientOpts);
    this.index = options.index;
  }

  async log(info: any, callback: Function): Promise<void> {
    try {
      await this.client.index({
        index: `${this.index}-${new Date().toISOString().split('T')[0]}`,
        body: {
          ...info,
          '@timestamp': new Date().toISOString(),
        },
      });
      callback();
    } catch (error) {
      callback(error);
    }
  }
}
