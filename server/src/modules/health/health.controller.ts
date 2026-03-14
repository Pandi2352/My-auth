import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { HealthService } from './health.service.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    @Public()
    @Get()
    @ApiOperation({ summary: 'Application health check' })
    getHealth() {
        return this.healthService.getHealth();
    }

    @Public()
    @Get('ready')
    @ApiOperation({ summary: 'Readiness probe — checks database connectivity' })
    async getReadiness() {
        return this.healthService.getReadiness();
    }
}
