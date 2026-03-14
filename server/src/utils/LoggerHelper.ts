import * as winston from 'winston';
import { Logger } from 'winston';
import { ConfigPathResolver } from './config-resolver-util/ConfigPathResolver';
import { GoogleCloudLogger } from './GoogleCloudLogger';

/**
 * LoggerHelper is a singleton class that provides logging functionalities.
 * It supports logging to file, Google Cloud, and console based on environment configurations.
 */
export class LoggerHelper {
    private static _instance: LoggerHelper;

    logger: Logger;

    private constructor() {
        this.logger = this.prepareLogger();
    }

    /**
     * Gets the singleton instance of LoggerHelper.
     * @returns {LoggerHelper} The singleton instance.
     */
    static get Instance(): LoggerHelper {
        return this._instance || (this._instance = new LoggerHelper());
    }

    /**
     * Logs an info message.
     * @param {string} request_id - The request ID for tracking.
     * @param {string} message - The message to log.
     * @param {any} data - Additional data to log.
     */
    info(request_id: string, message: string, data: any = null): void {
        this.logger.info(this.prepareLogPayload(request_id, message, data));
    }

    /**
     * Logs an error message.
     * @param {string} request_id - The request ID for tracking.
     * @param {string} message - The message to log.
     * @param {any} data - Additional data to log.
     */
    error(request_id: string, message: string, data: any = null): void {
        this.logger.error(this.prepareLogPayload(request_id, message, data));
    }

    /**
     * Logs a warning message.
     * @param {string} request_id - The request ID for tracking.
     * @param {string} message - The message to log.
     * @param {any} data - Additional data to log.
     */
    warn(request_id: string, message: string, data: any = null): void {
        this.logger.warn(this.prepareLogPayload(request_id, message, data));
    }

    /**
     * Logs a debugging message.
     * @param {string} request_id - The request ID for tracking.
     * @param {string} message - The message to log.
     * @param {any} data - Additional data to log.
     */
    debug(request_id: string, message: string, data: any = null): void {
        this.logger.debug(this.prepareLogPayload(request_id, message, data));
    }

    /**
     * Logs a verbose message.
     * @param {string} request_id - The request ID for tracking.
     * @param {string} message - The message to log.
     * @param {any} data - Additional data to log.
     */
    verbose(request_id: string, message: string, data: any = null): void {
        this.logger.verbose(this.prepareLogPayload(request_id, message, data));
    }

    /**
     * Prepares the log payload by adding the request ID to the data.
     * @param {string} request_id - The request ID for tracking.
     * @param {string} message - The message to log.
     * @param {any} data - Additional data to log.
     * @returns {object} The prepared log payload.
     */
    private prepareLogPayload(request_id: string, message: string, data: any): object {
        if (!data) {
            data = {};
        }
        return { message, data: { ...data, x_request_id: request_id } };
    }

    /**
     * Prepares the Winston logger with the configured transports.
     * @returns {Logger} The configured Winston logger.
     */
    private prepareLogger(): Logger {
        const transports: winston.transport[] = [];

        if (process.env.FILE_LOGGER_ENABLED !== 'false') {
            const log_base_path = ConfigPathResolver.Instance.resolvePath("logs") || "/logs";
            const DailyRotateFile = require('winston-daily-rotate-file');
            transports.push(new DailyRotateFile({
                filename: `${log_base_path}/combined-%DATE%.log`,
                datePattern: 'DD-MM-HH',
                zippedArchive: true,
                maxSize: '10m',
                maxFiles: '7d'
            }));
        }

        if (process.env.GOOGLE_CLOUD_LOGGER_ENABLED) {
            transports.push(GoogleCloudLogger.Instance.loggingWinston);
        }

        const logger = winston.createLogger({
            exitOnError: false,
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
                winston.format.printf(this.transformMessage)
            ),
            defaultMeta: {
                service: process.env.LOGGER_SERVICE_NAME || '',
                instance: process.env.HOSTNAME || ''
            },
            transports
        });

        if (process.env.CONSOLE_LOG !== 'false') {
            logger.add(new winston.transports.Console({
                format: winston.format.simple(),
            }));
        }

        return logger;
    }

    /**
     * Transforms the log message to a string format.
     * @param {any} info - The log information.
     * @returns {string} The transformed log message.
     */
    private transformMessage(info: any): string {
        try {
            if (typeof info.message === 'object') {
                const obj = info.message.req ? {
                    url: info.message.req.url,
                    body: info.message.req.body,
                    id: info.message.req.id,
                    query: info.message.req.query,
                    ip: info.message.req.ip,
                    method: info.message.req.method,
                    protocol: info.message.req.protocol,
                    headers: info.message.req.headers,
                    x_request_id: info.message.req.headers ? info.message.req.headers["x-request-id"] : "",
                } : info.message.res ? {
                    url: info.message.res.request.url,
                    body: info.message.res.request.body,
                    id: info.message.res.request.id,
                    query: info.message.res.request.query,
                    ip: info.message.res.request.ip,
                    method: info.message.res.request.method,
                    protocol: info.message.res.request.protocol,
                    headers: info.message.res.request.headers,
                    response_time: info.message.responseTime,
                    x_request_id: info.message.res.request.headers ? info.message.res.request.headers["x-request-id"] : "",
                } : info.message;

                info.message = JSON.stringify(obj);
            }
        } catch (error) {
            console.error(error);
        }
        // Include data field in output
        const dataStr = info.data ? ` | ${JSON.stringify(info.data)}` : '';
        return `${info.timestamp} [${info.service || info.label || 'app'}] ${info.level}: ${info.message}${dataStr}`;
    }
}