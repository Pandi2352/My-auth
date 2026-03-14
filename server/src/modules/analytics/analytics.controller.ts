import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { AnalyticsService } from './analytics.service.js';

@ApiTags('Admin - Analytics')
@ApiBearerAuth('access-token')
@Controller('admin/analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    @Get('overview')
    @Permissions('analytics:read')
    @ApiOperation({ summary: 'Dashboard overview (users, activity, status, roles)' })
    getDashboardOverview() {
        return this.analyticsService.getDashboardOverview();
    }

    @Get('users/total')
    @Permissions('analytics:read')
    @ApiOperation({ summary: 'Total users count (total, verified, unverified, deleted)' })
    getTotalUsers() {
        return this.analyticsService.getTotalUsers();
    }

    @Get('users/active')
    @Permissions('analytics:read')
    @ApiOperation({ summary: 'Active users count (24h, 7d, 30d, active sessions)' })
    getActiveUsers() {
        return this.analyticsService.getActiveUsers();
    }

    @Get('users/status')
    @Permissions('analytics:read')
    @ApiOperation({ summary: 'Users grouped by status' })
    getUsersByStatus() {
        return this.analyticsService.getUsersByStatus();
    }

    @Get('users/growth')
    @Permissions('analytics:read')
    @ApiOperation({ summary: 'New users per day/week/month' })
    @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month'] })
    @ApiQuery({ name: 'days', required: false, type: Number })
    getUserGrowth(
        @Query('period') period?: string,
        @Query('days') days?: string,
    ) {
        return this.analyticsService.getUserGrowth(
            period || 'day',
            parseInt(days || '30'),
        );
    }

    @Get('users/chart')
    @Permissions('analytics:read')
    @ApiOperation({ summary: 'User growth chart data (cumulative + daily new)' })
    @ApiQuery({ name: 'days', required: false, type: Number })
    getUserChartData(@Query('days') days?: string) {
        return this.analyticsService.getUserChartData(parseInt(days || '90'));
    }

    @Get('logins')
    @Permissions('analytics:read')
    @ApiOperation({ summary: 'Login activity over time (success/failed per day)' })
    @ApiQuery({ name: 'days', required: false, type: Number })
    getLoginActivity(@Query('days') days?: string) {
        return this.analyticsService.getLoginActivity(parseInt(days || '30'));
    }

    @Get('roles')
    @Permissions('analytics:read')
    @ApiOperation({ summary: 'Role distribution (users per role)' })
    getRoleDistribution() {
        return this.analyticsService.getRoleDistribution();
    }
}
