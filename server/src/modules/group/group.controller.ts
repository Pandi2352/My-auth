import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { SearchPaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { GroupService } from './group.service.js';
import { CreateGroupDto } from './dto/create-group.dto.js';
import { UpdateGroupDto } from './dto/update-group.dto.js';
import { GroupUsersDto } from './dto/group-users.dto.js';
import { GroupRolesDto } from './dto/group-roles.dto.js';

class GroupListQueryDto extends SearchPaginationQueryDto {
    @ApiPropertyOptional({ example: 'true', description: 'Filter by active status' })
    @IsOptional()
    @IsString()
    is_active?: string;
}

@ApiTags('Admin - Groups')
@ApiBearerAuth('access-token')
@Controller('admin/groups')
export class GroupController {
    constructor(private readonly groupService: GroupService) {}

    @Post()
    @Permissions('group:create')
    @ApiOperation({ summary: 'Create a new user group' })
    create(@Body() dto: CreateGroupDto) {
        return this.groupService.create(dto);
    }

    @Get()
    @Permissions('group:read')
    @ApiOperation({ summary: 'List all groups (paginated, searchable)' })
    findAll(@Query() query: GroupListQueryDto) {
        return this.groupService.findAll(query);
    }

    @Get(':id')
    @Permissions('group:read')
    @ApiOperation({ summary: 'Get group by ID (with populated roles & users)' })
    findOne(@Param('id') id: string) {
        return this.groupService.findById(id);
    }

    @Patch(':id')
    @Permissions('group:update')
    @ApiOperation({ summary: 'Update group details' })
    update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
        return this.groupService.update(id, dto);
    }

    @Delete(':id')
    @Permissions('group:delete')
    @ApiOperation({ summary: 'Delete a group' })
    remove(@Param('id') id: string) {
        return this.groupService.delete(id);
    }

    @Post(':id/users')
    @Permissions('group:update')
    @ApiOperation({ summary: 'Add users to group' })
    addUsers(@Param('id') id: string, @Body() dto: GroupUsersDto) {
        return this.groupService.addUsers(id, dto.user_ids);
    }

    @Delete(':id/users')
    @Permissions('group:update')
    @ApiOperation({ summary: 'Remove users from group' })
    removeUsers(@Param('id') id: string, @Body() dto: GroupUsersDto) {
        return this.groupService.removeUsers(id, dto.user_ids);
    }

    @Post(':id/roles')
    @Permissions('group:update')
    @ApiOperation({ summary: 'Assign roles to group' })
    assignRoles(@Param('id') id: string, @Body() dto: GroupRolesDto) {
        return this.groupService.assignRoles(id, dto.role_ids);
    }

    @Delete(':id/roles')
    @Permissions('group:update')
    @ApiOperation({ summary: 'Remove roles from group' })
    removeRoles(@Param('id') id: string, @Body() dto: GroupRolesDto) {
        return this.groupService.removeRoles(id, dto.role_ids);
    }

    @Get(':id/permissions')
    @Permissions('group:read')
    @ApiOperation({ summary: 'Get resolved permissions for a group (from all assigned roles)' })
    getPermissions(@Param('id') id: string) {
        return this.groupService.getGroupPermissions(id);
    }
}
