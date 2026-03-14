import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { SocialConnectorService } from './social-connector.service.js';
import { CreateConnectorDto } from './dto/create-connector.dto.js';
import { UpdateConnectorDto } from './dto/update-connector.dto.js';

@ApiTags('Admin - Social Connectors')
@ApiBearerAuth('access-token')
@Controller('admin/social-connectors')
export class SocialConnectorController {
    constructor(private readonly connectorService: SocialConnectorService) {}

    @Post()
    @Permissions('settings:update')
    @ApiOperation({ summary: 'Create a social login connector (Google, GitHub, etc.)' })
    create(@Body() dto: CreateConnectorDto, @CurrentUser('_id') userId: string) {
        return this.connectorService.create(dto, userId);
    }

    @Get()
    @Permissions('settings:read')
    @ApiOperation({ summary: 'List all social connectors (admin view, secrets masked)' })
    findAll() {
        return this.connectorService.findAll();
    }

    @Get(':id')
    @Permissions('settings:read')
    @ApiOperation({ summary: 'Get connector details by ID' })
    findOne(@Param('id') id: string) {
        return this.connectorService.findById(id);
    }

    @Patch(':id')
    @Permissions('settings:update')
    @ApiOperation({ summary: 'Update connector configuration' })
    update(@Param('id') id: string, @Body() dto: UpdateConnectorDto) {
        return this.connectorService.update(id, dto);
    }

    @Patch(':id/toggle')
    @Permissions('settings:update')
    @ApiOperation({ summary: 'Enable or disable a connector' })
    toggle(@Param('id') id: string) {
        return this.connectorService.toggle(id);
    }

    @Delete(':id')
    @Permissions('settings:update')
    @ApiOperation({ summary: 'Delete a social connector' })
    remove(@Param('id') id: string) {
        return this.connectorService.delete(id);
    }
}
