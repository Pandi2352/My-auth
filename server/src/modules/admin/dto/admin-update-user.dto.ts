import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEmail, IsEnum, IsMongoId, IsObject, IsOptional, IsString } from 'class-validator';
import { UserStatus } from '../../../common/enums/user-status.enum.js';

export class AdminUpdateUserDto {
    @ApiPropertyOptional({ example: 'John' })
    @IsOptional()
    @IsString()
    first_name?: string;

    @ApiPropertyOptional({ type: [String], example: ['60f7b2c...'] })
    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    role_ids?: string[];

    @ApiPropertyOptional({ example: false })
    @IsOptional()
    @IsBoolean()
    requires_password_change?: boolean;

    @ApiPropertyOptional({ example: 'Doe' })
    @IsOptional()
    @IsString()
    last_name?: string;

    @ApiPropertyOptional({ example: 'john@example.com' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ example: '+919876543210' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ enum: UserStatus })
    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    is_verified?: boolean;

    @ApiPropertyOptional({ example: { department: 'Engineering', employee_id: 'EMP001' } })
    @IsOptional()
    @IsObject()
    custom_fields?: Record<string, any>;
}
