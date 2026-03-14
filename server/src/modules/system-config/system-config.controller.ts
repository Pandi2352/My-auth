import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { SystemConfigService } from './system-config.service.js';
import { CreateConfigDto, UpdateConfigDto } from './dto/update-config.dto.js';

@ApiTags('Admin - Settings')
@ApiBearerAuth('access-token')
@Controller('admin/settings')
export class SystemConfigController {
    constructor(private readonly configService: SystemConfigService) {}

    @Get()
    @Permissions('settings:read')
    @ApiOperation({ summary: 'Get all system configuration' })
    findAll() {
        return this.configService.findAll();
    }

    @Get('category/:category')
    @Permissions('settings:read')
    @ApiOperation({ summary: 'Get config by category (app, auth, email, security)' })
    findByCategory(@Param('category') category: string) {
        return this.configService.findByCategory(category);
    }

    @Get('key/:key')
    @Permissions('settings:read')
    @ApiOperation({ summary: 'Get a single config value by key' })
    findByKey(@Param('key') key: string) {
        return this.configService.findByKey(key);
    }

    @Post()
    @Permissions('settings:update')
    @ApiOperation({ summary: 'Create a new config entry' })
    create(@Body() dto: CreateConfigDto, @CurrentUser('_id') userId: string) {
        return this.configService.create(dto, userId);
    }

    @Patch('key/:key')
    @Permissions('settings:update')
    @ApiOperation({ summary: 'Update a config value by key' })
    update(
        @Param('key') key: string,
        @Body() dto: UpdateConfigDto,
        @CurrentUser('_id') userId: string,
    ) {
        return this.configService.update(key, dto, userId);
    }

    @Patch('category/:category')
    @Permissions('settings:update')
    @ApiOperation({ summary: 'Bulk update config values by category' })
    bulkUpdate(
        @Param('category') category: string,
        @Body() values: Record<string, any>,
        @CurrentUser('_id') userId: string,
    ) {
        return this.configService.bulkUpdate(category, values, userId);
    }

    @Delete('key/:key')
    @Permissions('settings:update')
    @ApiOperation({ summary: 'Delete a config entry' })
    delete(@Param('key') key: string) {
        return this.configService.delete(key);
    }
}
