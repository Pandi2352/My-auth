import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InAppNotificationDocument = HydratedDocument<InAppNotification>;

export enum NotificationType {
    INFO = 'info',
    SUCCESS = 'success',
    WARNING = 'warning',
    ERROR = 'error',
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class InAppNotification {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    user_id: Types.ObjectId;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    message: string;

    @Prop({ enum: NotificationType, default: NotificationType.INFO })
    type: NotificationType;

    /** Optional link to navigate to when clicked */
    @Prop()
    link: string;

    @Prop({ default: false, index: true })
    is_read: boolean;

    created_at: Date;
}

export const InAppNotificationSchema = SchemaFactory.createForClass(InAppNotification);
InAppNotificationSchema.index({ user_id: 1, is_read: 1, created_at: -1 });
