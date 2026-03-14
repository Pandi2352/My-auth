import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session, SessionDocument } from './schemas/session.schema.js';
import { LoginAttempt, LoginAttemptDocument } from './schemas/login-attempt.schema.js';
import { SecurityEvent, SecurityEventDocument } from './schemas/security-event.schema.js';
import { UserAgentHelper } from '../../utils/UserAgentHelper.js';
import { ErrorEntity } from '../../utils/reponseUtils/ErrorEntity.js';
import { HttpStatus } from '../../utils/reponseUtils/httpStatus.js';

const SESSION_PROJECTION = {
    token_hash: 0,
    __v: 0,
};

@Injectable()
export class SessionService {
    private uaHelper = UserAgentHelper.Instance;

    constructor(
        @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
        @InjectModel(LoginAttempt.name) private loginAttemptModel: Model<LoginAttemptDocument>,
        @InjectModel(SecurityEvent.name) private securityEventModel: Model<SecurityEventDocument>,
    ) {}

    // ── Session Creation (called from AuthService on login) ──

    async createSession(data: {
        user_id: string;
        token_hash: string;
        ip_address: string;
        user_agent: string;
        expires_at: Date;
    }) {
        const parsed = this.uaHelper.getSimplifiedDeviceInfo(data.user_agent);
        const location = this.getLocationFromIp(data.ip_address);

        return this.sessionModel.create({
            user_id: new Types.ObjectId(data.user_id),
            token_hash: data.token_hash,
            device: parsed.device || `${parsed.os} ${parsed.deviceType}`,
            browser: `${parsed.browser} ${parsed.browserVersion}`.trim(),
            os: `${parsed.os} ${parsed.osVersion}`.trim(),
            ip_address: data.ip_address,
            location,
            user_agent: data.user_agent,
            is_active: true,
            last_activity: new Date(),
            expires_at: data.expires_at,
        });
    }

    // ── Get Active Sessions ─────────────────────────────────

    async getActiveSessions(userId: string) {
        return this.sessionModel
            .find(
                { user_id: new Types.ObjectId(userId), is_active: true, expires_at: { $gt: new Date() } },
                SESSION_PROJECTION,
            )
            .sort({ last_activity: -1 });
    }

    // ── Get Current Session ─────────────────────────────────

    async getCurrentSession(userId: string, tokenHash: string) {
        const sessions = await this.sessionModel.find({
            user_id: new Types.ObjectId(userId),
            is_active: true,
        });

        // Find session matching current token
        for (const session of sessions) {
            if (session.token_hash === tokenHash) {
                const result = session.toObject();
                delete (result as any).token_hash;
                return result;
            }
        }

        return null;
    }

    // ── Terminate Specific Session ──────────────────────────

    async terminateSession(userId: string, sessionId: string) {
        const session = await this.sessionModel.findOne({
            _id: sessionId,
            user_id: new Types.ObjectId(userId),
        });

        if (!session) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'session_not_found',
                error_description: 'Session not found',
            });
        }

        session.is_active = false;
        await session.save();

        return { message: 'Session terminated successfully' };
    }

    // ── Terminate All Sessions Except Current ───────────────

    async terminateAllSessions(userId: string, currentSessionId?: string) {
        const filter: any = {
            user_id: new Types.ObjectId(userId),
            is_active: true,
        };

        if (currentSessionId) {
            filter._id = { $ne: currentSessionId };
        }

        const result = await this.sessionModel.updateMany(filter, { $set: { is_active: false } });

        return { message: `Terminated ${result.modifiedCount} session(s)` };
    }

    // ── Terminate All Sessions (for logout/password change) ─

    async terminateAllUserSessions(userId: string) {
        await this.sessionModel.updateMany(
            { user_id: new Types.ObjectId(userId), is_active: true },
            { $set: { is_active: false } },
        );
    }

    // ── Update Last Activity ────────────────────────────────

    async updateLastActivity(sessionId: string) {
        await this.sessionModel.findByIdAndUpdate(sessionId, {
            $set: { last_activity: new Date() },
        });
    }

    // ── Login Attempt Tracking ──────────────────────────────

    async recordLoginAttempt(data: {
        user_id?: string;
        email: string;
        ip_address: string;
        user_agent: string;
        success: boolean;
        failure_reason?: string;
    }) {
        const parsed = this.uaHelper.getSimplifiedDeviceInfo(data.user_agent);
        const location = this.getLocationFromIp(data.ip_address);

        return this.loginAttemptModel.create({
            user_id: data.user_id ? new Types.ObjectId(data.user_id) : undefined,
            email: data.email,
            ip_address: data.ip_address,
            user_agent: data.user_agent,
            device: parsed.device || `${parsed.os} ${parsed.deviceType}`,
            browser: `${parsed.browser} ${parsed.browserVersion}`.trim(),
            os: `${parsed.os} ${parsed.osVersion}`.trim(),
            location,
            success: data.success,
            failure_reason: data.failure_reason,
        });
    }

    // ── Get Login History ───────────────────────────────────

    async getLoginHistory(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [attempts, total] = await Promise.all([
            this.loginAttemptModel
                .find({ user_id: new Types.ObjectId(userId) })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit),
            this.loginAttemptModel.countDocuments({ user_id: new Types.ObjectId(userId) }),
        ]);

        return {
            attempts,
            meta_data: { page, limit, total, total_pages: Math.ceil(total / limit) },
        };
    }

    // ── Security Events ─────────────────────────────────────

    async recordSecurityEvent(data: {
        user_id: string;
        event_type: string;
        description: string;
        ip_address?: string;
        user_agent?: string;
        metadata?: Record<string, any>;
    }) {
        return this.securityEventModel.create({
            user_id: new Types.ObjectId(data.user_id),
            event_type: data.event_type,
            description: data.description,
            ip_address: data.ip_address,
            user_agent: data.user_agent,
            metadata: data.metadata,
        });
    }

    async getSecurityEvents(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [events, total] = await Promise.all([
            this.securityEventModel
                .find({ user_id: new Types.ObjectId(userId) })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit),
            this.securityEventModel.countDocuments({ user_id: new Types.ObjectId(userId) }),
        ]);

        return {
            events,
            meta_data: { page, limit, total, total_pages: Math.ceil(total / limit) },
        };
    }

    // ── Helper: IP to Location ──────────────────────────────

    private getLocationFromIp(ip: string): string {
        try {
            // Try to use IPToLocationUtils if available
            const { IPToLocationUtils } = require('../../utils/ip-to-location-util/IPToLocationUtils.js');
            const address = IPToLocationUtils.Instance.findAddressByIp(ip);
            if (address && address.city) {
                return `${address.city}, ${address.region}, ${address.country}`;
            }
            return '';
        } catch {
            // IP-to-location DB not configured — return empty
            return '';
        }
    }
}
