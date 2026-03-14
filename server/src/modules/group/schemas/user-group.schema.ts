import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserGroupDocument = HydratedDocument<UserGroup>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class UserGroup {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    slug: string;

    @Prop({ trim: true })
    description: string;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Role' }], default: [] })
    roles: Types.ObjectId[];

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
    users: Types.ObjectId[];

    @Prop({ default: false })
    is_active: boolean;

    created_at: Date;
    updated_at: Date;
}

export const UserGroupSchema = SchemaFactory.createForClass(UserGroup);

UserGroupSchema.index({ users: 1 });
UserGroupSchema.index({ roles: 1 });
UserGroupSchema.index({ is_active: 1 });
