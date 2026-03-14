import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionService } from './session.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

@ApiTags('Sessions')
@ApiBearerAuth('access-token')
@Controller('sessions')
export class SessionController {
    constructor(private readonly sessionService: SessionService) {}

    @Get()
    @Permissions('session:read')
    @ApiOperation({ summary: 'Get all active sessions for current user' })
    getActiveSessions(@CurrentUser('_id') userId: string) {
        return this.sessionService.getActiveSessions(userId);
    }

    @Delete(':id')
    @Permissions('session:delete')
    @ApiOperation({ summary: 'Terminate a specific session' })
    terminateSession(@CurrentUser('_id') userId: string, @Param('id') sessionId: string) {
        return this.sessionService.terminateSession(userId, sessionId);
    }

    @Delete()
    @Permissions('session:delete')
    @ApiOperation({ summary: 'Terminate all sessions except current' })
    terminateAllSessions(@CurrentUser('_id') userId: string) {
        return this.sessionService.terminateAllSessions(userId);
    }
}

@ApiTags('Security')
@ApiBearerAuth('access-token')
@Controller('security')
export class SecurityController {
    constructor(private readonly sessionService: SessionService) {}

    @Get('login-history')
    @Permissions('session:read')
    @ApiOperation({ summary: 'Get login attempt history' })
    getLoginHistory(@CurrentUser('_id') userId: string, @Query() query: PaginationQueryDto) {
        const page = parseInt(query.page || '1');
        const limit = parseInt(query.limit || '20');
        return this.sessionService.getLoginHistory(userId, page, limit);
    }

    @Get('events')
    @Permissions('session:read')
    @ApiOperation({ summary: 'Get security events' })
    getSecurityEvents(@CurrentUser('_id') userId: string, @Query() query: PaginationQueryDto) {
        const page = parseInt(query.page || '1');
        const limit = parseInt(query.limit || '20');
        return this.sessionService.getSecurityEvents(userId, page, limit);
    }
}
