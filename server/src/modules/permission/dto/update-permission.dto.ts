import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PermissionAction } from '../../../common/enums/permission-action.enum.js';

export class UpdatePermissionDto {
    @ApiPropertyOptional({ example: 'Create User' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ example: 'user:create' })
    @IsOptional()
    @IsString()
    slug?: string;

    @ApiPropertyOptional({ example: 'user' })
    @IsOptional()
    @IsString()
    module?: string;

    @ApiPropertyOptional({ enum: PermissionAction })
    @IsOptional()
    @IsEnum(PermissionAction)
    action?: PermissionAction;

    @ApiPropertyOptional({ example: 'Allows creating new users' })
    @IsOptional()
    @IsString()
    description?: string;
}
