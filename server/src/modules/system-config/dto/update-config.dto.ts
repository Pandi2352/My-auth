import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateConfigDto {
    @ApiProperty({ example: { site_name: 'My App' }, description: 'Configuration value (any JSON)' })
    @IsNotEmpty()
    value: any;

    @ApiPropertyOptional({ example: 'Updated site name' })
    @IsOptional()
    @IsString()
    description?: string;
}

export class CreateConfigDto {
    @ApiProperty({ example: 'app.site_name' })
    @IsString()
    @IsNotEmpty()
    key: string;

    @ApiProperty({ example: 'My Application' })
    @IsNotEmpty()
    value: any;

    @ApiProperty({ example: 'app' })
    @IsString()
    @IsNotEmpty()
    category: string;

    @ApiPropertyOptional({ example: 'Application display name' })
    @IsOptional()
    @IsString()
    description?: string;
}
