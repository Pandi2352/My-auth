import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CustomFieldDocument = HydratedDocument<CustomField>;

export enum FieldType {
    TEXT = 'text',
    NUMBER = 'number',
    DATE = 'date',
    SELECT = 'select',
    MULTISELECT = 'multiselect',
    BOOLEAN = 'boolean',
    URL = 'url',
    EMAIL = 'email',
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class CustomField {
    @Prop({ required: true, trim: true })
    label: string;

    @Prop({ required: true, trim: true, unique: true })
    key: string;

    @Prop({ enum: FieldType, default: FieldType.TEXT })
    type: FieldType;

    @Prop()
    description: string;

    @Prop()
    placeholder: string;

    @Prop({ default: false })
    is_required: boolean;

    @Prop({ default: true })
    is_active: boolean;

    /** For SELECT/MULTISELECT: list of allowed values */
    @Prop({ type: [String], default: [] })
    options: string[];

    /** Display order in forms */
    @Prop({ default: 0 })
    sort_order: number;

    created_at: Date;
    updated_at: Date;
}

export const CustomFieldSchema = SchemaFactory.createForClass(CustomField);
