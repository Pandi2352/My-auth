import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { jwtConfig } from '../../config/jwt.config.js';
import { UserModule } from '../user/user.module.js';
import { RoleModule } from '../role/role.module.js';
import { SessionModule } from '../session/session.module.js';
import { NotificationModule } from '../notification/notification.module.js';
import { SystemConfigModule } from '../system-config/system-config.module.js';
import { AuthService } from './auth.service.js';
import { WebAuthnService } from './webauthn.service.js';
import { AuthController } from './auth.controller.js';
import { WebAuthnController } from './webauthn.controller.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { LocalStrategy } from './strategies/local.strategy.js';
import { RefreshToken, RefreshTokenSchema } from './schemas/refresh-token.schema.js';
import { User, UserSchema } from '../user/schemas/user.schema.js';

@Module({
    imports: [
        UserModule,
        RoleModule,
        SessionModule,
        NotificationModule,
        SystemConfigModule,
        PassportModule,
        JwtModule.register({
            secret: jwtConfig().access_secret,
            signOptions: { expiresIn: jwtConfig().access_expires_in_sec },
        }),
        MongooseModule.forFeature([
            { name: RefreshToken.name, schema: RefreshTokenSchema },
            { name: User.name, schema: UserSchema },
        ]),
    ],
    controllers: [AuthController, WebAuthnController],
    providers: [AuthService, WebAuthnService, JwtStrategy, LocalStrategy],
    exports: [AuthService, WebAuthnService],
})
export class AuthModule {}
