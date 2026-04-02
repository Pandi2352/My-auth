import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SystemConfigService } from './system-config.service.js';

import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('Public - Configuration')
@Controller('public/config')
export class PublicConfigController {
    constructor(private readonly configService: SystemConfigService) {}

    @Public()
    @Get()
    @ApiOperation({ summary: 'Get public system configuration (site name, registration status, etc)' })
    async getPublicConfig() {
        const [siteName, logoUrl, faviconUrl, primaryColor, accentColor, customCss, registrationEnabled] = await Promise.all([
            this.configService.getValue('app.site_name', 'NestJS App'),
            this.configService.getValue('app.logo_url', ''),
            this.configService.getValue('app.favicon_url', ''),
            this.configService.getValue('app.primary_color', '#0f172a'),
            this.configService.getValue('app.accent_color', '#6366f1'),
            this.configService.getValue('app.custom_css', ''),
            this.configService.getValue('auth.registration_enabled', true),
        ]);

        return {
            site_name: siteName,
            logo_url: logoUrl,
            favicon_url: faviconUrl,
            primary_color: primaryColor,
            accent_color: accentColor,
            custom_css: customCss,
            registration_enabled: registrationEnabled,
        };
    }
}
