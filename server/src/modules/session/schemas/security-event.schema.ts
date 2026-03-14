import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SecurityEventDocument = HydratedDocument<SecurityEvent>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class SecurityEvent {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user_id: Types.ObjectId;

    @Prop({ required: true })
    event_type: string;

    @Prop()
    description: string;

    @Prop()
    ip_address: string;

    @Prop()
    user_agent: string;

    @Prop({ type: Object })
    metadata: Record<string, any>;

    created_at: Date;
}

export const SecurityEventSchema = SchemaFactory.createForClass(SecurityEvent);

SecurityEventSchema.index({ user_id: 1 });
SecurityEventSchema.index({ event_type: 1 });
SecurityEventSchema.index({ created_at: -1 });
