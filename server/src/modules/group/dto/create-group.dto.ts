import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, Matches } from 'class-validator';

export class CreateGroupDto {
    @ApiProperty({ example: 'Engineering Team' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'engineering-team', description: 'Unique slug (lowercase, hyphens, underscores)' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^[a-z0-9_-]+$/, { message: 'Slug must be lowercase alphanumeric with hyphens or underscores' })
    slug: string;

    @ApiPropertyOptional({ example: 'All engineering team members' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: ['507f1f77bcf86cd799439011'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    role_ids?: string[];

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
