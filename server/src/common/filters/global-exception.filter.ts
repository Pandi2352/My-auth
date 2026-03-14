import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
} from '@nestjs/common';
import { ResultEntity } from '../../utils/reponseUtils/ResultEntity.js';
import { ErrorEntity } from '../../utils/reponseUtils/ErrorEntity.js';
import { HttpStatus } from '../../utils/reponseUtils/httpStatus.js';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();

        const result = new ResultEntity({ sucess: false });

        if (exception instanceof ErrorEntity) {
            // Our custom ErrorEntity
            result.setError({ error: exception });
        } else if (exception instanceof HttpException) {
            // NestJS built-in exceptions (ValidationPipe, AuthGuard, etc.)
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            let error_description: string;
            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const resp = exceptionResponse as any;
                // class-validator returns message as array
                if (Array.isArray(resp.message)) {
                    error_description = resp.message.join(', ');
                } else {
                    error_description = resp.message || exception.message;
                }
            } else {
                error_description = String(exceptionResponse);
            }

            const errorEntity = new ErrorEntity({
                http_code: status,
                error: this.getErrorName(status),
                error_description,
            });
            result.setError({ error: errorEntity });
        } else {
            // Unknown errors
            console.error('Unhandled exception:', exception);
            const errorEntity = new ErrorEntity({
                http_code: HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'internal_server_error',
                error_description: 'An unexpected error occurred',
                internal_error: exception?.message || String(exception),
            });
            result.setError({ error: errorEntity });
        }

        result.prepareResponse();

        const httpCode = result.code || HttpStatus.INTERNAL_SERVER_ERROR;
        response.status(httpCode).json(result);
    }

    private getErrorName(status: number): string {
        switch (status) {
            case HttpStatus.BAD_REQUEST: return 'bad_request';
            case HttpStatus.UNAUTHORIZED: return 'unauthorized';
            case HttpStatus.FORBIDDEN: return 'forbidden';
            case HttpStatus.NOT_FOUND: return 'not_found';
            case HttpStatus.CONFLICT: return 'conflict';
            case HttpStatus.UNPROCESSABLE_ENTITY: return 'validation_error';
            case HttpStatus.TOO_MANY_REQUESTS: return 'too_many_requests';
            default: return 'error';
        }
    }
}
