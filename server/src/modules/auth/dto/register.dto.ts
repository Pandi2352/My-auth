import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { PASSWORD_MIN_LENGTH } from '../../../common/constants/index.js';

export class RegisterDto {
    @ApiProperty({ example: 'John' })
    @IsNotEmpty()
    @IsString()
    first_name: string;

    @ApiProperty({ example: 'Doe', required: false })
    @IsOptional()
    @IsString()
    last_name?: string;

    @ApiProperty({ example: 'john@example.com' })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'StrongP@ss1' })
    @IsNotEmpty()
    @MinLength(PASSWORD_MIN_LENGTH)
    password: string;

    @ApiProperty({ description: 'Google reCAPTCHA token', required: false })
    @IsOptional()
    @IsString()
    captcha_token?: string;
}
