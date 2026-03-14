import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class PaginationQueryDto {
    @ApiPropertyOptional({ example: '1', description: 'Page number (starts at 1)' })
    @IsOptional()
    @IsNumberString()
    page?: string;

    @ApiPropertyOptional({ example: '20', description: 'Items per page (max 100)' })
    @IsOptional()
    @IsNumberString()
    limit?: string;
}

export class SearchPaginationQueryDto extends PaginationQueryDto {
    @ApiPropertyOptional({ example: 'john', description: 'Search keyword' })
    @IsOptional()
    @IsString()
    search?: string;
}

export function parsePagination(query: PaginationQueryDto, defaults?: { page?: number; limit?: number }) {
    const page = Math.max(1, parseInt(query.page || String(defaults?.page ?? 1)));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || String(defaults?.limit ?? 20))));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}

export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
    return {
        data,
        meta_data: {
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit),
        },
    };
}
