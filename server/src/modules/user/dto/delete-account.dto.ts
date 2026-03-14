import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteAccountDto {
    @ApiProperty({ example: 'MyPassword123', description: 'Current password for confirmation' })
    @IsString()
    @IsNotEmpty()
    password: string;
}
