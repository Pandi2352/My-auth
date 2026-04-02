import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';

export class AuditLogQueryDto extends PaginationQueryDto {
    @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011', description: 'Filter by user ID' })
    @IsOptional()
    @IsString()
    user_id?: string;

    @ApiPropertyOptional({ example: 'user@example.com', description: 'Filter by user email' })
    @IsOptional()
    @IsString()
    user_email?: string;

    @ApiPropertyOptional({ example: 'user.create', description: 'Filter by action (e.g. user.create, role.update)' })
    @IsOptional()
    @IsString()
    action?: string;

    @ApiPropertyOptional({ example: 'user', description: 'Filter by target type (e.g. user, role, permission, auth)' })
    @IsOptional()
    @IsString()
    target_type?: string;

    @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011', description: 'Filter by target resource ID' })
    @IsOptional()
    @IsString()
    target_id?: string;

    @ApiPropertyOptional({ example: '2026-03-01', description: 'Filter from date (ISO string or YYYY-MM-DD)' })
    @IsOptional()
    @IsString()
    date_from?: string;

    @ApiPropertyOptional({ example: '2026-03-31', description: 'Filter to date (ISO string or YYYY-MM-DD)' })
    @IsOptional()
    @IsString()
    date_to?: string;

    @ApiPropertyOptional({ example: 'POST', description: 'Filter by HTTP method' })
    @IsOptional()
    @IsString()
    method?: string;

    @ApiPropertyOptional({ example: 'action,user_email,created_at', description: 'Comma-separated list of fields to include' })
    @IsOptional()
    @IsString()
    fields?: string;
}
