import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Admin - System Logs')
@ApiBearerAuth('access-token')
@Controller('admin/logs')
export class AdminLogsController {
    @Get()
    @Permissions('settings:read')
    @ApiOperation({ summary: 'Read recent application log entries' })
    getLogs(
        @Query('file') file: string = 'combined',
        @Query('lines') lines: string = '100',
    ) {
        const allowedFiles = ['combined', 'error'];
        const logFile = allowedFiles.includes(file) ? file : 'combined';
        const logPath = path.join(process.cwd(), 'logs', `${logFile}.log`);
        const maxLines = Math.min(parseInt(lines) || 100, 500);

        if (!fs.existsSync(logPath)) {
            return { entries: [], file: logFile, message: 'Log file not found. Logs are written in production mode.' };
        }

        try {
            const content = fs.readFileSync(logPath, 'utf-8');
            const allLines = content.trim().split('\n').filter(Boolean);
            const recent = allLines.slice(-maxLines);

            const entries = recent.map((line) => {
                try {
                    return JSON.parse(line);
                } catch {
                    return { message: line, raw: true };
                }
            }).reverse(); // newest first

            return { entries, file: logFile, total: allLines.length, showing: entries.length };
        } catch {
            return { entries: [], file: logFile, message: 'Failed to read log file' };
        }
    }

    @Get('files')
    @Permissions('settings:read')
    @ApiOperation({ summary: 'List available log files' })
    getLogFiles() {
        const logsDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logsDir)) {
            return { files: [] };
        }

        const files = fs.readdirSync(logsDir)
            .filter((f) => f.endsWith('.log'))
            .map((f) => {
                const stat = fs.statSync(path.join(logsDir, f));
                return {
                    name: f,
                    size: stat.size,
                    modified: stat.mtime,
                };
            })
            .sort((a, b) => b.modified.getTime() - a.modified.getTime());

        return { files };
    }
}
