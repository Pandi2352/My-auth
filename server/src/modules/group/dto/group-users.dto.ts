import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId } from 'class-validator';

export class GroupUsersDto {
    @ApiProperty({ example: ['507f1f77bcf86cd799439011'], description: 'Array of user IDs' })
    @IsArray()
    @IsMongoId({ each: true })
    user_ids: string[];
}
