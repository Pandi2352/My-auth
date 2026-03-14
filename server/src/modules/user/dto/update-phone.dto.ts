import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePhoneDto {
    @ApiProperty({ example: '+919876543210' })
    @IsNotEmpty()
    @IsString()
    phone: string;
}
