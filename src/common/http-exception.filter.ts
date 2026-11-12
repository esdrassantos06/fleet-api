import {
  ExceptionFilter,
  HttpException,
  Catch,
  ArgumentsHost,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const exceptionRes = exception.getResponse();

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    let msg: string | string[];

    if (typeof exceptionRes === 'string') {
      msg = exceptionRes;
    } else {
      msg = (exceptionRes as { message: string | string[] }).message;
    }
    response.status(status).json({
      statusCode: status,
      message: msg,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
