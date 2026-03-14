import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/schemas/user.schema.js';
import { RefreshToken, RefreshTokenSchema } from '../auth/schemas/refresh-token.schema.js';
import { Role, RoleSchema } from '../role/schemas/role.schema.js';
import { AdminUserService } from './admin-user.service.js';
import { AdminUserController } from './admin-user.controller.js';
import { AdminLogsController } from './admin-logs.controller.js';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: RefreshToken.name, schema: RefreshTokenSchema },
            { name: Role.name, schema: RoleSchema },
        ]),
    ],
    controllers: [AdminUserController, AdminLogsController],
    providers: [AdminUserService],
    exports: [AdminUserService],
})
export class AdminModule {}
