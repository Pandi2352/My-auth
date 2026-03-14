import { Controller, Delete, Get, Ip, Param, Query, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { SocialAuthService } from './social-auth.service.js';
import { SocialConnectorService } from './social-connector.service.js';

@ApiTags('Social Auth')
@Controller('auth/social')
export class SocialAuthController {
    constructor(
        private readonly socialAuthService: SocialAuthService,
        private readonly connectorService: SocialConnectorService,
    ) {}

    // ── List Available Providers (Public) ─────────────────────

    @Public()
    @Get('providers')
    @ApiOperation({ summary: 'List enabled social login providers (public)' })
    getProviders() {
        return this.connectorService.findEnabled();
    }

    // ── Initiate OAuth Flow ───────────────────────────────────

    @Public()
    @Get(':provider')
    @ApiOperation({ summary: 'Redirect to provider authorization page' })
    async authorize(
        @Param('provider') provider: string,
        @Query('state') state: string,
        @Res() res: Response,
    ) {
        const result = await this.socialAuthService.getAuthorizationUrl(provider, state);
        res.redirect(result.url);
    }

    // ── OAuth Callback ────────────────────────────────────────

    @Public()
    @Get(':provider/callback')
    @ApiOperation({ summary: 'OAuth callback — exchanges code for tokens, creates/links user' })
    async callback(
        @Param('provider') provider: string,
        @Query('code') code: string,
        @Query('error') error: string,
        @Req() req: Request,
        @Ip() ip: string,
        @Res() res: Response,
    ) {
        if (error) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error)}`);
        }

        if (!code) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            return res.redirect(`${frontendUrl}/login?error=no_code`);
        }

        try {
            const userAgent = req.headers['user-agent'] || '';
            const result = await this.socialAuthService.handleCallback(provider, code, ip, userAgent);

            // Redirect to frontend with tokens
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const params = new URLSearchParams({
                access_token: result.access_token,
                refresh_token: result.refresh_token,
                is_new_user: String(result.is_new_user),
            });
            res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
        } catch (err: any) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const errorMsg = err?.error_description || err?.message || 'social_login_failed';
            res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(errorMsg)}`);
        }
    }

    // ── Link Social Account (Authenticated User) ──────────────

    @ApiBearerAuth('access-token')
    @Get(':provider/link')
    @Permissions('user:update')
    @ApiOperation({ summary: 'Redirect to provider to link social account' })
    async linkRedirect(
        @Param('provider') provider: string,
        @CurrentUser('_id') userId: string,
        @Res() res: Response,
    ) {
        const result = await this.socialAuthService.getAuthorizationUrl(provider, `link_${userId}`);
        res.redirect(result.url);
    }

    @ApiBearerAuth('access-token')
    @Get(':provider/link/callback')
    @Permissions('user:update')
    @ApiOperation({ summary: 'Callback to link social account to existing user' })
    async linkCallback(
        @Param('provider') provider: string,
        @Query('code') code: string,
        @CurrentUser('_id') userId: string,
    ) {
        return this.socialAuthService.linkAccount(userId, provider, code);
    }

    // ── Get Linked Accounts ───────────────────────────────────

    @ApiBearerAuth('access-token')
    @Get('accounts/linked')
    @Permissions('user:read')
    @ApiOperation({ summary: 'Get your linked social accounts' })
    getLinkedAccounts(@CurrentUser('_id') userId: string) {
        return this.socialAuthService.getLinkedAccounts(userId);
    }

    // ── Unlink Social Account ─────────────────────────────────

    @ApiBearerAuth('access-token')
    @Delete(':provider/unlink')
    @Permissions('user:update')
    @ApiOperation({ summary: 'Unlink a social account' })
    unlink(@CurrentUser('_id') userId: string, @Param('provider') provider: string) {
        return this.socialAuthService.unlinkAccount(userId, provider);
    }
}
