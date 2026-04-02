import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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
    @ApiOkResponse({
        description: 'Paginated user list with summary',
        schema: {
            example: {
                success: true,
                data: {
                    items: [
                        { _id: '65e7...', first_name: 'John', last_name: 'Doe', email: 'john@example.com', status: 'active', is_verified: true, created_at: '2026-03-30T10:00:00Z' }
                    ],
                    total: 1050,
                    page: 1,
                    limit: 10
                }
            }
        }
    })
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
    @ApiCreatedResponse({
        description: 'User created successfully',
        schema: {
            example: {
                success: true,
                data: {
                    _id: '65e7...',
                    first_name: 'Jane',
                    last_name: 'Smith',
                    email: 'jane@example.com',
                    status: 'active'
                }
            }
        }
    })
    @ApiBadRequestResponse({ description: 'Invalid user data or email already exists' })
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

    @Patch('restore/:id')
    @Permissions('user:update')
    @ApiOperation({ summary: 'Restore a soft-deleted user' })
    restoreUser(@Param('id') id: string) {
        return this.adminUserService.restoreUser(id);
    }

    // ── Bulk Operations ──────────────────────────────────────

    @Patch('bulk/status')
    @Permissions('user:update')
    @ApiOperation({ summary: 'Bulk update user status' })
    bulkUpdateStatus(@Body() dto: any) {
        return this.adminUserService.bulkUpdateStatus(dto.user_ids, dto.status);
    }

    @Post('bulk/roles')
    @Permissions('role:update')
    @ApiOperation({ summary: 'Bulk assign roles to users' })
    bulkAssignRoles(@Body() dto: any) {
        return this.adminUserService.bulkAssignRoles(dto.user_ids, dto.role_ids);
    }

    @Delete('bulk')
    @Permissions('user:delete')
    @ApiOperation({ summary: 'Bulk delete users' })
    bulkDelete(@Body() dto: { user_ids: string[]; soft?: boolean }) {
        return this.adminUserService.bulkDelete(dto.user_ids, dto.soft);
    }
}
