import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../../config/jwt.config.js';
import { InAppNotification, InAppNotificationSchema } from './schemas/in-app-notification.schema.js';
import { InAppNotificationService } from './in-app-notification.service.js';
import { InAppNotificationController } from './in-app-notification.controller.js';
import { NotificationGateway } from './in-app-notification.gateway.js';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: InAppNotification.name, schema: InAppNotificationSchema },
        ]),
        JwtModule.register({
            secret: jwtConfig().access_secret,
        }),
    ],
    controllers: [InAppNotificationController],
    providers: [InAppNotificationService, NotificationGateway],
    exports: [InAppNotificationService, NotificationGateway],
})
export class InAppNotificationModule {}
