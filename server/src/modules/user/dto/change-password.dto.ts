import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { PASSWORD_MIN_LENGTH } from '../../../common/constants/index.js';

export class ChangePasswordDto {
    @ApiProperty({ example: 'CurrentP@ss1' })
    @IsNotEmpty()
    @IsString()
    current_password: string;

    @ApiProperty({ example: 'NewStrongP@ss1' })
    @IsNotEmpty()
    @MinLength(PASSWORD_MIN_LENGTH)
    new_password: string;
}
