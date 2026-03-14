import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SystemConfigDocument = HydratedDocument<SystemConfig>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class SystemConfig {
    @Prop({ required: true, unique: true, trim: true })
    key: string;

    @Prop({ type: Object, required: true })
    value: any;

    @Prop({ required: true, trim: true })
    category: string;

    @Prop({ trim: true })
    description: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    updated_by: Types.ObjectId;

    created_at: Date;
    updated_at: Date;
}

export const SystemConfigSchema = SchemaFactory.createForClass(SystemConfig);

SystemConfigSchema.index({ category: 1 });
