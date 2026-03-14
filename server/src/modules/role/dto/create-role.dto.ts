import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
    @ApiProperty({ example: 'Moderator' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ example: 'moderator' })
    @IsNotEmpty()
    @IsString()
    slug: string;

    @ApiPropertyOptional({ example: 'Can manage users and content' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ type: [String], example: ['60f7b2c...'] })
    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    permission_ids?: string[];

    @ApiPropertyOptional({ example: false })
    @IsOptional()
    @IsBoolean()
    is_default?: boolean;
}
