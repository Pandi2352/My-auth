import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsEnum,
    IsBoolean,
    IsNumber,
    IsDateString,
    IsArray,
    IsNotEmpty,
    IsUrl,
} from 'class-validator';
import { AdPosition, AdType } from '../schemas/advertisement.schema.js';

export class CreateAdDto {
    @ApiProperty({ example: 'Summer Sale Banner' })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiProperty({ enum: AdType, example: AdType.IMAGE })
    @IsOptional()
    @IsEnum(AdType)
    type?: AdType;

    @ApiProperty({ enum: AdPosition, example: AdPosition.HEADER })
    @IsNotEmpty()
    @IsEnum(AdPosition)
    position: AdPosition;

    @ApiProperty({ example: 'https://cdn.example.com/banner.png', required: false })
    @IsOptional()
    @IsString()
    image_url?: string;

    @ApiProperty({ example: 'https://example.com/promo', required: false })
    @IsOptional()
    @IsString()
    link_url?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    html_content?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    script_content?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    alt_text?: string;

    @ApiProperty({ example: 0, required: false })
    @IsOptional()
    @IsNumber()
    priority?: number;

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    start_date?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    end_date?: string;

    @ApiProperty({ example: ['/dashboard', '/users'], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    target_pages?: string[];
}
