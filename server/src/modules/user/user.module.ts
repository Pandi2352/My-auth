import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema.js';
import { Session, SessionSchema } from '../session/schemas/session.schema.js';
import { UserService } from './user.service.js';
import { UserProfileService } from './user-profile.service.js';
import { UserProfileController } from './user-profile.controller.js';
import { NotificationModule } from '../notification/notification.module.js';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Session.name, schema: SessionSchema },
        ]),
        NotificationModule,
    ],
    controllers: [UserProfileController],
    providers: [UserService, UserProfileService],
    exports: [UserService],
})
export class UserModule {}
