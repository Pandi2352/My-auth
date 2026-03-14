import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PermissionAction } from '../../../common/enums/permission-action.enum.js';

export class CreatePermissionDto {
    @ApiProperty({ example: 'Create User' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ example: 'user:create' })
    @IsNotEmpty()
    @IsString()
    slug: string;

    @ApiProperty({ example: 'user' })
    @IsNotEmpty()
    @IsString()
    module: string;

    @ApiProperty({ enum: PermissionAction, example: PermissionAction.CREATE })
    @IsNotEmpty()
    @IsEnum(PermissionAction)
    action: PermissionAction;

    @ApiPropertyOptional({ example: 'Allows creating new users' })
    @IsOptional()
    @IsString()
    description?: string;
}
