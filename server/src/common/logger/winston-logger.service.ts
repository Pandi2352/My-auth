import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const devFormat = combine(
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ timestamp, level, message, context, stack, ...meta }) => {
        const ctx = context ? `[${context}]` : '';
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} ${level} ${ctx} ${stack || message}${metaStr}`;
    }),
);

const prodFormat = combine(
    timestamp(),
    errors({ stack: true }),
    json(),
);

@Injectable()
export class WinstonLoggerService implements NestLoggerService {
    private readonly logger: winston.Logger;

    constructor() {
        const isProd = process.env.NODE_ENV === 'production';
        const level = process.env.LOG_LEVEL || (isProd ? 'info' : 'debug');

        const transports: winston.transport[] = [
            new winston.transports.Console({
                format: isProd ? prodFormat : devFormat,
            }),
        ];

        if (isProd) {
            transports.push(
                new winston.transports.File({
                    filename: 'logs/error.log',
                    level: 'error',
                    maxsize: 10 * 1024 * 1024, // 10MB
                    maxFiles: 5,
                    format: prodFormat,
                }),
                new winston.transports.File({
                    filename: 'logs/combined.log',
                    maxsize: 10 * 1024 * 1024,
                    maxFiles: 10,
                    format: prodFormat,
                }),
            );
        }

        this.logger = winston.createLogger({ level, transports });
    }

    log(message: any, context?: string) {
        this.logger.info(message, { context });
    }

    error(message: any, trace?: string, context?: string) {
        this.logger.error(message, { trace, context });
    }

    warn(message: any, context?: string) {
        this.logger.warn(message, { context });
    }

    debug(message: any, context?: string) {
        this.logger.debug(message, { context });
    }

    verbose(message: any, context?: string) {
        this.logger.verbose(message, { context });
    }
}
