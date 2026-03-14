import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SocialAccountDocument = HydratedDocument<SocialAccount>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class SocialAccount {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user_id: Types.ObjectId;

    @Prop({ required: true })
    provider: string;

    @Prop({ required: true })
    provider_user_id: string;

    @Prop({ lowercase: true })
    email: string;

    @Prop()
    display_name: string;

    @Prop()
    avatar_url: string;

    @Prop()
    access_token: string;

    @Prop()
    refresh_token: string;

    @Prop()
    linked_at: Date;

    created_at: Date;
    updated_at: Date;
}

export const SocialAccountSchema = SchemaFactory.createForClass(SocialAccount);

SocialAccountSchema.index({ user_id: 1 });
SocialAccountSchema.index({ provider: 1, provider_user_id: 1 }, { unique: true });
SocialAccountSchema.index({ provider: 1, email: 1 });
