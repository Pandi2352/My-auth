import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SystemHealthMetricsService } from './system-health.service.js';

@Injectable()
export class SystemHealthInterceptor implements NestInterceptor {
  constructor(private healthService: SystemHealthMetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    return next.handle().pipe(
      tap(() => {
        const latency = Date.now() - start;
        this.healthService.recordRequest(latency);
      }),
    );
  }
}
