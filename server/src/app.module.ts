import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { databaseConfig } from './config/database.config.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UserModule } from './modules/user/user.module.js';
import { PermissionModule } from './modules/permission/permission.module.js';
import { RoleModule } from './modules/role/role.module.js';
import { SeedModule } from './modules/seed/seed.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { SessionModule } from './modules/session/session.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { AuditInterceptor } from './modules/audit/audit.interceptor.js';
import { AnalyticsModule } from './modules/analytics/analytics.module.js';
import { GroupModule } from './modules/group/group.module.js';
import { SystemConfigModule } from './modules/system-config/system-config.module.js';
import { InvitationModule } from './modules/invitation/invitation.module.js';
import { ApiKeyModule } from './modules/api-key/api-key.module.js';
import { SocialAuthModule } from './modules/social-auth/social-auth.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { CaptchaModule } from './modules/captcha/captcha.module.js';
import { AdvertisementModule } from './modules/advertisement/advertisement.module.js';
import { CustomFieldModule } from './modules/custom-field/custom-field.module.js';
import { InAppNotificationModule } from './modules/in-app-notification/in-app-notification.module.js';
import { SystemHealthMetricsModule } from './modules/admin/system-health.module.js';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { PermissionsGuard } from './common/guards/permissions.guard.js';
import { IpBlockGuard } from './common/guards/ip-block.guard.js';
import { SystemHealthInterceptor } from './modules/admin/system-health.interceptor.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    MongooseModule.forRoot(databaseConfig().uri, {
      autoIndex: databaseConfig().autoIndex,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    PermissionModule,
    RoleModule,
    SeedModule,
    AdminModule,
    SessionModule,
    AuditModule,
    AnalyticsModule,
    GroupModule,
    SystemConfigModule,
    InvitationModule,
    ApiKeyModule,
    SocialAuthModule,
    HealthModule,
    CaptchaModule,
    AdvertisementModule,
    CustomFieldModule,
    InAppNotificationModule,
    SystemHealthMetricsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: IpBlockGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_INTERCEPTOR, useClass: SystemHealthInterceptor },
  ],
})
export class AppModule {}
