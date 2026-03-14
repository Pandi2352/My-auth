import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { AuditService } from './audit.service.js';
import { AuditLogQueryDto } from './dto/audit-log-query.dto.js';

@ApiTags('Admin - Audit Logs')
@ApiBearerAuth('access-token')
@Controller('admin/audit-logs')
export class AuditController {
    constructor(private readonly auditService: AuditService) {}

    @Get()
    @Permissions('audit:read')
    @ApiOperation({ summary: 'Get audit logs (paginated, filtered)' })
    findAll(@Query() query: AuditLogQueryDto) {
        return this.auditService.findAll(query);
    }

    @Get('summary')
    @Permissions('audit:read')
    @ApiOperation({ summary: 'Get action summary (counts by action type)' })
    getActionSummary(@Query() query: AuditLogQueryDto) {
        return this.auditService.getActionSummary(query);
    }

    @Get('export/json')
    @Permissions('audit:read')
    @ApiOperation({ summary: 'Export audit logs as JSON' })
    exportJson(@Query() query: AuditLogQueryDto) {
        return this.auditService.exportLogs(query, 'json');
    }

    @Get('export/csv')
    @Permissions('audit:read')
    @ApiOperation({ summary: 'Export audit logs as CSV' })
    async exportCsv(@Query() query: AuditLogQueryDto, @Res() res: Response) {
        const csv = await this.auditService.exportLogs(query, 'csv');
        const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    }

    @Get(':id')
    @Permissions('audit:read')
    @ApiOperation({ summary: 'Get a single audit log entry by ID' })
    findOne(@Param('id') id: string) {
        return this.auditService.findById(id);
    }
}
