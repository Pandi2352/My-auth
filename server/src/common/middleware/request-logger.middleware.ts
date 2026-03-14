import type { Request, Response, NextFunction } from 'express';
import { WinstonLoggerService } from '../logger/winston-logger.service.js';

export class RequestLoggerMiddleware {
    constructor(private readonly logger: WinstonLoggerService) {}

    use(req: Request, res: Response, next: NextFunction) {
        const start = Date.now();
        const { method, originalUrl } = req;

        res.on('finish', () => {
            const duration = Date.now() - start;
            const { statusCode } = res;
            const contentLength = res.get('content-length') || '-';

            const logLine = `${method} ${originalUrl} ${statusCode} ${contentLength} ${duration}ms`;

            if (statusCode >= 500) {
                this.logger.error(logLine, undefined, 'HTTP');
            } else if (statusCode >= 400) {
                this.logger.warn(logLine, 'HTTP');
            } else {
                this.logger.log(logLine, 'HTTP');
            }
        });

        next();
    }
}
