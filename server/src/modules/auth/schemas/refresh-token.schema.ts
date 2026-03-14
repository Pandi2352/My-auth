import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class RefreshToken {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user_id: Types.ObjectId;

    @Prop({ required: true })
    token_hash: string;

    @Prop()
    device: string;

    @Prop()
    ip_address: string;

    @Prop()
    user_agent: string;

    @Prop({ default: false })
    is_revoked: boolean;

    @Prop({ required: true })
    expires_at: Date;

    created_at: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

RefreshTokenSchema.index({ user_id: 1 });
RefreshTokenSchema.index({ token_hash: 1 });
RefreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
