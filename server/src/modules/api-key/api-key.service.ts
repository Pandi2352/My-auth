import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { ApiKey, ApiKeyDocument } from './schemas/api-key.schema.js';
import { CreateApiKeyDto } from './dto/create-api-key.dto.js';
import { BcryptPasswordHelper } from '../../utils/BcryptPasswordHelper.js';
import { ErrorEntity } from '../../utils/reponseUtils/ErrorEntity.js';
import { HttpStatus } from '../../utils/reponseUtils/httpStatus.js';

@Injectable()
export class ApiKeyService {
    private bcrypt = BcryptPasswordHelper.Instance;

    constructor(
        @InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKeyDocument>,
    ) {}

    // ── Generate API Key ──────────────────────────────────────

    async create(userId: string, dto: CreateApiKeyDto) {
        // Generate a secure random key
        const rawKey = crypto.randomBytes(32).toString('hex');
        const prefix = rawKey.substring(0, 8); // First 8 chars as visible prefix
        const key_hash = await this.bcrypt.generateBcryptPassword(rawKey);

        const apiKey = await this.apiKeyModel.create({
            user_id: new Types.ObjectId(userId),
            key_hash,
            name: dto.name,
            prefix,
            permissions: dto.permissions || [],
            expires_at: dto.expires_at ? new Date(dto.expires_at) : undefined,
        });

        // Return the raw key ONLY on creation — it cannot be retrieved later
        return {
            _id: apiKey._id,
            name: apiKey.name,
            key: rawKey,
            prefix,
            permissions: apiKey.permissions,
            expires_at: apiKey.expires_at,
            created_at: apiKey.created_at,
            warning: 'Save this key now. It cannot be retrieved later.',
        };
    }

    // ── List User's API Keys ──────────────────────────────────

    async findByUser(userId: string) {
        return this.apiKeyModel
            .find({ user_id: new Types.ObjectId(userId) })
            .select('-key_hash')
            .sort({ created_at: -1 })
            .lean();
    }

    // ── Get Single Key ────────────────────────────────────────

    async findById(id: string, userId: string) {
        const key = await this.apiKeyModel
            .findOne({ _id: id, user_id: new Types.ObjectId(userId) })
            .select('-key_hash')
            .lean();

        if (!key) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'api_key_not_found',
                error_description: 'API key not found',
            });
        }
        return key;
    }

    // ── Validate API Key ──────────────────────────────────────

    async validate(rawKey: string) {
        const prefix = rawKey.substring(0, 8);
        const candidates = await this.apiKeyModel.find({
            prefix,
            is_active: true,
        });

        for (const candidate of candidates) {
            // Check expiry
            if (candidate.expires_at && candidate.expires_at < new Date()) {
                continue;
            }

            const isMatch = await this.bcrypt.compareBcryptPassword(rawKey, candidate.key_hash);
            if (isMatch) {
                // Update last used
                candidate.last_used_at = new Date();
                await candidate.save();

                return {
                    user_id: candidate.user_id.toString(),
                    permissions: candidate.permissions,
                    key_id: candidate._id.toString(),
                };
            }
        }

        return null;
    }

    // ── Revoke API Key ────────────────────────────────────────

    async revoke(id: string, userId: string) {
        const key = await this.apiKeyModel.findOneAndUpdate(
            { _id: id, user_id: new Types.ObjectId(userId) },
            { $set: { is_active: false } },
            { returnDocument: 'after' },
        ).lean();

        if (!key) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'api_key_not_found',
                error_description: 'API key not found',
            });
        }

        return { message: 'API key revoked' };
    }

    // ── Delete API Key ────────────────────────────────────────

    async delete(id: string, userId: string) {
        const key = await this.apiKeyModel.findOneAndDelete({
            _id: id,
            user_id: new Types.ObjectId(userId),
        }).lean();

        if (!key) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'api_key_not_found',
                error_description: 'API key not found',
            });
        }

        return { deleted: true };
    }

    // ── Revoke All User Keys ──────────────────────────────────

    async revokeAllByUser(userId: string) {
        await this.apiKeyModel.updateMany(
            { user_id: new Types.ObjectId(userId), is_active: true },
            { $set: { is_active: false } },
        );
        return { message: 'All API keys revoked' };
    }
}
