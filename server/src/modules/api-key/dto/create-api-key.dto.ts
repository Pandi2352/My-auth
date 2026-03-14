import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateApiKeyDto {
    @ApiProperty({ example: 'My Integration Key' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ example: ['user:read', 'session:read'], description: 'Permission slugs for this key' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    permissions?: string[];

    @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z', description: 'Expiration date (optional)' })
    @IsOptional()
    @IsString()
    expires_at?: string;
}
