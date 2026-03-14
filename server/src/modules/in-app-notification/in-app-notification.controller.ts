import { Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { InAppNotificationService } from './in-app-notification.service.js';

@ApiTags('Notifications (In-App)')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class InAppNotificationController {
    constructor(private readonly notifService: InAppNotificationService) {}

    @Get()
    @ApiOperation({ summary: 'Get your notifications (paginated)' })
    getNotifications(
        @CurrentUser('_id') userId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.notifService.getForUser(userId, parseInt(page || '1'), parseInt(limit || '20'));
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread notification count' })
    getUnreadCount(@CurrentUser('_id') userId: string) {
        return this.notifService.getUnreadCount(userId);
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark a notification as read' })
    markAsRead(@CurrentUser('_id') userId: string, @Param('id') id: string) {
        return this.notifService.markAsRead(userId, id);
    }

    @Patch('read-all')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    markAllAsRead(@CurrentUser('_id') userId: string) {
        return this.notifService.markAllAsRead(userId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a notification' })
    delete(@CurrentUser('_id') userId: string, @Param('id') id: string) {
        return this.notifService.delete(userId, id);
    }

    @Delete()
    @ApiOperation({ summary: 'Delete all notifications' })
    deleteAll(@CurrentUser('_id') userId: string) {
        return this.notifService.deleteAll(userId);
    }
}
