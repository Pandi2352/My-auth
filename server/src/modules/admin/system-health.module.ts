import { Module, Global } from '@nestjs/common';
import { SystemHealthMetricsService, SystemHealthGateway } from './system-health.service.js';

@Global()
@Module({
  providers: [SystemHealthMetricsService, SystemHealthGateway],
  exports: [SystemHealthMetricsService],
})
export class SystemHealthMetricsModule {}
