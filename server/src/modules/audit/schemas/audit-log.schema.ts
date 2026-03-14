import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class AuditLog {
    @Prop({ type: Types.ObjectId, ref: 'User' })
    user_id: Types.ObjectId;

    @Prop()
    user_email: string;

    @Prop({ required: true })
    action: string; // e.g. 'user.login', 'user.create', 'role.update', 'permission.delete'

    @Prop({ required: true })
    target_type: string; // e.g. 'user', 'role', 'permission', 'session', 'auth'

    @Prop()
    target_id: string; // ID of the affected resource

    @Prop()
    description: string; // Human-readable description

    @Prop({ type: String, enum: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] })
    method: string;

    @Prop()
    endpoint: string; // e.g. '/api/v1/admin/users/123'

    @Prop({ type: Number })
    status_code: number;

    @Prop({ type: Object })
    changes: {
        before?: Record<string, any>;
        after?: Record<string, any>;
    };

    @Prop({ type: Object })
    metadata: Record<string, any>;

    @Prop()
    ip_address: string;

    @Prop()
    user_agent: string;

    created_at: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ user_id: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ target_type: 1 });
AuditLogSchema.index({ target_id: 1 });
AuditLogSchema.index({ created_at: -1 });
AuditLogSchema.index({ user_id: 1, created_at: -1 });
AuditLogSchema.index({ action: 1, created_at: -1 });
