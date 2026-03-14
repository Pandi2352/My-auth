import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SystemConfig, SystemConfigDocument } from './schemas/system-config.schema.js';
import { CreateConfigDto, UpdateConfigDto } from './dto/update-config.dto.js';
import { ErrorEntity } from '../../utils/reponseUtils/ErrorEntity.js';
import { HttpStatus } from '../../utils/reponseUtils/httpStatus.js';

// Default system configuration values
const DEFAULTS: Array<{ key: string; value: any; category: string; description: string }> = [
    // App settings
    { key: 'app.site_name', value: 'NestJS App', category: 'app', description: 'Application display name' },
    { key: 'app.logo_url', value: '', category: 'app', description: 'Application logo URL' },
    { key: 'app.support_email', value: 'support@app.com', category: 'app', description: 'Support contact email' },
    { key: 'app.maintenance_mode', value: false, category: 'app', description: 'Enable maintenance mode' },
    { key: 'app.announcement_enabled', value: false, category: 'app', description: 'Show site-wide announcement banner' },
    { key: 'app.announcement_message', value: '', category: 'app', description: 'Announcement banner text' },
    { key: 'app.announcement_type', value: 'info', category: 'app', description: 'Banner type: info, warning, success, error' },
    { key: 'app.announcement_dismissible', value: true, category: 'app', description: 'Allow users to dismiss the banner' },

    // Auth settings
    { key: 'auth.access_token_ttl', value: '15m', category: 'auth', description: 'Access token TTL' },
    { key: 'auth.refresh_token_ttl', value: '7d', category: 'auth', description: 'Refresh token TTL' },
    { key: 'auth.password_min_length', value: 8, category: 'auth', description: 'Minimum password length' },
    { key: 'auth.max_login_attempts', value: 5, category: 'auth', description: 'Max failed login attempts before lock' },
    { key: 'auth.lock_duration_minutes', value: 30, category: 'auth', description: 'Account lock duration in minutes' },
    { key: 'auth.require_email_verification', value: true, category: 'auth', description: 'Require email verification to login' },

    // Email settings
    { key: 'email.smtp_host', value: '', category: 'email', description: 'SMTP server hostname' },
    { key: 'email.smtp_port', value: 587, category: 'email', description: 'SMTP server port' },
    { key: 'email.from_address', value: 'noreply@app.com', category: 'email', description: 'Default sender email' },
    { key: 'email.from_name', value: 'NestJS App', category: 'email', description: 'Default sender name' },

    // Security settings
    { key: 'security.rate_limit_ttl', value: 60000, category: 'security', description: 'Rate limit window (ms)' },
    { key: 'security.rate_limit_max', value: 10, category: 'security', description: 'Max requests per window' },
    { key: 'security.ip_whitelist', value: [], category: 'security', description: 'Whitelisted IP addresses' },
    { key: 'security.ip_blacklist', value: [], category: 'security', description: 'Blacklisted IP addresses' },
    { key: 'security.session_timeout_minutes', value: 1440, category: 'security', description: 'Session timeout (minutes)' },
];

@Injectable()
export class SystemConfigService implements OnModuleInit {
    private readonly logger = new Logger(SystemConfigService.name);

    constructor(
        @InjectModel(SystemConfig.name) private configModel: Model<SystemConfigDocument>,
    ) {}

    async onModuleInit() {
        await this.seedDefaults();
    }

    // ── Seed Defaults ─────────────────────────────────────────

    private async seedDefaults() {
        let seeded = 0;
        for (const def of DEFAULTS) {
            const existing = await this.configModel.findOne({ key: def.key });
            if (!existing) {
                await this.configModel.create(def);
                seeded++;
            }
        }
        if (seeded > 0) {
            this.logger.log(`Seeded ${seeded} default config values`);
        }
    }

    // ── Get All Configs ───────────────────────────────────────

    async findAll() {
        return this.configModel.find().sort({ category: 1, key: 1 }).lean();
    }

    // ── Get by Category ───────────────────────────────────────

    async findByCategory(category: string) {
        return this.configModel.find({ category }).sort({ key: 1 }).lean();
    }

    // ── Get Single Config ─────────────────────────────────────

    async findByKey(key: string) {
        const config = await this.configModel.findOne({ key }).lean();
        if (!config) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'config_not_found',
                error_description: `Config key '${key}' not found`,
            });
        }
        return config;
    }

    // ── Get Value Only ────────────────────────────────────────

    async getValue<T = any>(key: string, defaultValue?: T): Promise<T | undefined> {
        const config = await this.configModel.findOne({ key }).lean();
        return config ? config.value : defaultValue;
    }

    // ── Create Config ─────────────────────────────────────────

    async create(dto: CreateConfigDto, userId: string) {
        const existing = await this.configModel.findOne({ key: dto.key });
        if (existing) {
            throw new ErrorEntity({
                http_code: HttpStatus.CONFLICT,
                error: 'config_exists',
                error_description: `Config key '${dto.key}' already exists`,
            });
        }

        return this.configModel.create({
            key: dto.key,
            value: dto.value,
            category: dto.category,
            description: dto.description,
            updated_by: new Types.ObjectId(userId),
        });
    }

    // ── Update Config ─────────────────────────────────────────

    async update(key: string, dto: UpdateConfigDto, userId: string) {
        const updateData: any = {
            value: dto.value,
            updated_by: new Types.ObjectId(userId),
        };
        if (dto.description !== undefined) {
            updateData.description = dto.description;
        }

        const config = await this.configModel.findOneAndUpdate(
            { key },
            { $set: updateData },
            { returnDocument: 'after' },
        ).lean();

        if (!config) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'config_not_found',
                error_description: `Config key '${key}' not found`,
            });
        }

        return config;
    }

    // ── Delete Config ─────────────────────────────────────────

    async delete(key: string) {
        const config = await this.configModel.findOneAndDelete({ key }).lean();
        if (!config) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'config_not_found',
                error_description: `Config key '${key}' not found`,
            });
        }
        return { deleted: true };
    }

    // ── Bulk Update (by category) ─────────────────────────────

    async bulkUpdate(category: string, values: Record<string, any>, userId: string) {
        const results: any[] = [];
        for (const [key, value] of Object.entries(values)) {
            const fullKey = key.includes('.') ? key : `${category}.${key}`;
            const config = await this.configModel.findOneAndUpdate(
                { key: fullKey },
                { $set: { value, updated_by: new Types.ObjectId(userId) } },
                { returnDocument: 'after' },
            ).lean();
            if (config) {
                results.push(config);
            }
        }
        return results;
    }
}
