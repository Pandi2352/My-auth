import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service.js';
import { IS_PUBLIC_KEY } from '../../common/constants/index.js';

// Route patterns to skip auditing (health checks, reads that shouldn't be logged)
const SKIP_PATTERNS = [
    /^GET \/$/,             // Health check
    /^GET \/api-docs/,      // Swagger
];

// Map endpoint patterns to action and target_type
const AUDIT_MAP: Array<{
    pattern: RegExp;
    action: string;
    target_type: string;
    description: (params: Record<string, string>, body: any) => string;
}> = [
    // ── Auth ──
    {
        pattern: /^POST \/api\/v1\/auth\/register$/,
        action: 'auth.register',
        target_type: 'auth',
        description: (_p, b) => `User registered with email ${b?.email || 'unknown'}`,
    },
    {
        pattern: /^POST \/api\/v1\/auth\/login$/,
        action: 'auth.login',
        target_type: 'auth',
        description: (_p, b) => `User logged in with email ${b?.email || 'unknown'}`,
    },
    {
        pattern: /^POST \/api\/v1\/auth\/logout$/,
        action: 'auth.logout',
        target_type: 'auth',
        description: () => 'User logged out',
    },
    {
        pattern: /^POST \/api\/v1\/auth\/forgot-password$/,
        action: 'auth.forgot_password',
        target_type: 'auth',
        description: (_p, b) => `Password reset requested for ${b?.email || 'unknown'}`,
    },
    {
        pattern: /^POST \/api\/v1\/auth\/reset-password$/,
        action: 'auth.reset_password',
        target_type: 'auth',
        description: () => 'Password was reset via token',
    },
    {
        pattern: /^POST \/api\/v1\/auth\/2fa\/enable$/,
        action: 'auth.2fa_enable',
        target_type: 'auth',
        description: () => '2FA setup initiated',
    },
    {
        pattern: /^POST \/api\/v1\/auth\/2fa\/verify$/,
        action: 'auth.2fa_verify',
        target_type: 'auth',
        description: () => '2FA enabled successfully',
    },
    {
        pattern: /^POST \/api\/v1\/auth\/2fa\/disable$/,
        action: 'auth.2fa_disable',
        target_type: 'auth',
        description: () => '2FA disabled',
    },

    // ── User Profile ──
    {
        pattern: /^PATCH \/api\/v1\/user\/profile$/,
        action: 'user.update_profile',
        target_type: 'user',
        description: () => 'User updated their profile',
    },
    {
        pattern: /^PATCH \/api\/v1\/user\/email$/,
        action: 'user.update_email',
        target_type: 'user',
        description: (_p, b) => `User changed email to ${b?.new_email || 'unknown'}`,
    },
    {
        pattern: /^PATCH \/api\/v1\/user\/phone$/,
        action: 'user.update_phone',
        target_type: 'user',
        description: () => 'User updated phone number',
    },
    {
        pattern: /^PATCH \/api\/v1\/user\/password$/,
        action: 'user.change_password',
        target_type: 'user',
        description: () => 'User changed their password',
    },
    {
        pattern: /^POST \/api\/v1\/user\/profile\/avatar$/,
        action: 'user.upload_avatar',
        target_type: 'user',
        description: () => 'User uploaded avatar',
    },
    {
        pattern: /^DELETE \/api\/v1\/user\/profile\/avatar$/,
        action: 'user.remove_avatar',
        target_type: 'user',
        description: () => 'User removed avatar',
    },
    {
        pattern: /^PATCH \/api\/v1\/user\/notifications$/,
        action: 'user.update_notifications',
        target_type: 'user',
        description: () => 'User updated notification preferences',
    },

    // ── Admin Users ──
    {
        pattern: /^POST \/api\/v1\/admin\/users$/,
        action: 'admin.user.create',
        target_type: 'user',
        description: (_p, b) => `Admin created user ${b?.email || 'unknown'}`,
    },
    {
        pattern: /^PATCH \/api\/v1\/admin\/users\/([^/]+)$/,
        action: 'admin.user.update',
        target_type: 'user',
        description: (p) => `Admin updated user ${p.id || 'unknown'}`,
    },
    {
        pattern: /^PATCH \/api\/v1\/admin\/users\/([^/]+)\/status$/,
        action: 'admin.user.update_status',
        target_type: 'user',
        description: (p, b) => `Admin changed user ${p.id} status to ${b?.status || 'unknown'}`,
    },
    {
        pattern: /^PATCH \/api\/v1\/admin\/users\/([^/]+)\/suspend$/,
        action: 'admin.user.suspend',
        target_type: 'user',
        description: (p) => `Admin suspended user ${p.id}`,
    },
    {
        pattern: /^PATCH \/api\/v1\/admin\/users\/([^/]+)\/restore$/,
        action: 'admin.user.restore',
        target_type: 'user',
        description: (p) => `Admin restored user ${p.id}`,
    },
    {
        pattern: /^POST \/api\/v1\/admin\/users\/([^/]+)\/reset-password$/,
        action: 'admin.user.reset_password',
        target_type: 'user',
        description: (p) => `Admin reset password for user ${p.id}`,
    },
    {
        pattern: /^POST \/api\/v1\/admin\/users\/([^/]+)\/roles$/,
        action: 'admin.user.assign_roles',
        target_type: 'user',
        description: (p) => `Admin assigned roles to user ${p.id}`,
    },
    {
        pattern: /^DELETE \/api\/v1\/admin\/users\/([^/]+)\/roles$/,
        action: 'admin.user.remove_roles',
        target_type: 'user',
        description: (p) => `Admin removed roles from user ${p.id}`,
    },
    {
        pattern: /^DELETE \/api\/v1\/admin\/users\/([^/]+)\/soft$/,
        action: 'admin.user.soft_delete',
        target_type: 'user',
        description: (p) => `Admin soft-deleted user ${p.id}`,
    },
    {
        pattern: /^DELETE \/api\/v1\/admin\/users\/([^/]+)$/,
        action: 'admin.user.hard_delete',
        target_type: 'user',
        description: (p) => `Admin permanently deleted user ${p.id}`,
    },

    // ── Roles ──
    {
        pattern: /^POST \/api\/v1\/roles$/,
        action: 'role.create',
        target_type: 'role',
        description: (_p, b) => `Created role "${b?.name || b?.slug || 'unknown'}"`,
    },
    {
        pattern: /^PATCH \/api\/v1\/roles\/([^/]+)$/,
        action: 'role.update',
        target_type: 'role',
        description: (p) => `Updated role ${p.id}`,
    },
    {
        pattern: /^DELETE \/api\/v1\/roles\/([^/]+)$/,
        action: 'role.delete',
        target_type: 'role',
        description: (p) => `Deleted role ${p.id}`,
    },
    {
        pattern: /^POST \/api\/v1\/roles\/([^/]+)\/permissions$/,
        action: 'role.assign_permissions',
        target_type: 'role',
        description: (p) => `Assigned permissions to role ${p.id}`,
    },
    {
        pattern: /^DELETE \/api\/v1\/roles\/([^/]+)\/permissions$/,
        action: 'role.remove_permissions',
        target_type: 'role',
        description: (p) => `Removed permissions from role ${p.id}`,
    },
    {
        pattern: /^POST \/api\/v1\/roles\/assign-to-user$/,
        action: 'role.assign_to_user',
        target_type: 'role',
        description: (_p, b) => `Assigned roles to user ${b?.user_id || 'unknown'}`,
    },
    {
        pattern: /^POST \/api\/v1\/roles\/remove-from-user$/,
        action: 'role.remove_from_user',
        target_type: 'role',
        description: (_p, b) => `Removed roles from user ${b?.user_id || 'unknown'}`,
    },

    // ── Permissions ──
    {
        pattern: /^POST \/api\/v1\/permissions$/,
        action: 'permission.create',
        target_type: 'permission',
        description: (_p, b) => `Created permission "${b?.slug || 'unknown'}"`,
    },
    {
        pattern: /^PATCH \/api\/v1\/permissions\/([^/]+)$/,
        action: 'permission.update',
        target_type: 'permission',
        description: (p) => `Updated permission ${p.id}`,
    },
    {
        pattern: /^DELETE \/api\/v1\/permissions\/([^/]+)$/,
        action: 'permission.delete',
        target_type: 'permission',
        description: (p) => `Deleted permission ${p.id}`,
    },

    // ── Groups ──
    {
        pattern: /^POST \/api\/v1\/admin\/groups$/,
        action: 'group.create',
        target_type: 'group',
        description: (_p, b) => `Created group "${b?.name || b?.slug || 'unknown'}"`,
    },
    {
        pattern: /^PATCH \/api\/v1\/admin\/groups\/([^/]+)$/,
        action: 'group.update',
        target_type: 'group',
        description: (p) => `Updated group ${p.id}`,
    },
    {
        pattern: /^DELETE \/api\/v1\/admin\/groups\/([^/]+)$/,
        action: 'group.delete',
        target_type: 'group',
        description: (p) => `Deleted group ${p.id}`,
    },
    {
        pattern: /^POST \/api\/v1\/admin\/groups\/([^/]+)\/users$/,
        action: 'group.add_users',
        target_type: 'group',
        description: (p) => `Added users to group ${p.id}`,
    },
    {
        pattern: /^DELETE \/api\/v1\/admin\/groups\/([^/]+)\/users$/,
        action: 'group.remove_users',
        target_type: 'group',
        description: (p) => `Removed users from group ${p.id}`,
    },
    {
        pattern: /^POST \/api\/v1\/admin\/groups\/([^/]+)\/roles$/,
        action: 'group.assign_roles',
        target_type: 'group',
        description: (p) => `Assigned roles to group ${p.id}`,
    },
    {
        pattern: /^DELETE \/api\/v1\/admin\/groups\/([^/]+)\/roles$/,
        action: 'group.remove_roles',
        target_type: 'group',
        description: (p) => `Removed roles from group ${p.id}`,
    },

    // ── Settings ──
    {
        pattern: /^POST \/api\/v1\/admin\/settings$/,
        action: 'settings.create',
        target_type: 'settings',
        description: (_p, b) => `Created config key "${b?.key || 'unknown'}"`,
    },
    {
        pattern: /^PATCH \/api\/v1\/admin\/settings\/key\/([^/]+)$/,
        action: 'settings.update',
        target_type: 'settings',
        description: (p) => `Updated config key ${p.key || 'unknown'}`,
    },
    {
        pattern: /^PATCH \/api\/v1\/admin\/settings\/category\/([^/]+)$/,
        action: 'settings.bulk_update',
        target_type: 'settings',
        description: (p) => `Bulk updated config category ${p.category || 'unknown'}`,
    },
    {
        pattern: /^DELETE \/api\/v1\/admin\/settings\/key\/([^/]+)$/,
        action: 'settings.delete',
        target_type: 'settings',
        description: (p) => `Deleted config key ${p.key || 'unknown'}`,
    },

    // ── Invitations ──
    {
        pattern: /^POST \/api\/v1\/admin\/invitations$/,
        action: 'invitation.create',
        target_type: 'invitation',
        description: (_p, b) => `Sent invitation to ${b?.email || 'unknown'}`,
    },
    {
        pattern: /^POST \/api\/v1\/admin\/invitations\/([^/]+)\/resend$/,
        action: 'invitation.resend',
        target_type: 'invitation',
        description: (p) => `Resent invitation ${p.id}`,
    },
    {
        pattern: /^DELETE \/api\/v1\/admin\/invitations\/([^/]+)$/,
        action: 'invitation.revoke',
        target_type: 'invitation',
        description: (p) => `Revoked invitation ${p.id}`,
    },

    // ── API Keys ──
    {
        pattern: /^POST \/api\/v1\/user\/api-keys$/,
        action: 'api_key.create',
        target_type: 'api_key',
        description: (_p, b) => `Created API key "${b?.name || 'unknown'}"`,
    },
    {
        pattern: /^POST \/api\/v1\/user\/api-keys\/([^/]+)\/revoke$/,
        action: 'api_key.revoke',
        target_type: 'api_key',
        description: (p) => `Revoked API key ${p.id}`,
    },
    {
        pattern: /^DELETE \/api\/v1\/user\/api-keys\/([^/]+)$/,
        action: 'api_key.delete',
        target_type: 'api_key',
        description: (p) => `Deleted API key ${p.id}`,
    },

    // ── GDPR ──
    {
        pattern: /^DELETE \/api\/v1\/user\/account$/,
        action: 'user.delete_account',
        target_type: 'user',
        description: () => 'User requested account deletion (GDPR)',
    },

    // ── Impersonation ──
    {
        pattern: /^POST \/api\/v1\/auth\/impersonate\/([^/]+)$/,
        action: 'admin.impersonate',
        target_type: 'user',
        description: (p) => `Admin impersonated user ${p.id}`,
    },

    // ── Account Recovery ──
    {
        pattern: /^POST \/api\/v1\/auth\/recover-account$/,
        action: 'auth.recover_account_request',
        target_type: 'auth',
        description: (_p, b) => `Account recovery requested for ${b?.email || 'unknown'}`,
    },
    {
        pattern: /^POST \/api\/v1\/auth\/recover-account\/confirm$/,
        action: 'auth.recover_account_confirm',
        target_type: 'auth',
        description: () => 'Account recovery confirmed',
    },

    // ── Social Connectors ──
    {
        pattern: /^POST \/api\/v1\/admin\/social-connectors$/,
        action: 'social_connector.create',
        target_type: 'social_connector',
        description: (_p, b) => `Created social connector "${b?.provider || 'unknown'}"`,
    },
    {
        pattern: /^PATCH \/api\/v1\/admin\/social-connectors\/([^/]+)$/,
        action: 'social_connector.update',
        target_type: 'social_connector',
        description: (p) => `Updated social connector ${p.id}`,
    },
    {
        pattern: /^PATCH \/api\/v1\/admin\/social-connectors\/([^/]+)\/toggle$/,
        action: 'social_connector.toggle',
        target_type: 'social_connector',
        description: (p) => `Toggled social connector ${p.id}`,
    },
    {
        pattern: /^DELETE \/api\/v1\/admin\/social-connectors\/([^/]+)$/,
        action: 'social_connector.delete',
        target_type: 'social_connector',
        description: (p) => `Deleted social connector ${p.id}`,
    },
    {
        pattern: /^DELETE \/api\/v1\/auth\/social\/([^/]+)\/unlink$/,
        action: 'social_account.unlink',
        target_type: 'social_account',
        description: (p) => `Unlinked social account ${p.provider || 'unknown'}`,
    },

    // ── Sessions ──
    {
        pattern: /^DELETE \/api\/v1\/sessions\/([^/]+)$/,
        action: 'session.terminate',
        target_type: 'session',
        description: (p) => `Terminated session ${p.id}`,
    },
    {
        pattern: /^DELETE \/api\/v1\/sessions$/,
        action: 'session.terminate_all',
        target_type: 'session',
        description: () => 'Terminated all sessions',
    },
];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(
        private readonly auditService: AuditService,
        private readonly reflector: Reflector,
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const method = req.method;
        const url = req.originalUrl || req.url;
        const routeKey = `${method} ${url.split('?')[0]}`; // Strip query params

        // Skip non-mutation GET requests (except login/register POSTs which we map explicitly)
        if (method === 'GET') {
            return next.handle();
        }

        // Skip patterns
        for (const pattern of SKIP_PATTERNS) {
            if (pattern.test(routeKey)) {
                return next.handle();
            }
        }

        // Find matching audit map entry
        const match = this.findMatch(routeKey);
        if (!match) {
            return next.handle();
        }

        const user = req.user;
        const ip = req.ip || req.connection?.remoteAddress || '';
        const userAgent = req.headers?.['user-agent'] || '';
        const body = req.body;
        const params = req.params || {};

        return next.handle().pipe(
            tap({
                next: (responseData) => {
                    const res = context.switchToHttp().getResponse();
                    const statusCode = res.statusCode;

                    // Extract target_id from params or response
                    const targetId = params.id || responseData?._id?.toString() || responseData?.user_id?.toString() || '';

                    // Don't await — audit logging should not block the response
                    this.auditService.log({
                        user_id: user?._id?.toString(),
                        user_email: user?.email,
                        action: match.action,
                        target_type: match.target_type,
                        target_id: targetId,
                        description: match.description(params, body),
                        method,
                        endpoint: url.split('?')[0],
                        status_code: statusCode,
                        changes: body && Object.keys(body).length > 0
                            ? { after: body }
                            : undefined,
                        ip_address: ip,
                        user_agent: userAgent,
                    });
                },
                error: (error) => {
                    // Log failed attempts too (for security auditing)
                    const statusCode = error?.status || error?.http_code || 500;

                    this.auditService.log({
                        user_id: user?._id?.toString(),
                        user_email: user?.email || body?.email,
                        action: match.action,
                        target_type: match.target_type,
                        target_id: params.id || '',
                        description: `[FAILED] ${match.description(params, body)}`,
                        method,
                        endpoint: url.split('?')[0],
                        status_code: statusCode,
                        metadata: { error: error?.message || error?.error_description },
                        ip_address: ip,
                        user_agent: userAgent,
                    });
                },
            }),
        );
    }

    private findMatch(routeKey: string) {
        for (const entry of AUDIT_MAP) {
            if (entry.pattern.test(routeKey)) {
                return entry;
            }
        }
        return null;
    }
}
