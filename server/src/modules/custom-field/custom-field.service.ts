import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomField, CustomFieldDocument } from './schemas/custom-field.schema.js';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto.js';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto.js';
import { ErrorEntity } from '../../utils/reponseUtils/ErrorEntity.js';
import { HttpStatus } from '../../utils/reponseUtils/httpStatus.js';

@Injectable()
export class CustomFieldService {
    constructor(
        @InjectModel(CustomField.name) private fieldModel: Model<CustomFieldDocument>,
    ) {}

    async create(dto: CreateCustomFieldDto): Promise<CustomFieldDocument> {
        const existing = await this.fieldModel.findOne({ key: dto.key });
        if (existing) {
            throw new ErrorEntity({
                http_code: HttpStatus.CONFLICT,
                error: 'field_exists',
                error_description: `Custom field with key '${dto.key}' already exists`,
            });
        }
        return this.fieldModel.create(dto);
    }

    async findAll(): Promise<CustomFieldDocument[]> {
        return this.fieldModel.find().sort({ sort_order: 1, created_at: 1 }).exec();
    }

    async findActive(): Promise<CustomFieldDocument[]> {
        return this.fieldModel.find({ is_active: true }).sort({ sort_order: 1 }).exec();
    }

    async findById(id: string): Promise<CustomFieldDocument> {
        const field = await this.fieldModel.findById(id).exec();
        if (!field) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'field_not_found',
                error_description: 'Custom field not found',
            });
        }
        return field;
    }

    async update(id: string, dto: UpdateCustomFieldDto): Promise<CustomFieldDocument> {
        const field = await this.fieldModel.findByIdAndUpdate(id, dto, { new: true }).exec();
        if (!field) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'field_not_found',
                error_description: 'Custom field not found',
            });
        }
        return field;
    }

    async delete(id: string): Promise<void> {
        const result = await this.fieldModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'field_not_found',
                error_description: 'Custom field not found',
            });
        }
    }
}
