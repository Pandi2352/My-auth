import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, Matches } from 'class-validator';
import { PASSWORD_MIN_LENGTH } from '../../../common/constants/index.js';

export class RegisterDto {
    @ApiProperty({ example: 'John', description: 'User first name' })
    @IsNotEmpty()
    @IsString()
    first_name: string;

    @ApiProperty({ example: 'Doe', description: 'User last name', required: false })
    @IsOptional()
    @IsString()
    last_name?: string;

    @ApiProperty({ example: 'john.doe@example.com', description: 'Unique email address' })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ 
        example: 'SecurePass123!', 
        description: 'Password must be at least 8 chars with 1 uppercase, 1 lowercase, 1 number, and 1 special char' 
    })
    @IsNotEmpty()
    @MinLength(PASSWORD_MIN_LENGTH)
    password: string;

    @ApiProperty({ description: 'Google reCAPTCHA token', required: false })
    @IsOptional()
    @IsString()
    captcha_token?: string;
}
