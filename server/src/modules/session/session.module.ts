import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from './schemas/session.schema.js';
import { LoginAttempt, LoginAttemptSchema } from './schemas/login-attempt.schema.js';
import { SecurityEvent, SecurityEventSchema } from './schemas/security-event.schema.js';
import { SessionService } from './session.service.js';
import { SessionController, SecurityController } from './session.controller.js';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Session.name, schema: SessionSchema },
            { name: LoginAttempt.name, schema: LoginAttemptSchema },
            { name: SecurityEvent.name, schema: SecurityEventSchema },
        ]),
    ],
    controllers: [SessionController, SecurityController],
    providers: [SessionService],
    exports: [SessionService],
})
export class SessionModule {}
