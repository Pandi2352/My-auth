import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateConnectorDto {
    @ApiPropertyOptional({ example: 'Google Sign-In' })
    @IsOptional()
    @IsString()
    display_name?: string;

    @ApiPropertyOptional({ example: 'new-client-id' })
    @IsOptional()
    @IsString()
    client_id?: string;

    @ApiPropertyOptional({ example: 'new-client-secret' })
    @IsOptional()
    @IsString()
    client_secret?: string;

    @ApiPropertyOptional({ example: ['email', 'profile', 'openid'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    scopes?: string[];

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    is_enabled?: boolean;

    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @IsNumber()
    sort_order?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    icon_url?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    authorize_url?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    token_url?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    profile_url?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    callback_url?: string;
}
