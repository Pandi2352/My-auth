import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InAppNotificationDocument = HydratedDocument<InAppNotification>;

export enum NotificationType {
    INFO = 'info',
    SUCCESS = 'success',
    WARNING = 'warning',
    ERROR = 'error',
    ACTION = 'action',
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
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

    /** For actionable notifications (Approve/Reject) */
    @Prop({ type: String, enum: ['approve_reject', 'view_details'], default: null })
    action_type: string;

    @Prop({ type: Types.ObjectId, default: null })
    target_id: Types.ObjectId;

    @Prop({ default: false })
    is_action_taken: boolean;

    @Prop({ type: String, enum: ['approved', 'rejected', null], default: null })
    action_result: string;

    created_at: Date;
    updated_at: Date;
}

export const InAppNotificationSchema = SchemaFactory.createForClass(InAppNotification);
InAppNotificationSchema.index({ user_id: 1, is_read: 1, created_at: -1 });
