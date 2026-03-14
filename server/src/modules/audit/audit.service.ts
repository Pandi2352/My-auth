import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema.js';
import { AuditLogQueryDto } from './dto/audit-log-query.dto.js';

export interface CreateAuditLogDto {
    user_id?: string;
    user_email?: string;
    action: string;
    target_type: string;
    target_id?: string;
    description?: string;
    method?: string;
    endpoint?: string;
    status_code?: number;
    changes?: { before?: Record<string, any>; after?: Record<string, any> };
    metadata?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
}

const SENSITIVE_FIELDS = [
    'password_hash', 'password', 'new_password', 'current_password',
    'two_fa_secret', 'email_verification_token', 'password_reset_token',
    'token_hash', 'refresh_token', 'access_token', 'token',
    'client_secret', 'client_id',
];

@Injectable()
export class AuditService {
    constructor(
        @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    ) {}

    // ── Create Log Entry ─────────────────────────────────────

    async log(data: CreateAuditLogDto): Promise<void> {
        try {
            await this.auditLogModel.create({
                user_id: data.user_id ? new Types.ObjectId(data.user_id) : undefined,
                user_email: data.user_email,
                action: data.action,
                target_type: data.target_type,
                target_id: data.target_id,
                description: data.description,
                method: data.method,
                endpoint: data.endpoint,
                status_code: data.status_code,
                changes: data.changes ? this.sanitizeChanges(data.changes) : undefined,
                metadata: data.metadata,
                ip_address: data.ip_address,
                user_agent: data.user_agent,
            });
        } catch (error) {
            // Audit logging should never break the request
            console.error('Failed to write audit log:', error);
        }
    }

    // ── Query Logs (Paginated + Filtered) ────────────────────

    async findAll(query: AuditLogQueryDto) {
        const page = parseInt(query.page || '1');
        const limit = Math.min(parseInt(query.limit || '20'), 100);
        const skip = (page - 1) * limit;

        const filter = this.buildFilter(query);

        const [logs, total] = await Promise.all([
            this.auditLogModel
                .find(filter)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.auditLogModel.countDocuments(filter),
        ]);

        return {
            items: logs,
            meta_data: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        };
    }

    // ── Get Single Log ───────────────────────────────────────

    async findById(id: string) {
        return this.auditLogModel.findById(id).lean();
    }

    // ── Export Logs ──────────────────────────────────────────

    async exportLogs(query: AuditLogQueryDto, format: string = 'json') {
        const filter = this.buildFilter(query);

        const logs = await this.auditLogModel
            .find(filter)
            .sort({ created_at: -1 })
            .limit(10000) // Cap export at 10k records
            .lean();

        if (format === 'csv') {
            return this.toCsv(logs);
        }

        return {
            total: logs.length,
            exported_at: new Date().toISOString(),
            logs,
        };
    }

    // ── Get Action Summary (aggregation) ─────────────────────

    async getActionSummary(query: AuditLogQueryDto) {
        const filter = this.buildFilter(query);

        return this.auditLogModel.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 },
                    last_at: { $max: '$created_at' },
                },
            },
            { $sort: { count: -1 } },
        ]);
    }

    // ── Private Helpers ──────────────────────────────────────

    private buildFilter(query: AuditLogQueryDto): Record<string, any> {
        const filter: Record<string, any> = {};

        if (query.user_id) {
            filter.user_id = new Types.ObjectId(query.user_id);
        }
        if (query.user_email) {
            filter.user_email = { $regex: query.user_email, $options: 'i' };
        }
        if (query.action) {
            filter.action = { $regex: query.action, $options: 'i' };
        }
        if (query.target_type) {
            filter.target_type = query.target_type;
        }
        if (query.target_id) {
            filter.target_id = query.target_id;
        }
        if (query.method) {
            filter.method = query.method.toUpperCase();
        }
        if (query.date_from || query.date_to) {
            filter.created_at = {};
            if (query.date_from) {
                filter.created_at.$gte = new Date(query.date_from);
            }
            if (query.date_to) {
                const dateTo = new Date(query.date_to);
                dateTo.setHours(23, 59, 59, 999);
                filter.created_at.$lte = dateTo;
            }
        }

        return filter;
    }

    private sanitizeChanges(changes: { before?: Record<string, any>; after?: Record<string, any> }) {
        return {
            before: changes.before ? this.redactSensitive(changes.before) : undefined,
            after: changes.after ? this.redactSensitive(changes.after) : undefined,
        };
    }

    private redactSensitive(obj: Record<string, any>): Record<string, any> {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
            if (SENSITIVE_FIELDS.includes(key)) {
                result[key] = '[REDACTED]';
            } else {
                result[key] = value;
            }
        }
        return result;
    }

    private toCsv(logs: any[]): string {
        if (logs.length === 0) return '';

        const headers = [
            'id', 'user_id', 'user_email', 'action', 'target_type',
            'target_id', 'description', 'method', 'endpoint',
            'status_code', 'ip_address', 'created_at',
        ];

        const rows = logs.map((log) =>
            headers.map((h) => {
                const val = h === 'id' ? log._id?.toString() : log[h];
                if (val === null || val === undefined) return '';
                const str = String(val);
                return str.includes(',') || str.includes('"') || str.includes('\n')
                    ? `"${str.replace(/"/g, '""')}"`
                    : str;
            }).join(','),
        );

        return [headers.join(','), ...rows].join('\n');
    }
}
