import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserGroup, UserGroupSchema } from './schemas/user-group.schema.js';
import { GroupService } from './group.service.js';
import { GroupController } from './group.controller.js';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: UserGroup.name, schema: UserGroupSchema },
        ]),
    ],
    controllers: [GroupController],
    providers: [GroupService],
    exports: [GroupService],
})
export class GroupModule {}
