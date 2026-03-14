import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ForgotPasswordDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'Google reCAPTCHA token', required: false })
    @IsOptional()
    @IsString()
    captcha_token?: string;
}
