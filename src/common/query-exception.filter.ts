import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response, Request } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class QueryExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const code = (exception.driverError as { code?: string }).code;

    let msg: string;
    let status: number;

    if (code === '23505') {
      status = 409;
      msg = 'Resource already exists';
    } else {
      status = 500;
      msg = 'Internal server error';
    }

    response.status(status).json({
      statusCode: status,
      message: msg,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
