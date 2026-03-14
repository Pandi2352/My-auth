import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId } from 'class-validator';

export class GroupRolesDto {
    @ApiProperty({ example: ['507f1f77bcf86cd799439011'], description: 'Array of role IDs' })
    @IsArray()
    @IsMongoId({ each: true })
    role_ids: string[];
}
