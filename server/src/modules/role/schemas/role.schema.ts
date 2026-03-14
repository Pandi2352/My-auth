import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RoleDocument = HydratedDocument<Role>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Role {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    slug: string;

    @Prop({ default: '' })
    description: string;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Permission' }], default: [] })
    permissions: Types.ObjectId[];

    @Prop({ default: false })
    is_default: boolean;

    @Prop({ default: false })
    is_system: boolean;

    created_at: Date;
    updated_at: Date;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

RoleSchema.index({ is_default: 1 });
