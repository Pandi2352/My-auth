import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { InvitationService } from './invitation.service.js';
import { CreateInvitationDto } from './dto/create-invitation.dto.js';

class InvitationListQueryDto extends PaginationQueryDto {
    @ApiPropertyOptional({ example: 'pending', description: 'Filter: pending, accepted, expired, revoked' })
    @IsOptional()
    @IsString()
    status?: string;
}

@ApiTags('Admin - Invitations')
@ApiBearerAuth('access-token')
@Controller('admin/invitations')
export class InvitationController {
    constructor(private readonly invitationService: InvitationService) {}

    @Post()
    @Permissions('user:create')
    @ApiOperation({ summary: 'Send a user invitation email' })
    create(@Body() dto: CreateInvitationDto, @CurrentUser('_id') userId: string) {
        return this.invitationService.create(dto, userId);
    }

    @Get()
    @Permissions('user:read')
    @ApiOperation({ summary: 'List all invitations (filter: pending, accepted, expired, revoked)' })
    findAll(@Query() query: InvitationListQueryDto) {
        return this.invitationService.findAll(query);
    }

    @Get(':id')
    @Permissions('user:read')
    @ApiOperation({ summary: 'Get invitation by ID' })
    findOne(@Param('id') id: string) {
        return this.invitationService.findById(id);
    }

    @Post(':id/resend')
    @Permissions('user:create')
    @ApiOperation({ summary: 'Resend invitation email (extends expiry)' })
    resend(@Param('id') id: string) {
        return this.invitationService.resend(id);
    }

    @Delete(':id')
    @Permissions('user:create')
    @ApiOperation({ summary: 'Revoke an invitation' })
    revoke(@Param('id') id: string) {
        return this.invitationService.revoke(id);
    }
}

// Public endpoint for validating invitation token (used by frontend registration)
@ApiTags('Invitations')
@Controller('invitations')
export class InvitationPublicController {
    constructor(private readonly invitationService: InvitationService) {}

    @Public()
    @Get('validate/:token')
    @ApiOperation({ summary: 'Validate an invitation token (public)' })
    validate(@Param('token') token: string) {
        return this.invitationService.validateToken(token);
    }
}
