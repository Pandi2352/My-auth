import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminUserService } from './admin-user.service.js';
import { AdminCreateUserDto } from './dto/admin-create-user.dto.js';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto.js';
import { AdminUpdateStatusDto } from './dto/admin-update-status.dto.js';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto.js';
import { AdminAssignRolesDto } from './dto/admin-assign-roles.dto.js';
import { ListUsersQueryDto } from './dto/list-users-query.dto.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';

@ApiTags('Admin - Users')
@ApiBearerAuth('access-token')
@Controller('admin/users')
export class AdminUserController {
    constructor(private readonly adminUserService: AdminUserService) {}

    @Get()
    @Permissions('user:read')
    @ApiOperation({ summary: 'List all users (paginated, search, filter)' })
    listUsers(@Query() query: ListUsersQueryDto) {
        return this.adminUserService.listUsers(query);
    }

    @Get('export')
    @Permissions('user:read')
    @ApiOperation({ summary: 'Export users (JSON)' })
    exportUsers(@Query() query: ListUsersQueryDto) {
        return this.adminUserService.exportUsers(query);
    }

    @Get(':id')
    @Permissions('user:read')
    @ApiOperation({ summary: 'Get user by ID' })
    getUser(@Param('id') id: string) {
        return this.adminUserService.getUserById(id);
    }

    @Post()
    @Permissions('user:create')
    @ApiOperation({ summary: 'Create a new user (admin)' })
    createUser(@Body() dto: AdminCreateUserDto) {
        return this.adminUserService.createUser(dto);
    }

    @Patch(':id')
    @Permissions('user:update')
    @ApiOperation({ summary: 'Update user details' })
    updateUser(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
        return this.adminUserService.updateUser(id, dto);
    }

    @Patch(':id/status')
    @Permissions('user:update')
    @ApiOperation({ summary: 'Update user status (activate, suspend, lock, etc.)' })
    updateStatus(@Param('id') id: string, @Body() dto: AdminUpdateStatusDto) {
        return this.adminUserService.updateStatus(id, dto.status);
    }

    @Patch(':id/suspend')
    @Permissions('user:update')
    @ApiOperation({ summary: 'Suspend a user' })
    suspendUser(@Param('id') id: string) {
        return this.adminUserService.suspendUser(id);
    }

    @Post(':id/reset-password')
    @Permissions('user:update')
    @ApiOperation({ summary: 'Reset user password (admin)' })
    resetPassword(@Param('id') id: string, @Body() dto: AdminResetPasswordDto) {
        return this.adminUserService.resetPassword(id, dto.new_password);
    }

    @Post(':id/roles')
    @Permissions('role:update')
    @ApiOperation({ summary: 'Assign roles to user' })
    assignRoles(@Param('id') id: string, @Body() dto: AdminAssignRolesDto) {
        return this.adminUserService.assignRoles(id, dto.role_ids);
    }

    @Delete(':id/roles')
    @Permissions('role:update')
    @ApiOperation({ summary: 'Remove roles from user' })
    removeRoles(@Param('id') id: string, @Body() dto: AdminAssignRolesDto) {
        return this.adminUserService.removeRoles(id, dto.role_ids);
    }

    @Delete(':id/soft')
    @Permissions('user:delete')
    @ApiOperation({ summary: 'Soft delete a user' })
    softDelete(@Param('id') id: string) {
        return this.adminUserService.softDelete(id);
    }

    @Delete(':id')
    @Permissions('user:delete')
    @ApiOperation({ summary: 'Permanently delete a user' })
    hardDelete(@Param('id') id: string) {
        return this.adminUserService.hardDelete(id);
    }

    @Patch(':id/restore')
    @Permissions('user:update')
    @ApiOperation({ summary: 'Restore a soft-deleted user' })
    restoreUser(@Param('id') id: string) {
        return this.adminUserService.restoreUser(id);
    }
}
