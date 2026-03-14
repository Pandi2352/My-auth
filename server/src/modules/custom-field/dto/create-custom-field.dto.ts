import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsNumber, IsArray } from 'class-validator';
import { FieldType } from '../schemas/custom-field.schema.js';

export class CreateCustomFieldDto {
    @ApiProperty({ example: 'Department' })
    @IsNotEmpty()
    @IsString()
    label: string;

    @ApiProperty({ example: 'department' })
    @IsNotEmpty()
    @IsString()
    key: string;

    @ApiProperty({ enum: FieldType, example: FieldType.SELECT })
    @IsOptional()
    @IsEnum(FieldType)
    type?: FieldType;

    @ApiPropertyOptional({ example: 'User department' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 'Select department' })
    @IsOptional()
    @IsString()
    placeholder?: string;

    @ApiPropertyOptional({ example: false })
    @IsOptional()
    @IsBoolean()
    is_required?: boolean;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    @ApiPropertyOptional({ example: ['Engineering', 'Marketing', 'Sales'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    options?: string[];

    @ApiPropertyOptional({ example: 0 })
    @IsOptional()
    @IsNumber()
    sort_order?: number;
}
