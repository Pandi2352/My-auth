import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { AdvertisementService } from './advertisement.service.js';
import { CreateAdDto } from './dto/create-ad.dto.js';
import { UpdateAdDto } from './dto/update-ad.dto.js';
import { AdPosition } from './schemas/advertisement.schema.js';

@ApiTags('Advertisements')
@Controller('admin/advertisements')
@ApiBearerAuth('access-token')
export class AdvertisementController {
    constructor(private readonly adService: AdvertisementService) {}

    @Post()
    @Permissions('advertisement:create')
    @ApiOperation({ summary: 'Create a new advertisement' })
    create(@Body() dto: CreateAdDto) {
        return this.adService.create(dto);
    }

    @Get()
    @Permissions('advertisement:read')
    @ApiOperation({ summary: 'List all advertisements' })
    findAll() {
        return this.adService.findAll();
    }

    @Get(':id')
    @Permissions('advertisement:read')
    @ApiOperation({ summary: 'Get advertisement by ID' })
    findById(@Param('id') id: string) {
        return this.adService.findById(id);
    }

    @Patch(':id')
    @Permissions('advertisement:update')
    @ApiOperation({ summary: 'Update an advertisement' })
    update(@Param('id') id: string, @Body() dto: UpdateAdDto) {
        return this.adService.update(id, dto);
    }

    @Patch(':id/toggle')
    @Permissions('advertisement:update')
    @ApiOperation({ summary: 'Toggle ad active status' })
    toggle(@Param('id') id: string) {
        return this.adService.toggle(id);
    }

    @Delete(':id')
    @Permissions('advertisement:delete')
    @ApiOperation({ summary: 'Delete an advertisement' })
    delete(@Param('id') id: string) {
        return this.adService.delete(id);
    }
}

/** Public endpoints — no auth required */
@ApiTags('Advertisements')
@Controller('ads')
export class PublicAdController {
    constructor(private readonly adService: AdvertisementService) {}

    @Public()
    @Get()
    @ApiOperation({ summary: 'Get active ads by position (public)' })
    getActiveAds(
        @Query('position') position: AdPosition,
        @Query('page') page?: string,
    ) {
        return this.adService.getActiveAds(position, page);
    }

    @Public()
    @Post(':id/impression')
    @ApiOperation({ summary: 'Track ad impression' })
    trackImpression(@Param('id') id: string) {
        return this.adService.trackImpression(id);
    }

    @Public()
    @Post(':id/click')
    @ApiOperation({ summary: 'Track ad click' })
    trackClick(@Param('id') id: string) {
        return this.adService.trackClick(id);
    }
}
