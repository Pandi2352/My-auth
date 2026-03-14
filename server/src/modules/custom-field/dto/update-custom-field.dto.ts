import { PartialType } from '@nestjs/swagger';
import { CreateCustomFieldDto } from './create-custom-field.dto.js';

export class UpdateCustomFieldDto extends PartialType(CreateCustomFieldDto) {}
