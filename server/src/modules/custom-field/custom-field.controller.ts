import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { CustomFieldService } from './custom-field.service.js';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto.js';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto.js';

@ApiTags('Custom Fields')
@ApiBearerAuth('access-token')
@Controller('admin/custom-fields')
export class CustomFieldController {
    constructor(private readonly fieldService: CustomFieldService) {}

    @Post()
    @Permissions('settings:update')
    @ApiOperation({ summary: 'Create a custom user field' })
    create(@Body() dto: CreateCustomFieldDto) {
        return this.fieldService.create(dto);
    }

    @Get()
    @Permissions('settings:read')
    @ApiOperation({ summary: 'List all custom fields' })
    findAll() {
        return this.fieldService.findAll();
    }

    @Get('active')
    @ApiOperation({ summary: 'List active custom fields (for forms)' })
    findActive() {
        return this.fieldService.findActive();
    }

    @Get(':id')
    @Permissions('settings:read')
    @ApiOperation({ summary: 'Get custom field by ID' })
    findById(@Param('id') id: string) {
        return this.fieldService.findById(id);
    }

    @Patch(':id')
    @Permissions('settings:update')
    @ApiOperation({ summary: 'Update a custom field' })
    update(@Param('id') id: string, @Body() dto: UpdateCustomFieldDto) {
        return this.fieldService.update(id, dto);
    }

    @Delete(':id')
    @Permissions('settings:update')
    @ApiOperation({ summary: 'Delete a custom field' })
    delete(@Param('id') id: string) {
        return this.fieldService.delete(id);
    }
}
