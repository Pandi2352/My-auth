import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'StrongP@ss1' })
    @IsNotEmpty()
    @IsString()
    password: string;

    @ApiProperty({ example: false, required: false })
    @IsOptional()
    @IsBoolean()
    remember_me?: boolean;

    @ApiProperty({ description: 'Google reCAPTCHA token', required: false })
    @IsOptional()
    @IsString()
    captcha_token?: string;
}
