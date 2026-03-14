import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
    @ApiProperty({ example: 'John', required: false })
    @IsOptional()
    @IsString()
    first_name?: string;

    @ApiProperty({ example: 'Doe', required: false })
    @IsOptional()
    @IsString()
    last_name?: string;

    @ApiProperty({ example: '+919876543210', required: false })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ example: { department: 'Engineering' }, required: false })
    @IsOptional()
    @IsObject()
    custom_fields?: Record<string, any>;
}
