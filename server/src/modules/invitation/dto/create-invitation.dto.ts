import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateInvitationDto {
    @ApiProperty({ example: 'newuser@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011', description: 'Role to assign on acceptance' })
    @IsOptional()
    @IsMongoId()
    role_id?: string;
}
