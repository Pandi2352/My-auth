import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SystemConfigService } from './system-config.service.js';

@ApiTags('Public - Configuration')
@Controller('public/config')
export class PublicConfigController {
    constructor(private readonly configService: SystemConfigService) {}

    @Get()
    @ApiOperation({ summary: 'Get public system configuration (site name, registration status, etc)' })
    async getPublicConfig() {
        const [siteName, logoUrl, registrationEnabled] = await Promise.all([
            this.configService.getValue('app.site_name', 'NestJS App'),
            this.configService.getValue('app.logo_url', ''),
            this.configService.getValue('auth.registration_enabled', true),
        ]);

        return {
            site_name: siteName,
            logo_url: logoUrl,
            registration_enabled: registrationEnabled,
        };
    }
}
