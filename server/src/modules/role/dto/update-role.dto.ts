import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto {
    @ApiPropertyOptional({ example: 'Moderator' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ example: 'moderator' })
    @IsOptional()
    @IsString()
    slug?: string;

    @ApiPropertyOptional({ example: 'Can manage users and content' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: false })
    @IsOptional()
    @IsBoolean()
    is_default?: boolean;
}
