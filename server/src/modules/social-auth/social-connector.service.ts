import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SocialConnector, SocialConnectorDocument } from './schemas/social-connector.schema.js';
import { CreateConnectorDto } from './dto/create-connector.dto.js';
import { UpdateConnectorDto } from './dto/update-connector.dto.js';
import { PROVIDER_DEFAULTS } from './provider-defaults.js';
import { ErrorEntity } from '../../utils/reponseUtils/ErrorEntity.js';
import { HttpStatus } from '../../utils/reponseUtils/httpStatus.js';

@Injectable()
export class SocialConnectorService {
    constructor(
        @InjectModel(SocialConnector.name) private connectorModel: Model<SocialConnectorDocument>,
    ) {}

    // ── Create Connector ──────────────────────────────────────

    async create(dto: CreateConnectorDto, userId: string) {
        // Fill in default URLs for known providers
        const defaults = PROVIDER_DEFAULTS[dto.provider];
        const createData: any = {
            provider: dto.provider,
            display_name: dto.display_name,
            client_id: dto.client_id,
            client_secret: dto.client_secret,
            scopes: dto.scopes || defaults?.default_scopes || ['email', 'profile'],
            is_enabled: dto.is_enabled ?? false,
            sort_order: dto.sort_order ?? 0,
            icon_url: dto.icon_url,
            authorize_url: dto.authorize_url || defaults?.authorize_url || '',
            token_url: dto.token_url || defaults?.token_url || '',
            profile_url: dto.profile_url || defaults?.profile_url || '',
            callback_url: dto.callback_url,
            created_by: new Types.ObjectId(userId),
        };

        if (dto.provider === 'custom' && (!createData.authorize_url || !createData.token_url)) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'missing_urls',
                error_description: 'Custom providers require authorize_url and token_url',
            });
        }

        const connector = await this.connectorModel.create(createData);
        return this.sanitize(connector.toObject());
    }

    // ── List All Connectors (Admin) ───────────────────────────

    async findAll() {
        const connectors = await this.connectorModel
            .find()
            .sort({ sort_order: 1, created_at: 1 })
            .lean();
        return connectors.map((c) => this.sanitize(c));
    }

    // ── List Enabled Connectors (Public) ──────────────────────

    async findEnabled() {
        const connectors = await this.connectorModel
            .find({ is_enabled: true })
            .select('provider display_name icon_url sort_order')
            .sort({ sort_order: 1 })
            .lean();
        return connectors;
    }

    // ── Get by ID ─────────────────────────────────────────────

    async findById(id: string) {
        const connector = await this.connectorModel.findById(id).lean();
        if (!connector) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'connector_not_found',
                error_description: 'Social connector not found',
            });
        }
        return this.sanitize(connector);
    }

    // ── Get by Provider (internal) ────────────────────────────

    async findByProvider(provider: string): Promise<SocialConnectorDocument | null> {
        return this.connectorModel.findOne({ provider, is_enabled: true });
    }

    // ── Update Connector ──────────────────────────────────────

    async update(id: string, dto: UpdateConnectorDto) {
        const connector = await this.connectorModel.findByIdAndUpdate(
            id,
            { $set: dto },
            { returnDocument: 'after' },
        ).lean();

        if (!connector) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'connector_not_found',
                error_description: 'Social connector not found',
            });
        }
        return this.sanitize(connector);
    }

    // ── Toggle Enable/Disable ─────────────────────────────────

    async toggle(id: string) {
        const connector = await this.connectorModel.findById(id);
        if (!connector) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'connector_not_found',
                error_description: 'Social connector not found',
            });
        }

        connector.is_enabled = !connector.is_enabled;
        await connector.save();

        return {
            _id: connector._id,
            provider: connector.provider,
            display_name: connector.display_name,
            is_enabled: connector.is_enabled,
        };
    }

    // ── Delete Connector ──────────────────────────────────────

    async delete(id: string) {
        const connector = await this.connectorModel.findByIdAndDelete(id).lean();
        if (!connector) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'connector_not_found',
                error_description: 'Social connector not found',
            });
        }
        return { deleted: true };
    }

    // ── Sanitize (mask client_secret in responses) ────────────

    private sanitize(connector: any): any {
        if (connector.client_secret) {
            const secret = connector.client_secret;
            connector.client_secret_masked = secret.length > 8
                ? secret.substring(0, 4) + '****' + secret.substring(secret.length - 4)
                : '****';
            delete connector.client_secret;
        }
        return connector;
    }
}
