import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ApiKeyDocument = HydratedDocument<ApiKey>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class ApiKey {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user_id: Types.ObjectId;

    @Prop({ required: true })
    key_hash: string;

    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ trim: true })
    prefix: string;

    @Prop({ type: [String], default: [] })
    permissions: string[];

    @Prop()
    last_used_at: Date;

    @Prop()
    expires_at: Date;

    @Prop({ default: true })
    is_active: boolean;

    created_at: Date;
    updated_at: Date;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);

ApiKeySchema.index({ user_id: 1 });
ApiKeySchema.index({ key_hash: 1 });
ApiKeySchema.index({ prefix: 1 });
ApiKeySchema.index({ is_active: 1 });
