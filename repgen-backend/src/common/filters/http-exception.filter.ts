/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (res && typeof res === 'object' && 'message' in res) {
        // message can be string or array
        // keep minimal information for clients
        // if it's an array, join into a single string
        // otherwise use the string value
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const m = res.message;
        message = Array.isArray(m) ? m.join(', ') : String(m);
      }
    }

    // Log full exception server-side for diagnostics
    this.logger.error({
      path: request?.url,
      method: request?.method,
      status,
      message:
        exception instanceof Error
          ? (exception.stack ?? exception.message)
          : exception,
    });

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request?.url,
      message,
    });
  }
}
