import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResultEntity } from '../../utils/reponseUtils/ResultEntity.js';
import { HttpStatus } from '../../utils/reponseUtils/httpStatus.js';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                const res = context.switchToHttp().getResponse();
                const statusCode = res.statusCode || HttpStatus.OK;

                const result = new ResultEntity({ sucess: true, code: statusCode });
                result.setData({
                    code: statusCode,
                    data,
                    description: data?.message,
                    meta_data: data?.meta_data,
                });

                // Remove nested message/meta_data from data if they exist at root
                if (result.data && typeof result.data === 'object') {
                    if (result.data.meta_data) {
                        result.meta_data = result.data.meta_data;
                        delete result.data.meta_data;
                    }
                }

                result.prepareResponse();
                return result;
            }),
        );
    }
}
