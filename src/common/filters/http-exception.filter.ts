import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { toFa } from './fa-errors';

@Catch()
export class FaExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw: any = exception.getResponse();
      const msg = typeof raw === 'string' ? raw : (raw.message ?? raw.error ?? exception.message);
      const msgs: string[] = Array.isArray(msg) ? msg : [String(msg)];
      const faMsgs = msgs.map(toFa);
      const faMessage: any = Array.isArray(msg) ? faMsgs : faMsgs[0];
      const body: any = typeof raw === 'object' && raw !== null ? { ...raw } : { message: raw };
      body.message = faMessage;
      body.messageFa = faMessage;
      if (Array.isArray(msg)) body.messageFa = faMsgs;
      return res.status(status).json({
        statusCode: status,
        message: body.message,
        messageFa: body.messageFa,
        error: body.error ? toFa(String(body.error)) : undefined,
        path: req?.url,
      });
    }

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof Error ? exception.message : 'Internal Server Error';
    return res.status(status).json({
      statusCode: status,
      message: toFa(message),
      messageFa: toFa(message),
      error: toFa('Internal Server Error'),
      path: req?.url,
    });
  }
}
