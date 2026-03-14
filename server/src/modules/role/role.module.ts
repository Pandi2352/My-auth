import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from './schemas/role.schema.js';
import { RoleService } from './role.service.js';
import { RoleController } from './role.controller.js';
import { PermissionModule } from '../permission/permission.module.js';
import { UserModule } from '../user/user.module.js';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]),
        PermissionModule,
        UserModule,
    ],
    controllers: [RoleController],
    providers: [RoleService],
    exports: [RoleService],
})
export class RoleModule {}
