import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SocialConnectorDocument = HydratedDocument<SocialConnector>;

export enum SocialProvider {
    GOOGLE = 'google',
    GITHUB = 'github',
    FACEBOOK = 'facebook',
    MICROSOFT = 'microsoft',
    LINKEDIN = 'linkedin',
    TWITTER = 'twitter',
    APPLE = 'apple',
    CUSTOM = 'custom',
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class SocialConnector {
    @Prop({ required: true, enum: SocialProvider })
    provider: SocialProvider;

    @Prop({ required: true, trim: true })
    display_name: string;

    @Prop({ required: true, trim: true })
    client_id: string;

    @Prop({ required: true, trim: true })
    client_secret: string;

    @Prop({ type: [String], default: ['email', 'profile'] })
    scopes: string[];

    @Prop({ default: false })
    is_enabled: boolean;

    @Prop({ default: 0 })
    sort_order: number;

    @Prop({ trim: true })
    icon_url: string;

    // OAuth2 URLs — auto-filled from provider defaults if not set
    @Prop({ trim: true })
    authorize_url: string;

    @Prop({ trim: true })
    token_url: string;

    @Prop({ trim: true })
    profile_url: string;

    // Optional: custom callback URL override
    @Prop({ trim: true })
    callback_url: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    created_by: Types.ObjectId;

    created_at: Date;
    updated_at: Date;
}

export const SocialConnectorSchema = SchemaFactory.createForClass(SocialConnector);

SocialConnectorSchema.index({ provider: 1 });
SocialConnectorSchema.index({ is_enabled: 1 });
SocialConnectorSchema.index({ sort_order: 1 });
