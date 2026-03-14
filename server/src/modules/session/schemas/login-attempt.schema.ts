import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LoginAttemptDocument = HydratedDocument<LoginAttempt>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class LoginAttempt {
    @Prop({ type: Types.ObjectId, ref: 'User' })
    user_id: Types.ObjectId;

    @Prop()
    email: string;

    @Prop()
    ip_address: string;

    @Prop()
    user_agent: string;

    @Prop()
    device: string;

    @Prop()
    browser: string;

    @Prop()
    os: string;

    @Prop()
    location: string;

    @Prop({ required: true })
    success: boolean;

    @Prop()
    failure_reason: string;

    created_at: Date;
}

export const LoginAttemptSchema = SchemaFactory.createForClass(LoginAttempt);

LoginAttemptSchema.index({ user_id: 1 });
LoginAttemptSchema.index({ email: 1 });
LoginAttemptSchema.index({ ip_address: 1 });
LoginAttemptSchema.index({ created_at: -1 });
