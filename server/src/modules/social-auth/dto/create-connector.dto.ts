import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { SocialProvider } from '../schemas/social-connector.schema.js';

export class CreateConnectorDto {
    @ApiProperty({ example: 'google', enum: SocialProvider })
    @IsEnum(SocialProvider)
    provider: SocialProvider;

    @ApiProperty({ example: 'Google' })
    @IsString()
    @IsNotEmpty()
    display_name: string;

    @ApiProperty({ example: '123456789.apps.googleusercontent.com' })
    @IsString()
    @IsNotEmpty()
    client_id: string;

    @ApiProperty({ example: 'GOCSPX-xxxxxxxxxxxx' })
    @IsString()
    @IsNotEmpty()
    client_secret: string;

    @ApiPropertyOptional({ example: ['email', 'profile'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    scopes?: string[];

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    is_enabled?: boolean;

    @ApiPropertyOptional({ example: 0 })
    @IsOptional()
    @IsNumber()
    sort_order?: number;

    @ApiPropertyOptional({ example: 'https://img.icons8.com/color/48/google-logo.png' })
    @IsOptional()
    @IsString()
    icon_url?: string;

    // Custom OAuth URLs (required for 'custom' provider, optional for known providers)
    @ApiPropertyOptional({ example: 'https://accounts.google.com/o/oauth2/v2/auth' })
    @IsOptional()
    @IsString()
    authorize_url?: string;

    @ApiPropertyOptional({ example: 'https://oauth2.googleapis.com/token' })
    @IsOptional()
    @IsString()
    token_url?: string;

    @ApiPropertyOptional({ example: 'https://www.googleapis.com/oauth2/v2/userinfo' })
    @IsOptional()
    @IsString()
    profile_url?: string;

    @ApiPropertyOptional({ example: 'https://myapp.com/api/v1/auth/social/google/callback' })
    @IsOptional()
    @IsString()
    callback_url?: string;
}
