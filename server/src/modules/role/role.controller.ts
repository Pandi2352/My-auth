import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleService } from './role.service.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { AssignPermissionsDto } from './dto/assign-permissions.dto.js';
import { AssignRolesDto } from './dto/assign-roles.dto.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';

@ApiTags('Roles')
@ApiBearerAuth('access-token')
@Controller('roles')
export class RoleController {
    constructor(private readonly roleService: RoleService) {}

    @Post()
    @Permissions('role:create')
    @ApiOperation({ summary: 'Create a new role' })
    create(@Body() dto: CreateRoleDto) {
        return this.roleService.create(dto);
    }

    @Get()
    @Permissions('role:read')
    @ApiOperation({ summary: 'Get all roles' })
    findAll() {
        return this.roleService.findAll();
    }

    // ── Permission Matrix ───────────────────────────────────

    @Get('matrix')
    @Permissions('role:read')
    @ApiOperation({ summary: 'Get role-permission matrix' })
    getMatrix() {
        return this.roleService.getMatrix();
    }

    @Post('matrix/sync')
    @Permissions('role:update')
    @ApiOperation({ summary: 'Synchronize permission matrix changes' })
    syncMatrix(@Body() dto: { changes: { role_id: string; permission_ids: string[] }[] }) {
        return this.roleService.syncMatrix(dto.changes);
    }

    // ── User Role Assignment ────────────────────────────────

    @Post('assign-to-user')
    @Permissions('role:update')
    @ApiOperation({ summary: 'Assign roles to a user' })
    assignToUser(@Body() dto: AssignRolesDto) {
        return this.roleService.assignRolesToUser(dto.user_id, dto.role_ids);
    }

    @Post('remove-from-user')
    @Permissions('role:update')
    @ApiOperation({ summary: 'Remove roles from a user' })
    removeFromUser(@Body() dto: AssignRolesDto) {
        return this.roleService.removeRolesFromUser(dto.user_id, dto.role_ids);
    }

    // ── Parameterized Routes (Must be at the bottom) ────────

    @Get(':id')
    @Permissions('role:read')
    @ApiOperation({ summary: 'Get role by ID (with permissions)' })
    findOne(@Param('id') id: string) {
        return this.roleService.findById(id);
    }

    @Patch(':id')
    @Permissions('role:update')
    @ApiOperation({ summary: 'Update a role' })
    update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
        return this.roleService.update(id, dto);
    }

    @Delete(':id')
    @Permissions('role:delete')
    @ApiOperation({ summary: 'Delete a role' })
    remove(@Param('id') id: string) {
        return this.roleService.delete(id);
    }

    @Get(':id/permissions')
    @Permissions('role:read')
    @ApiOperation({ summary: 'Get permissions of a role' })
    getPermissions(@Param('id') id: string) {
        return this.roleService.getPermissions(id);
    }

    @Post(':id/permissions')
    @Permissions('role:update')
    @ApiOperation({ summary: 'Assign permissions to a role' })
    assignPermissions(@Param('id') id: string, @Body() dto: AssignPermissionsDto) {
        return this.roleService.assignPermissions(id, dto.permission_ids);
    }

    @Delete(':id/permissions')
    @Permissions('role:update')
    @ApiOperation({ summary: 'Remove permissions from a role' })
    removePermissions(@Param('id') id: string, @Body() dto: AssignPermissionsDto) {
        return this.roleService.removePermissions(id, dto.permission_ids);
    }
}
