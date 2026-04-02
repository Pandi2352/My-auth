import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PermissionModule } from './modules/permission/permission.module';
import { RoleModule } from './modules/role/role.module';
import { SeedModule } from './modules/seed/seed.module';
import { AdminModule } from './modules/admin/admin.module';
import { SessionModule } from './modules/session/session.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuditInterceptor } from './modules/audit/audit.interceptor';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { GroupModule } from './modules/group/group.module';
import { SystemConfigModule } from './modules/system-config/system-config.module';
import { InvitationModule } from './modules/invitation/invitation.module';
import { ApiKeyModule } from './modules/api-key/api-key.module';
import { SocialAuthModule } from './modules/social-auth/social-auth.module';
import { HealthModule } from './modules/health/health.module';
import { CaptchaModule } from './modules/captcha/captcha.module';
import { AdvertisementModule } from './modules/advertisement/advertisement.module';
import { CustomFieldModule } from './modules/custom-field/custom-field.module';
import { InAppNotificationModule } from './modules/in-app-notification/in-app-notification.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { IpBlockGuard } from './common/guards/ip-block.guard';

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
  ],
})
export class AppModule {}
