import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsNotEmpty } from 'class-validator';

export class AssignRolesDto {
    @ApiProperty({ example: '60f7b2c...' })
    @IsNotEmpty()
    @IsMongoId()
    user_id: string;

    @ApiProperty({ type: [String], example: ['60f7b2c...'] })
    @IsArray()
    @IsMongoId({ each: true })
    role_ids: string[];
}
