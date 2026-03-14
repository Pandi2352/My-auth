import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserStatus } from '../../../common/enums/user-status.enum.js';

export class AdminUpdateStatusDto {
    @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
    @IsNotEmpty()
    @IsEnum(UserStatus)
    status: UserStatus;
}
