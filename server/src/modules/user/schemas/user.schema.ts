import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UserStatus } from '../../../common/enums/user-status.enum.js';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class User {
    @Prop({ required: true, trim: true })
    first_name: string;

    @Prop({ trim: true })
    last_name: string;

    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    email: string;

    @Prop({ required: true })
    password_hash: string;

    @Prop()
    phone: string;

    @Prop()
    avatar_url: string;

    @Prop({ type: Object, default: { email_on_login: false, email_on_password_change: true, email_on_security_alert: true } })
    notification_preferences: {
        email_on_login: boolean;
        email_on_password_change: boolean;
        email_on_security_alert: boolean;
    };

    @Prop({ type: String, enum: UserStatus, default: UserStatus.PENDING })
    status: UserStatus;

    @Prop({ default: false })
    is_verified: boolean;

    @Prop()
    email_verification_token: string;

    @Prop()
    email_verification_expires: Date;

    @Prop()
    password_reset_token: string;

    @Prop()
    password_reset_expires: Date;

    // 2FA
    @Prop({ default: false })
    is_2fa_enabled: boolean;

    @Prop()
    two_fa_secret: string;

    // Security
    @Prop({ default: 0 })
    failed_login_attempts: number;

    @Prop()
    locked_until: Date;

    @Prop()
    password_changed_at: Date;

    // WebAuthn
    @Prop({ type: String })
    current_challenge: string;

    @Prop({ type: [{
        credentialID: { type: Buffer },
        credentialPublicKey: { type: Buffer },
        counter: { type: Number },
        credentialDeviceType: { type: String },
        credentialBackedUp: { type: Boolean },
        transports: { type: [String] },
        name: { type: String, default: 'Passkey' },
        last_used_at: { type: Date, default: Date.now },
    }], default: [] })
    authenticators: any[];

    // Tracking
    @Prop()
    last_login_at: Date;

    @Prop()
    last_login_ip: string;

    // Roles
    @Prop({ type: [{ type: Types.ObjectId, ref: 'Role' }], default: [] })
    roles: Types.ObjectId[];

    // Custom fields (key-value pairs defined by admin)
    @Prop({ type: Object, default: {} })
    custom_fields: Record<string, any>;

    @Prop({ default: false })
    requires_password_change: boolean;

    // Soft delete
    @Prop({ default: false })
    is_deleted: boolean;

    @Prop()
    deleted_at: Date;

    // Timestamps added by mongoose
    created_at: Date;
    updated_at: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ status: 1 });
UserSchema.index({ is_deleted: 1 });
UserSchema.index({ roles: 1 });
