import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { SystemConfigService } from '../../modules/system-config/system-config.service.js';
import { ErrorEntity } from '../../utils/reponseUtils/ErrorEntity.js';
import { HttpStatus } from '../../utils/reponseUtils/httpStatus.js';

@Injectable()
export class IpBlockGuard implements CanActivate {
    private readonly logger = new Logger(IpBlockGuard.name);

    constructor(private readonly configService: SystemConfigService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const ip = this.extractIp(request);

        if (!ip) return true;

        try {
            const [whitelist, blacklist] = await Promise.all([
                this.configService.getValue<string[]>('security.ip_whitelist'),
                this.configService.getValue<string[]>('security.ip_blacklist'),
            ]);

            // If whitelist is non-empty, only whitelisted IPs are allowed
            if (Array.isArray(whitelist) && whitelist.length > 0) {
                if (!this.matchesAny(ip, whitelist)) {
                    this.logger.warn(`Blocked non-whitelisted IP: ${ip}`);
                    throw new ErrorEntity({
                        http_code: HttpStatus.FORBIDDEN,
                        error: 'ip_not_allowed',
                        error_description: 'Your IP address is not authorized to access this service',
                    });
                }
                return true;
            }

            // Check blacklist
            if (Array.isArray(blacklist) && blacklist.length > 0) {
                if (this.matchesAny(ip, blacklist)) {
                    this.logger.warn(`Blocked blacklisted IP: ${ip}`);
                    throw new ErrorEntity({
                        http_code: HttpStatus.FORBIDDEN,
                        error: 'ip_blocked',
                        error_description: 'Your IP address has been blocked',
                    });
                }
            }
        } catch (error) {
            if (error instanceof ErrorEntity) throw error;
            // Fail open — don't block users if config lookup fails
            this.logger.error('IP check failed, allowing request', error);
        }

        return true;
    }

    private extractIp(request: any): string {
        const forwarded = request.headers?.['x-forwarded-for'];
        if (forwarded) {
            return (typeof forwarded === 'string' ? forwarded : forwarded[0])
                .split(',')[0]
                .trim();
        }
        return request.ip || request.connection?.remoteAddress || '';
    }

    /** Support exact match and CIDR-like prefix match (e.g., "192.168.1.*") */
    private matchesAny(ip: string, list: string[]): boolean {
        for (const entry of list) {
            if (!entry) continue;
            const trimmed = entry.trim();
            if (trimmed === ip) return true;
            // Wildcard support: "192.168.1.*" matches "192.168.1.100"
            if (trimmed.includes('*')) {
                const prefix = trimmed.replace(/\.\*$/, '.');
                if (ip.startsWith(prefix)) return true;
            }
        }
        return false;
    }
}
