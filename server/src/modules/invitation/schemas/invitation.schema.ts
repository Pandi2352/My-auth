import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InvitationDocument = HydratedDocument<Invitation>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Invitation {
    @Prop({ required: true, lowercase: true, trim: true })
    email: string;

    @Prop({ type: Types.ObjectId, ref: 'Role' })
    role_id: Types.ObjectId;

    @Prop({ required: true, unique: true })
    token: string;

    @Prop({ required: true })
    expires_at: Date;

    @Prop()
    accepted_at: Date;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    invited_by: Types.ObjectId;

    @Prop({ default: false })
    is_revoked: boolean;

    created_at: Date;
    updated_at: Date;
}

export const InvitationSchema = SchemaFactory.createForClass(Invitation);

InvitationSchema.index({ email: 1 });
InvitationSchema.index({ expires_at: 1 });
InvitationSchema.index({ invited_by: 1 });
