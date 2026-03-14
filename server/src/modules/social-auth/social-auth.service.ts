import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { SocialAccount, SocialAccountDocument } from './schemas/social-account.schema.js';
import { SocialConnectorService } from './social-connector.service.js';
import { PROVIDER_DEFAULTS, getNestedValue } from './provider-defaults.js';
import { UserService } from '../user/user.service.js';
import { RoleService } from '../role/role.service.js';
import { SessionService } from '../session/session.service.js';
import { BcryptPasswordHelper } from '../../utils/BcryptPasswordHelper.js';
import { jwtConfig } from '../../config/jwt.config.js';
import { ErrorEntity } from '../../utils/reponseUtils/ErrorEntity.js';
import { HttpStatus } from '../../utils/reponseUtils/httpStatus.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import { RefreshToken, RefreshTokenDocument } from '../auth/schemas/refresh-token.schema.js';
import { DateHelper } from '../../utils/DateHelper.js';

@Injectable()
export class SocialAuthService {
    private readonly logger = new Logger(SocialAuthService.name);
    private bcrypt = BcryptPasswordHelper.Instance;
    private dateHelper = DateHelper.Instance;

    constructor(
        @InjectModel(SocialAccount.name) private socialAccountModel: Model<SocialAccountDocument>,
        @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshTokenDocument>,
        private readonly connectorService: SocialConnectorService,
        private readonly userService: UserService,
        private readonly roleService: RoleService,
        private readonly sessionService: SessionService,
        private readonly jwtService: JwtService,
    ) {}

    // ── Build Authorization URL ───────────────────────────────

    async getAuthorizationUrl(provider: string, state?: string) {
        const connector = await this.connectorService.findByProvider(provider);
        if (!connector) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'connector_not_enabled',
                error_description: `Social login with '${provider}' is not enabled`,
            });
        }

        const defaults = PROVIDER_DEFAULTS[provider];
        const authorizeUrl = connector.authorize_url || defaults?.authorize_url;
        if (!authorizeUrl) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'missing_authorize_url',
                error_description: 'Authorization URL not configured for this provider',
            });
        }

        const baseUrl = process.env.APP_URL || 'http://localhost:3000';
        const callbackUrl = connector.callback_url || `${baseUrl}/api/v1/auth/social/${provider}/callback`;
        const scopeSeparator = defaults?.scope_separator || ' ';
        const scopes = connector.scopes.length > 0
            ? connector.scopes
            : defaults?.default_scopes || ['email', 'profile'];

        const csrfState = state || crypto.randomBytes(16).toString('hex');

        const params = new URLSearchParams({
            client_id: connector.client_id,
            redirect_uri: callbackUrl,
            response_type: 'code',
            scope: scopes.join(scopeSeparator),
            state: csrfState,
        });

        // Some providers need extra params
        if (provider === 'google') {
            params.set('access_type', 'offline');
            params.set('prompt', 'consent');
        }
        if (provider === 'twitter') {
            params.set('code_challenge', 'challenge');
            params.set('code_challenge_method', 'plain');
        }

        return {
            url: `${authorizeUrl}?${params.toString()}`,
            state: csrfState,
            provider,
        };
    }

    // ── Handle OAuth Callback ─────────────────────────────────

    async handleCallback(provider: string, code: string, ip: string, userAgent: string) {
        const connector = await this.connectorService.findByProvider(provider);
        if (!connector) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'connector_not_enabled',
                error_description: `Social login with '${provider}' is not enabled`,
            });
        }

        const defaults = PROVIDER_DEFAULTS[provider];
        const baseUrl = process.env.APP_URL || 'http://localhost:3000';
        const callbackUrl = connector.callback_url || `${baseUrl}/api/v1/auth/social/${provider}/callback`;

        // Step 1: Exchange code for access token
        const tokenData = await this.exchangeCodeForToken(connector, defaults, code, callbackUrl);
        const accessToken = tokenData.access_token;
        if (!accessToken) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'token_exchange_failed',
                error_description: 'Failed to obtain access token from provider',
            });
        }

        // Step 2: Fetch user profile from provider
        const profile = await this.fetchUserProfile(connector, defaults, accessToken);
        const profileMap = defaults?.profile_map || { id: 'id', email: 'email', name: 'name', avatar: 'avatar' };

        const providerUserId = String(getNestedValue(profile, profileMap.id) || '');
        const email = (getNestedValue(profile, profileMap.email) || '').toLowerCase();
        const displayName = getNestedValue(profile, profileMap.name) || '';
        const avatarUrl = getNestedValue(profile, profileMap.avatar) || '';

        if (!providerUserId) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'profile_fetch_failed',
                error_description: 'Could not retrieve user ID from provider',
            });
        }

        // GitHub special case: email may require separate API call
        let resolvedEmail = email;
        if (provider === 'github' && !resolvedEmail) {
            resolvedEmail = await this.fetchGitHubEmail(accessToken);
        }

        // Step 3: Find or create user
        const result = await this.findOrCreateUser(
            provider,
            providerUserId,
            resolvedEmail,
            displayName,
            avatarUrl,
            accessToken,
            tokenData.refresh_token,
        );

        // Step 4: Issue JWT tokens
        return this.issueTokens(result.user, ip, userAgent, result.is_new);
    }

    // ── Link Social Account (for existing authenticated user) ─

    async linkAccount(userId: string, provider: string, code: string) {
        const connector = await this.connectorService.findByProvider(provider);
        if (!connector) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'connector_not_enabled',
                error_description: `Social login with '${provider}' is not enabled`,
            });
        }

        const defaults = PROVIDER_DEFAULTS[provider];
        const baseUrl = process.env.APP_URL || 'http://localhost:3000';
        const callbackUrl = connector.callback_url || `${baseUrl}/api/v1/auth/social/${provider}/callback`;

        const tokenData = await this.exchangeCodeForToken(connector, defaults, code, callbackUrl);
        const profile = await this.fetchUserProfile(connector, defaults, tokenData.access_token);
        const profileMap = defaults?.profile_map || { id: 'id', email: 'email', name: 'name', avatar: 'avatar' };

        const providerUserId = String(getNestedValue(profile, profileMap.id) || '');
        const email = (getNestedValue(profile, profileMap.email) || '').toLowerCase();
        const displayName = getNestedValue(profile, profileMap.name) || '';
        const avatarUrl = getNestedValue(profile, profileMap.avatar) || '';

        // Check if already linked to another user
        const existing = await this.socialAccountModel.findOne({
            provider,
            provider_user_id: providerUserId,
        });
        if (existing && existing.user_id.toString() !== userId) {
            throw new ErrorEntity({
                http_code: HttpStatus.CONFLICT,
                error: 'account_linked_to_other',
                error_description: 'This social account is already linked to another user',
            });
        }

        // Upsert social account link
        await this.socialAccountModel.findOneAndUpdate(
            { provider, provider_user_id: providerUserId },
            {
                $set: {
                    user_id: new Types.ObjectId(userId),
                    email,
                    display_name: displayName,
                    avatar_url: avatarUrl,
                    access_token: tokenData.access_token,
                    refresh_token: tokenData.refresh_token,
                    linked_at: new Date(),
                },
            },
            { upsert: true, returnDocument: 'after' },
        );

        return {
            message: `${provider} account linked successfully`,
            provider,
            provider_user_id: providerUserId,
            display_name: displayName,
        };
    }

    // ── Unlink Social Account ─────────────────────────────────

    async unlinkAccount(userId: string, provider: string) {
        const account = await this.socialAccountModel.findOneAndDelete({
            user_id: new Types.ObjectId(userId),
            provider,
        });

        if (!account) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'social_account_not_found',
                error_description: `No ${provider} account linked`,
            });
        }

        return { message: `${provider} account unlinked` };
    }

    // ── Get Linked Accounts ───────────────────────────────────

    async getLinkedAccounts(userId: string) {
        return this.socialAccountModel
            .find({ user_id: new Types.ObjectId(userId) })
            .select('provider provider_user_id display_name email avatar_url linked_at')
            .lean();
    }

    // ── Private: Exchange Code for Token ──────────────────────

    private async exchangeCodeForToken(connector: any, defaults: any, code: string, callbackUrl: string) {
        const tokenUrl = connector.token_url || defaults?.token_url;
        if (!tokenUrl) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'missing_token_url',
                error_description: 'Token URL not configured',
            });
        }

        const body = new URLSearchParams({
            client_id: connector.client_id,
            client_secret: connector.client_secret,
            code,
            redirect_uri: callbackUrl,
            grant_type: 'authorization_code',
        });

        const headers: Record<string, string> = {
            'Content-Type': 'application/x-www-form-urlencoded',
        };

        // GitHub requires Accept header for JSON response
        if (connector.provider === 'github') {
            headers['Accept'] = 'application/json';
        }

        try {
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers,
                body: body.toString(),
            });
            const data = await response.json() as any;
            return data;
        } catch (error) {
            this.logger.error(`Token exchange failed for ${connector.provider}:`, error);
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_GATEWAY,
                error: 'token_exchange_failed',
                error_description: 'Failed to exchange authorization code for token',
            });
        }
    }

    // ── Private: Fetch User Profile ───────────────────────────

    private async fetchUserProfile(connector: any, defaults: any, accessToken: string) {
        const profileUrl = connector.profile_url || defaults?.profile_url;
        if (!profileUrl) {
            return {}; // Some providers (Apple) don't have profile URL
        }

        try {
            const response = await fetch(profileUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                },
            });
            return await response.json() as any;
        } catch (error) {
            this.logger.error(`Profile fetch failed for ${connector.provider}:`, error);
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_GATEWAY,
                error: 'profile_fetch_failed',
                error_description: 'Failed to fetch user profile from provider',
            });
        }
    }

    // ── Private: GitHub Email (requires separate call) ────────

    private async fetchGitHubEmail(accessToken: string): Promise<string> {
        try {
            const response = await fetch('https://api.github.com/user/emails', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                },
            });
            const emails = await response.json() as any[];
            const primary = emails.find((e: any) => e.primary && e.verified);
            return primary?.email || emails[0]?.email || '';
        } catch {
            return '';
        }
    }

    // ── Private: Find or Create User ──────────────────────────

    private async findOrCreateUser(
        provider: string,
        providerUserId: string,
        email: string,
        displayName: string,
        avatarUrl: string,
        accessToken: string,
        refreshToken?: string,
    ) {
        // Check if social account already linked
        const existingLink = await this.socialAccountModel.findOne({
            provider,
            provider_user_id: providerUserId,
        });

        if (existingLink) {
            // Update tokens
            existingLink.access_token = accessToken;
            if (refreshToken) existingLink.refresh_token = refreshToken;
            await existingLink.save();

            const user = await this.userService.findById(existingLink.user_id.toString());
            if (!user || user.is_deleted) {
                throw new ErrorEntity({
                    http_code: HttpStatus.FORBIDDEN,
                    error: 'account_deleted',
                    error_description: 'Your account has been deleted',
                });
            }
            return { user, is_new: false };
        }

        // Check if a user with this email already exists
        let user = email ? await this.userService.findByEmail(email) : null;
        let is_new = false;

        if (!user) {
            // Create new user from social profile
            const nameParts = displayName.split(' ');
            const firstName = nameParts[0] || provider;
            const lastName = nameParts.slice(1).join(' ') || '';

            // Generate a random password (user logged in via social, won't use it)
            const randomPass = crypto.randomBytes(32).toString('hex');
            const password_hash = await this.bcrypt.generateBcryptPassword(randomPass);

            user = await this.userService.create({
                first_name: firstName,
                last_name: lastName,
                email: email || `${provider}_${providerUserId}@social.local`,
                password_hash,
                is_verified: true, // Social login verifies email
                status: UserStatus.ACTIVE,
                avatar_url: avatarUrl || undefined,
            });

            // Assign default role
            const defaultRole = await this.roleService.findDefaultRole();
            if (defaultRole) {
                await this.userService.assignRoles(user._id.toString(), [(defaultRole as any)._id.toString()]);
            }

            is_new = true;
        }

        // Link social account
        await this.socialAccountModel.create({
            user_id: user._id,
            provider,
            provider_user_id: providerUserId,
            email,
            display_name: displayName,
            avatar_url: avatarUrl,
            access_token: accessToken,
            refresh_token: refreshToken,
            linked_at: new Date(),
        });

        return { user, is_new };
    }

    // ── Private: Issue JWT Tokens ─────────────────────────────

    private async issueTokens(user: any, ip: string, userAgent: string, isNewUser: boolean) {
        if (user.status === UserStatus.SUSPENDED) {
            throw new ErrorEntity({
                http_code: HttpStatus.FORBIDDEN,
                error: 'account_suspended',
                error_description: 'Your account has been suspended',
            });
        }

        const config = jwtConfig();
        const payload = { sub: user._id.toString(), email: user.email };

        const access_token = this.jwtService.sign(payload, {
            secret: config.access_secret,
            expiresIn: config.access_expires_in_sec,
        });

        const refresh_token = this.jwtService.sign(payload, {
            secret: config.refresh_secret,
            expiresIn: config.refresh_expires_in_sec,
        });

        const token_hash = await this.bcrypt.generateBcryptPassword(refresh_token);
        const expires_at = this.dateHelper.addDays(new Date(), 7);

        await this.refreshTokenModel.create({
            user_id: user._id,
            token_hash,
            device: userAgent,
            ip_address: ip,
            user_agent: userAgent,
            expires_at,
        });

        await this.sessionService.createSession({
            user_id: user._id.toString(),
            token_hash,
            ip_address: ip,
            user_agent: userAgent,
            expires_at,
        });

        await this.sessionService.recordLoginAttempt({
            user_id: user._id.toString(),
            email: user.email,
            ip_address: ip,
            user_agent: userAgent,
            success: true,
        });

        await this.userService.updateById(user._id.toString(), {
            last_login_at: new Date(),
            last_login_ip: ip,
        });

        return {
            access_token,
            refresh_token,
            token_type: 'Bearer',
            is_new_user: isNewUser,
            user: {
                _id: user._id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                is_2fa_enabled: user.is_2fa_enabled,
            },
        };
    }
}
