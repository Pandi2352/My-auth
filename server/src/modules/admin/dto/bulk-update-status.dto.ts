import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsMongoId } from 'class-validator';
import { UserStatus } from '../../../common/enums/user-status.enum.js';

export class BulkUpdateStatusDto {
    @ApiProperty({ example: ['65e7...', '65e8...'], description: 'Array of User IDs' })
    @IsArray()
    @IsMongoId({ each: true })
    user_ids: string[];

    @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
    @IsEnum(UserStatus)
    status: UserStatus;
}
