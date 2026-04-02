import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BcryptPasswordHelper } from '../../utils/BcryptPasswordHelper.js';
import { DateHelper } from '../../utils/DateHelper.js';
import { RandomNumberGenerator } from '../../utils/random-id-generator-util.js';
import { TOTPHelper } from '../../utils/TOTPHelper.js';
import { ErrorEntity } from '../../utils/reponseUtils/ErrorEntity.js';
import { HttpStatus } from '../../utils/reponseUtils/httpStatus.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import { MAX_LOGIN_ATTEMPTS, LOCK_DURATION_MINUTES } from '../../common/constants/index.js';
import { jwtConfig } from '../../config/jwt.config.js';
import { UserService } from '../user/user.service.js';
import { UserDocument } from '../user/schemas/user.schema.js';
import { RoleService } from '../role/role.service.js';
import { SessionService } from '../session/session.service.js';
import { NotificationService } from '../notification/notification.service.js';
import { SystemConfigService } from '../system-config/system-config.service.js';
import { RefreshToken, RefreshTokenDocument } from './schemas/refresh-token.schema.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { UserAgentHelper } from '../../utils/UserAgentHelper.js';

@Injectable()
export class AuthService {
    private bcrypt = BcryptPasswordHelper.Instance;
    private dateHelper = DateHelper.Instance;
    private totpHelper = TOTPHelper.Instance;

    constructor(
        private readonly userService: UserService,
        private readonly roleService: RoleService,
        private readonly sessionService: SessionService,
        private readonly notificationService: NotificationService,
        private readonly systemConfigService: SystemConfigService,
        private readonly jwtService: JwtService,
        @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshTokenDocument>,
    ) {}

    // ── Register ──────────────────────────────────────────────
    async register(dto: RegisterDto) {
        const registrationEnabled = await this.systemConfigService.getValue('auth.registration_enabled', true);
        if (!registrationEnabled) {
            throw new ErrorEntity({
                http_code: HttpStatus.FORBIDDEN,
                error: 'registration_disabled',
                error_description: 'Public registration is currently disabled by administrator.',
            });
        }

        const existing = await this.userService.findByEmail(dto.email);
        if (existing) {
            throw new ErrorEntity({
                http_code: HttpStatus.CONFLICT,
                error: 'conflict',
                error_description: 'Email already registered',
            });
        }

        const password_hash = await this.bcrypt.generateBcryptPassword(dto.password);
        const email_verification_token = RandomNumberGenerator.getUniqueId();
        const email_verification_expires = this.dateHelper.addHours(new Date(), 24);

        const user = await this.userService.create({
            first_name: dto.first_name,
            last_name: dto.last_name,
            email: dto.email.toLowerCase(),
            password_hash,
            status: UserStatus.PENDING,
            email_verification_token,
            email_verification_expires,
        });

        // Assign default role to new user
        const defaultRole = await this.roleService.findDefaultRole();
        if (defaultRole) {
            await this.userService.assignRoles(user._id.toString(), [(defaultRole as any)._id.toString()]);
        }

        await this.notificationService.sendVerificationEmail(
            user.email,
            user.first_name,
            email_verification_token,
        );

        return {
            message: 'Registration successful. Please check your email to verify your account.',
            user_id: user._id,
        };
    }

    // ── Verify Email ──────────────────────────────────────────
    async verifyEmail(token: string) {
        const user = await this.userService.findByVerificationToken(token);
        if (!user) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'invalid_token',
                error_description: 'Invalid or expired verification token',
            });
        }

        await this.userService.updateById(user._id.toString(), {
            is_verified: true,
            status: UserStatus.ACTIVE,
            email_verification_token: undefined,
            email_verification_expires: undefined,
        });

        // Send welcome email after first verification
        await this.notificationService.sendWelcomeEmail(user.email, user.first_name);

        return { message: 'Email verified successfully' };
    }

    // ── Resend Verification ───────────────────────────────────
    async resendVerification(email: string) {
        const user = await this.userService.findByEmail(email);
        if (!user) {
            return { message: 'If the email exists, a verification link has been sent.' };
        }
        if (user.is_verified) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'already_verified',
                error_description: 'Email is already verified',
            });
        }

        const email_verification_token = RandomNumberGenerator.getUniqueId();
        const email_verification_expires = this.dateHelper.addHours(new Date(), 24);

        await this.userService.updateById(user._id.toString(), {
            email_verification_token,
            email_verification_expires,
        });

        await this.notificationService.sendVerificationEmail(
            user.email,
            user.first_name,
            email_verification_token,
        );

        return { message: 'If the email exists, a verification link has been sent.' };
    }

    // ── Validate User (for LocalStrategy) ─────────────────────
    async validateUser(email: string, password: string): Promise<UserDocument | null> {
        const user = await this.userService.findByEmail(email);
        if (!user) return null;

        // Check if locked
        if (user.locked_until && user.locked_until > new Date()) {
            throw new ErrorEntity({
                http_code: HttpStatus.FORBIDDEN,
                error: 'account_locked',
                error_description: `Account is locked. Try again after ${user.locked_until.toISOString()}`,
            });
        }

        const isMatch = await this.bcrypt.compareBcryptPassword(password, user.password_hash);
        if (!isMatch) {
            await this.userService.incrementFailedAttempts(user._id.toString());

            if (user.failed_login_attempts + 1 >= MAX_LOGIN_ATTEMPTS) {
                const locked_until = this.dateHelper.addMinutes(new Date(), LOCK_DURATION_MINUTES);
                await this.userService.updateById(user._id.toString(), {
                    locked_until,
                    status: UserStatus.LOCKED,
                });

                // Send account locked notification
                await this.notificationService.sendAccountLockedEmail(
                    user.email,
                    user.first_name,
                    locked_until,
                    MAX_LOGIN_ATTEMPTS,
                );
            }
            return null;
        }

        // Reset failed attempts on successful validation
        if (user.failed_login_attempts > 0) {
            await this.userService.resetFailedAttempts(user._id.toString());
        }

        return user;
    }

    // ── Login ─────────────────────────────────────────────────
    async login(user: UserDocument, dto: LoginDto, ip: string, userAgent: string) {
        if (!user.is_verified) {
            throw new ErrorEntity({
                http_code: HttpStatus.FORBIDDEN,
                error: 'email_not_verified',
                error_description: 'Please verify your email before logging in',
            });
        }
        if (user.status === UserStatus.SUSPENDED) {
            throw new ErrorEntity({
                http_code: HttpStatus.FORBIDDEN,
                error: 'account_suspended',
                error_description: 'Your account has been suspended',
            });
        }

        if (user.requires_password_change) {
            throw new ErrorEntity({
                http_code: HttpStatus.FORBIDDEN,
                error: 'password_change_required',
                error_description: 'For security reasons, you must change your password before accessing the dashboard.',
                meta_data: { 
                    user_id: user._id,
                    email: user.email 
                }
            });
        }

        const payload = { sub: user._id.toString(), email: user.email };
        const config = jwtConfig();

        const access_token = this.jwtService.sign(payload, {
            secret: config.access_secret,
            expiresIn: config.access_expires_in_sec,
        });

        const refresh_expires_in = dto.remember_me
            ? config.refresh_expires_in_remember
            : config.refresh_expires_in;

        const refresh_expires_in_sec = dto.remember_me
            ? config.refresh_expires_in_remember_sec
            : config.refresh_expires_in_sec;

        const refresh_token = this.jwtService.sign(payload, {
            secret: config.refresh_secret,
            expiresIn: refresh_expires_in_sec,
        });

        // Store hashed refresh token
        const token_hash = await this.bcrypt.generateBcryptPassword(refresh_token);
        const expires_at = this.parseExpiresIn(refresh_expires_in);

        const { browser, os } = UserAgentHelper.parse(userAgent);

        await this.refreshTokenModel.create({
            user_id: user._id,
            token_hash,
            device: os, // Use OS as device name for now
            browser,
            os,
            ip_address: ip,
            user_agent: userAgent,
            expires_at,
            last_activity: new Date(),
        });

        // Create session
        await this.sessionService.createSession({
            user_id: user._id.toString(),
            token_hash,
            ip_address: ip,
            user_agent: userAgent,
            expires_at,
        });

        // Record successful login attempt
        await this.sessionService.recordLoginAttempt({
            user_id: user._id.toString(),
            email: user.email,
            ip_address: ip,
            user_agent: userAgent,
            success: true,
        });

        // Update last login
        await this.userService.updateById(user._id.toString(), {
            last_login_at: new Date(),
            last_login_ip: ip,
            status: UserStatus.ACTIVE,
        });

        // Send new login notification (preference-aware, async — don't block response)
        this.notificationService.sendNewLoginEmail(
            user.email,
            user.first_name,
            user.notification_preferences,
            { ip, userAgent },
        );

        return {
            access_token,
            refresh_token,
            token_type: 'Bearer',
            user: {
                _id: user._id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                is_2fa_enabled: user.is_2fa_enabled,
            },
        };
    }

    // ── Refresh Token ─────────────────────────────────────────
    async refreshToken(refresh_token: string) {
        let payload: any;
        try {
            payload = this.jwtService.verify(refresh_token, {
                secret: jwtConfig().refresh_secret,
            });
        } catch {
            throw new ErrorEntity({
                http_code: HttpStatus.UNAUTHORIZED,
                error: 'invalid_token',
                error_description: 'Invalid or expired refresh token',
            });
        }

        const storedTokens = await this.refreshTokenModel.find({
            user_id: payload.sub,
            is_revoked: false,
            expires_at: { $gt: new Date() },
        });

        let validToken: RefreshTokenDocument | null = null;
        for (const st of storedTokens) {
            const isMatch = await this.bcrypt.compareBcryptPassword(refresh_token, st.token_hash);
            if (isMatch) {
                validToken = st;
                break;
            }
        }

        if (!validToken) {
            throw new ErrorEntity({
                http_code: HttpStatus.UNAUTHORIZED,
                error: 'token_revoked',
                error_description: 'Refresh token not found or revoked',
            });
        }

        // Revoke old token
        validToken.is_revoked = true;
        await validToken.save();

        // Issue new tokens
        const config = jwtConfig();
        const newPayload = { sub: payload.sub, email: payload.email };

        const access_token = this.jwtService.sign(newPayload, {
            secret: config.access_secret,
            expiresIn: config.access_expires_in_sec,
        });

        const new_refresh_token = this.jwtService.sign(newPayload, {
            secret: config.refresh_secret,
            expiresIn: config.refresh_expires_in_sec,
        });

        const token_hash = await this.bcrypt.generateBcryptPassword(new_refresh_token);
        await this.refreshTokenModel.create({
            user_id: payload.sub,
            token_hash,
            expires_at: this.parseExpiresIn(config.refresh_expires_in),
        });

        return { access_token, refresh_token: new_refresh_token, token_type: 'Bearer' };
    }

    // ── Logout ────────────────────────────────────────────────
    async logout(userId: string) {
        await this.refreshTokenModel.updateMany(
            { user_id: userId, is_revoked: false },
            { $set: { is_revoked: true } },
        );

        // Terminate all sessions
        await this.sessionService.terminateAllUserSessions(userId);

        return { message: 'Logged out successfully' };
    }

    // ── Forgot Password ───────────────────────────────────────
    async forgotPassword(email: string) {
        const user = await this.userService.findByEmail(email);
        // Always return same message to prevent email enumeration
        const response = { message: 'If the email exists, a password reset link has been sent.' };

        if (!user) return response;

        const password_reset_token = RandomNumberGenerator.getUniqueId();
        const password_reset_expires = this.dateHelper.addHours(new Date(), 1);

        await this.userService.updateById(user._id.toString(), {
            password_reset_token,
            password_reset_expires,
        });

        await this.notificationService.sendPasswordResetEmail(
            user.email,
            user.first_name,
            password_reset_token,
        );

        return response;
    }

    // ── Reset Password ────────────────────────────────────────
    async resetPassword(dto: ResetPasswordDto) {
        const user = await this.userService.findByResetToken(dto.token);
        if (!user) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'invalid_token',
                error_description: 'Invalid or expired reset token',
            });
        }

        const password_hash = await this.bcrypt.generateBcryptPassword(dto.new_password);

        await this.userService.updateById(user._id.toString(), {
            password_hash,
            password_reset_token: undefined,
            password_reset_expires: undefined,
            password_changed_at: new Date(),
            failed_login_attempts: 0,
            locked_until: undefined,
            status: user.status === UserStatus.LOCKED ? UserStatus.ACTIVE : user.status,
        });

        // Revoke all refresh tokens
        await this.refreshTokenModel.updateMany(
            { user_id: user._id, is_revoked: false },
            { $set: { is_revoked: true } },
        );

        // Terminate all active sessions
        await this.sessionService.terminateAllUserSessions(user._id.toString());

        // Log security event
        await this.sessionService.recordSecurityEvent({
            user_id: user._id.toString(),
            event_type: 'password_reset',
            description: 'Password was reset via reset token',
        });

        // Send password changed + security alert notifications
        this.notificationService.sendPasswordChangedEmail(
            user.email,
            user.first_name,
            user.notification_preferences,
        );
        this.notificationService.sendSecurityAlertEmail(
            user.email,
            user.first_name,
            'Password Reset',
            'Your password was reset using a password reset link. All sessions have been terminated.',
            user.notification_preferences,
        );

        return { message: 'Password reset successfully' };
    }

    // ── 2FA Enable ────────────────────────────────────────────
    async enable2fa(userId: string) {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'user_not_found',
                error_description: 'User not found',
            });
        }
        if (user.is_2fa_enabled) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: '2fa_already_enabled',
                error_description: '2FA is already enabled',
            });
        }

        const secret = this.totpHelper.generate();
        const otpauth_url = this.totpHelper.createOTPAuthURL(
            secret,
            user.email,
            'base32',
            process.env.APP_NAME || 'NestJSApp',
        );

        await this.userService.updateById(userId, { two_fa_secret: secret });

        return { secret, otpauth_url };
    }

    // ── 2FA Verify & Activate ─────────────────────────────────
    async verify2fa(userId: string, token: string) {
        const user = await this.userService.findById(userId);
        if (!user || !user.two_fa_secret) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: '2fa_not_initiated',
                error_description: '2FA setup not initiated',
            });
        }

        const isValid = this.totpHelper.validate(token, user.two_fa_secret);
        if (!isValid) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'invalid_2fa_token',
                error_description: 'Invalid 2FA token',
            });
        }

        await this.userService.updateById(userId, { is_2fa_enabled: true });

        // Log security event
        await this.sessionService.recordSecurityEvent({
            user_id: userId,
            event_type: '2fa_enabled',
            description: 'Two-factor authentication was enabled',
        });

        // Send security alert notification
        this.notificationService.sendSecurityAlertEmail(
            user.email,
            user.first_name,
            '2FA Enabled',
            'Two-factor authentication has been enabled on your account.',
            user.notification_preferences,
        );

        return { message: '2FA enabled successfully' };
    }

    // ── 2FA Disable ───────────────────────────────────────────
    async disable2fa(userId: string, token: string) {
        const user = await this.userService.findById(userId);
        if (!user || !user.is_2fa_enabled) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: '2fa_not_enabled',
                error_description: '2FA is not enabled',
            });
        }

        const isValid = this.totpHelper.validate(token, user.two_fa_secret);
        if (!isValid) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'invalid_2fa_token',
                error_description: 'Invalid 2FA token',
            });
        }

        await this.userService.updateById(userId, {
            is_2fa_enabled: false,
            two_fa_secret: undefined,
        });

        // Log security event
        await this.sessionService.recordSecurityEvent({
            user_id: userId,
            event_type: '2fa_disabled',
            description: 'Two-factor authentication was disabled',
        });

        // Send security alert notification
        this.notificationService.sendSecurityAlertEmail(
            user.email,
            user.first_name,
            '2FA Disabled',
            'Two-factor authentication has been disabled on your account. Your account is now less secure.',
            user.notification_preferences,
        );

        return { message: '2FA disabled successfully' };
    }

    // ── Account Recovery (request) ──────────────────────────────
    async requestAccountRecovery(email: string) {
        const user = await this.userService.findByEmailIncludeDeleted(email);
        const response = { message: 'If the account exists and is recoverable, a recovery email has been sent.' };

        if (!user || !user.is_deleted) {
            return response;
        }

        const recovery_token = RandomNumberGenerator.getUniqueId();
        const recovery_expires = this.dateHelper.addHours(new Date(), 24);

        await this.userService.updateById(user._id.toString(), {
            password_reset_token: recovery_token,
            password_reset_expires: recovery_expires,
        });

        await this.notificationService.sendAccountRecoveryEmail(
            user.email,
            user.first_name,
            recovery_token,
        );

        return response;
    }

    // ── Account Recovery (confirm) ───────────────────────────────
    async confirmAccountRecovery(token: string) {
        const user = await this.userService.findByResetToken(token);
        if (!user || !user.is_deleted) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'invalid_token',
                error_description: 'Invalid or expired recovery token',
            });
        }

        await this.userService.updateById(user._id.toString(), {
            is_deleted: false,
            deleted_at: undefined,
            status: UserStatus.ACTIVE,
            password_reset_token: undefined,
            password_reset_expires: undefined,
        });

        // Log security event
        await this.sessionService.recordSecurityEvent({
            user_id: user._id.toString(),
            event_type: 'account_recovered',
            description: 'Account was recovered from deleted state',
        });

        return { message: 'Account recovered successfully. You can now log in.' };
    }

    // ── Admin Impersonation ───────────────────────────────────
    async impersonate(adminUserId: string, targetUserId: string) {
        const targetUser = await this.userService.findById(targetUserId);
        if (!targetUser) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'user_not_found',
                error_description: 'Target user not found',
            });
        }

        if (targetUser.is_deleted) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'user_deleted',
                error_description: 'Cannot impersonate a deleted user',
            });
        }

        const config = jwtConfig();
        const payload = {
            sub: targetUser._id.toString(),
            email: targetUser.email,
            impersonated_by: adminUserId,
        };

        // Short-lived impersonation token (1 hour)
        const access_token = this.jwtService.sign(payload, {
            secret: config.access_secret,
            expiresIn: 3600,
        });

        // Log security event
        await this.sessionService.recordSecurityEvent({
            user_id: adminUserId,
            event_type: 'admin_impersonation',
            description: `Admin impersonated user ${targetUser.email} (${targetUserId})`,
        });

        return {
            access_token,
            token_type: 'Bearer',
            expires_in: 3600,
            impersonating: {
                _id: targetUser._id,
                email: targetUser.email,
                first_name: targetUser.first_name,
                last_name: targetUser.last_name,
            },
            warning: 'This is an impersonation token. All actions will be logged.',
        };
    }

    async forcePasswordChange(userId: string, current_pass: string, new_pass: string, ip: string, userAgent: string) {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'user_not_found',
                error_description: 'User not found',
            });
        }

        const isMatch = await this.bcrypt.compareBcryptPassword(current_pass, user.password_hash);
        if (!isMatch) {
            throw new ErrorEntity({
                http_code: HttpStatus.UNAUTHORIZED,
                error: 'invalid_credentials',
                error_description: 'Current password does not match',
            });
        }

        const password_hash = await this.bcrypt.generateBcryptPassword(new_pass);
        await this.userService.updateById(userId, {
            password_hash,
            requires_password_change: false,
            password_changed_at: new Date(),
        });

        // Record security event
        await this.sessionService.recordSecurityEvent({
            user_id: user._id.toString(),
            event_type: 'password_change',
            description: 'Forced password change upon first login',
            ip_address: ip,
            user_agent: userAgent
        });

        return { message: 'Password updated successfully. You can now log in with your new password.' };
    }

    // ── Private Helpers ───────────────────────────────────────
    private parseExpiresIn(expiresIn: string): Date {
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match) return this.dateHelper.addDays(new Date(), 7);

        const value = parseInt(match[1]);
        const unit = match[2];

        switch (unit) {
            case 's': return this.dateHelper.addMinutes(new Date(), value / 60);
            case 'm': return this.dateHelper.addMinutes(new Date(), value);
            case 'h': return this.dateHelper.addHours(new Date(), value);
            case 'd': return this.dateHelper.addDays(new Date(), value);
            default: return this.dateHelper.addDays(new Date(), 7);
        }
    }
}
