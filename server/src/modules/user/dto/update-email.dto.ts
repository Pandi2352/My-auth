import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UpdateEmailDto {
    @ApiProperty({ example: 'newemail@example.com' })
    @IsNotEmpty()
    @IsEmail()
    new_email: string;

    @ApiProperty({ example: 'CurrentP@ss1', description: 'Current password for confirmation' })
    @IsNotEmpty()
    @IsString()
    password: string;
}
