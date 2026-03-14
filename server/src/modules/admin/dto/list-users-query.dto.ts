import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserStatus } from '../../../common/enums/user-status.enum.js';
import { SearchPaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';

export class ListUsersQueryDto extends SearchPaginationQueryDto {
    @ApiPropertyOptional({ enum: UserStatus, description: 'Filter by status' })
    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;

    @ApiPropertyOptional({ example: 'admin', description: 'Filter by role slug' })
    @IsOptional()
    @IsString()
    role?: string;

    @ApiPropertyOptional({ example: 'created_at', description: 'Sort field' })
    @IsOptional()
    @IsString()
    sort_by?: string;

    @ApiPropertyOptional({ example: 'desc', description: 'Sort order: asc or desc' })
    @IsOptional()
    @IsString()
    sort_order?: string;
}
