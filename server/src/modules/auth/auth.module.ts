import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { jwtConfig } from '../../config/jwt.config.js';
import { UserModule } from '../user/user.module.js';
import { RoleModule } from '../role/role.module.js';
import { SessionModule } from '../session/session.module.js';
import { NotificationModule } from '../notification/notification.module.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { LocalStrategy } from './strategies/local.strategy.js';
import { RefreshToken, RefreshTokenSchema } from './schemas/refresh-token.schema.js';

@Module({
    imports: [
        UserModule,
        RoleModule,
        SessionModule,
        NotificationModule,
        PassportModule,
        JwtModule.register({
            secret: jwtConfig().access_secret,
            signOptions: { expiresIn: jwtConfig().access_expires_in_sec },
        }),
        MongooseModule.forFeature([{ name: RefreshToken.name, schema: RefreshTokenSchema }]),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, LocalStrategy],
    exports: [AuthService],
})
export class AuthModule {}
