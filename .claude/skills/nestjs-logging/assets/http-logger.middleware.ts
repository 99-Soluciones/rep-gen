import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from './logger.service';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const startTime = Date.now();

    // Capture response data
    const originalSend = res.send;
    res.send = function (data: any) {
      const duration = Date.now() - startTime;
      const status = res.statusCode;

      this.logger.info(`${method} ${originalUrl}`, {
        method,
        url: originalUrl,
        status,
        duration: `${duration}ms`,
        ip,
        userAgent: req.get('user-agent'),
        body: this.sanitizeBody(req.body),
      });

      if (status >= 400) {
        this.logger.warn(`HTTP ${status} - ${method} ${originalUrl}`, {
          method,
          url: originalUrl,
          status,
          duration: `${duration}ms`,
          ip,
        });
      }

      return originalSend.call(this, data);
    };

    next();
  }

  private sanitizeBody(body: any): any {
    if (!body) return undefined;

    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];
    const sanitized = { ...body };

    sensitiveFields.forEach((field) => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
