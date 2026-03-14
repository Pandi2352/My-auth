import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Invitation, InvitationSchema } from './schemas/invitation.schema.js';
import { InvitationService } from './invitation.service.js';
import { InvitationController, InvitationPublicController } from './invitation.controller.js';
import { UserModule } from '../user/user.module.js';
import { RoleModule } from '../role/role.module.js';
import { NotificationModule } from '../notification/notification.module.js';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Invitation.name, schema: InvitationSchema },
        ]),
        UserModule,
        RoleModule,
        NotificationModule,
    ],
    controllers: [InvitationController, InvitationPublicController],
    providers: [InvitationService],
    exports: [InvitationService],
})
export class InvitationModule {}
