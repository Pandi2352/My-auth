import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId } from 'class-validator';

export class BulkAssignRolesDto {
    @ApiProperty({ example: ['65e7...', '65e8...'], description: 'Array of User IDs' })
    @IsArray()
    @IsMongoId({ each: true })
    user_ids: string[];

    @ApiProperty({ example: ['65f7...', '65f8...'], description: 'Role IDs to assign' })
    @IsArray()
    @IsMongoId({ each: true })
    role_ids: string[];
}
