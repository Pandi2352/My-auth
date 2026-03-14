import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationsDto {
    @ApiProperty({ example: false, required: false })
    @IsOptional()
    @IsBoolean()
    email_on_login?: boolean;

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    @IsBoolean()
    email_on_password_change?: boolean;

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    @IsBoolean()
    email_on_security_alert?: boolean;
}
