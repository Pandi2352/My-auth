import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEmail, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserStatus } from '../../../common/enums/user-status.enum.js';
import { PASSWORD_MIN_LENGTH } from '../../../common/constants/index.js';

export class AdminCreateUserDto {
    @ApiProperty({ example: 'John' })
    @IsNotEmpty()
    @IsString()
    first_name: string;

    @ApiPropertyOptional({ example: 'Doe' })
    @IsOptional()
    @IsString()
    last_name?: string;

    @ApiProperty({ example: 'john@example.com' })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'StrongP@ss1' })
    @IsNotEmpty()
    @IsString()
    @MinLength(PASSWORD_MIN_LENGTH)
    password: string;

    @ApiPropertyOptional({ example: '+919876543210' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ enum: UserStatus, example: UserStatus.ACTIVE })
    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    is_verified?: boolean;

    @ApiPropertyOptional({ type: [String], example: ['60f7b2c...'] })
    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    role_ids?: string[];
}
