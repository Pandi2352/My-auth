import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionService } from './permission.service.js';
import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';

@ApiTags('Permissions')
@ApiBearerAuth('access-token')
@Controller('permissions')
export class PermissionController {
    constructor(private readonly permissionService: PermissionService) {}

    @Post()
    @Permissions('permission:create')
    @ApiOperation({ summary: 'Create a new permission' })
    create(@Body() dto: CreatePermissionDto) {
        return this.permissionService.create(dto);
    }

    @Get()
    @Permissions('permission:read')
    @ApiOperation({ summary: 'Get all permissions' })
    findAll() {
        return this.permissionService.findAll();
    }

    @Get(':id')
    @Permissions('permission:read')
    @ApiOperation({ summary: 'Get permission by ID' })
    findOne(@Param('id') id: string) {
        return this.permissionService.findById(id);
    }

    @Patch(':id')
    @Permissions('permission:update')
    @ApiOperation({ summary: 'Update a permission' })
    update(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
        return this.permissionService.update(id, dto);
    }

    @Delete(':id')
    @Permissions('permission:delete')
    @ApiOperation({ summary: 'Delete a permission' })
    remove(@Param('id') id: string) {
        return this.permissionService.delete(id);
    }
}
