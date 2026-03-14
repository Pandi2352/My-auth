import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId } from 'class-validator';

export class AssignPermissionsDto {
    @ApiProperty({ type: [String], example: ['60f7b2c...'] })
    @IsArray()
    @IsMongoId({ each: true })
    permission_ids: string[];
}
