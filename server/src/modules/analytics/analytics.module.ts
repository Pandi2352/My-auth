import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/schemas/user.schema.js';
import { LoginAttempt, LoginAttemptSchema } from '../session/schemas/login-attempt.schema.js';
import { Session, SessionSchema } from '../session/schemas/session.schema.js';
import { AnalyticsService } from './analytics.service.js';
import { AnalyticsController } from './analytics.controller.js';

import { AnalyticsSummary, AnalyticsSummarySchema } from './schemas/analytics-summary.schema.js';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: LoginAttempt.name, schema: LoginAttemptSchema },
            { name: Session.name, schema: SessionSchema },
            { name: AnalyticsSummary.name, schema: AnalyticsSummarySchema },
        ]),
    ],
    controllers: [AnalyticsController],
    providers: [AnalyticsService],
})
export class AnalyticsModule {}
