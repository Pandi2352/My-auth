import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { PermissionAction } from '../../../common/enums/permission-action.enum.js';

export type PermissionDocument = HydratedDocument<Permission>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Permission {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    slug: string;

    @Prop({ required: true, lowercase: true, trim: true })
    module: string;

    @Prop({ required: true, type: String, enum: PermissionAction })
    action: PermissionAction;

    @Prop({ default: '' })
    description: string;

    created_at: Date;
    updated_at: Date;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);

PermissionSchema.index({ module: 1 });
PermissionSchema.index({ module: 1, action: 1 });
