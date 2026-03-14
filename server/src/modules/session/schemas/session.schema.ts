import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SessionDocument = HydratedDocument<Session>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class Session {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user_id: Types.ObjectId;

    @Prop({ required: true })
    token_hash: string;

    @Prop()
    device: string;

    @Prop()
    browser: string;

    @Prop()
    os: string;

    @Prop()
    ip_address: string;

    @Prop()
    location: string;

    @Prop()
    user_agent: string;

    @Prop({ default: true })
    is_active: boolean;

    @Prop()
    last_activity: Date;

    @Prop({ required: true })
    expires_at: Date;

    created_at: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.index({ user_id: 1 });
SessionSchema.index({ token_hash: 1 });
SessionSchema.index({ is_active: 1 });
SessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
