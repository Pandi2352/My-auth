import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { ApiKeyService } from './api-key.service.js';
import { CreateApiKeyDto } from './dto/create-api-key.dto.js';

@ApiTags('User - API Keys')
@ApiBearerAuth('access-token')
@Controller('user/api-keys')
export class ApiKeyController {
    constructor(private readonly apiKeyService: ApiKeyService) {}

    @Post()
    @Permissions('user:update')
    @ApiOperation({ summary: 'Generate a new API key' })
    create(@CurrentUser('_id') userId: string, @Body() dto: CreateApiKeyDto) {
        return this.apiKeyService.create(userId, dto);
    }

    @Get()
    @Permissions('user:read')
    @ApiOperation({ summary: 'List your API keys (key_hash hidden)' })
    findAll(@CurrentUser('_id') userId: string) {
        return this.apiKeyService.findByUser(userId);
    }

    @Get(':id')
    @Permissions('user:read')
    @ApiOperation({ summary: 'Get API key details' })
    findOne(@CurrentUser('_id') userId: string, @Param('id') id: string) {
        return this.apiKeyService.findById(id, userId);
    }

    @Post(':id/revoke')
    @Permissions('user:update')
    @ApiOperation({ summary: 'Revoke (deactivate) an API key' })
    revoke(@CurrentUser('_id') userId: string, @Param('id') id: string) {
        return this.apiKeyService.revoke(id, userId);
    }

    @Delete(':id')
    @Permissions('user:update')
    @ApiOperation({ summary: 'Permanently delete an API key' })
    remove(@CurrentUser('_id') userId: string, @Param('id') id: string) {
        return this.apiKeyService.delete(id, userId);
    }
}
