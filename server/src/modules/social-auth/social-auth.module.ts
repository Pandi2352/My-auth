import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../../config/jwt.config.js';
import { SocialConnector, SocialConnectorSchema } from './schemas/social-connector.schema.js';
import { SocialAccount, SocialAccountSchema } from './schemas/social-account.schema.js';
import { RefreshToken, RefreshTokenSchema } from '../auth/schemas/refresh-token.schema.js';
import { SocialConnectorService } from './social-connector.service.js';
import { SocialAuthService } from './social-auth.service.js';
import { SocialConnectorController } from './social-connector.controller.js';
import { SocialAuthController } from './social-auth.controller.js';
import { UserModule } from '../user/user.module.js';
import { RoleModule } from '../role/role.module.js';
import { SessionModule } from '../session/session.module.js';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: SocialConnector.name, schema: SocialConnectorSchema },
            { name: SocialAccount.name, schema: SocialAccountSchema },
            { name: RefreshToken.name, schema: RefreshTokenSchema },
        ]),
        JwtModule.register({
            secret: jwtConfig().access_secret,
            signOptions: { expiresIn: jwtConfig().access_expires_in_sec },
        }),
        UserModule,
        RoleModule,
        SessionModule,
    ],
    controllers: [SocialConnectorController, SocialAuthController],
    providers: [SocialConnectorService, SocialAuthService],
    exports: [SocialConnectorService, SocialAuthService],
})
export class SocialAuthModule {}
