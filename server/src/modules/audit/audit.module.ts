import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema.js';
import { AuditService } from './audit.service.js';
import { AuditController } from './audit.controller.js';
import { AuditInterceptor } from './audit.interceptor.js';
import { AuditGateway } from './audit.gateway.js';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }]),
    ],
    controllers: [AuditController],
    providers: [AuditService, AuditInterceptor, AuditGateway],
    exports: [AuditService, AuditInterceptor, AuditGateway],
})
export class AuditModule {}
