import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { BcryptPasswordHelper } from '../../utils/BcryptPasswordHelper.js';
import { RandomNumberGenerator } from '../../utils/random-id-generator-util.js';
import { DateHelper } from '../../utils/DateHelper.js';
import { ErrorEntity } from '../../utils/reponseUtils/ErrorEntity.js';
import { HttpStatus } from '../../utils/reponseUtils/httpStatus.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import { UserService } from './user.service.js';
import { NotificationService } from '../notification/notification.service.js';
import { Session, SessionDocument } from '../session/schemas/session.schema.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdateEmailDto } from './dto/update-email.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UpdateNotificationsDto } from './dto/update-notifications.dto.js';
import { UpdatePhoneDto } from './dto/update-phone.dto.js';

@Injectable()
export class UserProfileService {
    private bcrypt = BcryptPasswordHelper.Instance;
    private dateHelper = DateHelper.Instance;

    constructor(
        private readonly userService: UserService,
        private readonly notificationService: NotificationService,
        @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    ) {}

    // ── View Profile ──────────────────────────────────────────
    async getProfile(userId: string) {
        const user = await this.userService.getProfile(userId);
        if (!user) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'user_not_found',
                error_description: 'User not found',
            });
        }
        return user;
    }

    // ── Edit Profile ──────────────────────────────────────────
    async updateProfile(userId: string, dto: UpdateProfileDto) {
        const updateData: any = {};
        if (dto.first_name !== undefined) updateData.first_name = dto.first_name;
        if (dto.last_name !== undefined) updateData.last_name = dto.last_name;
        if (dto.phone !== undefined) updateData.phone = dto.phone;

        await this.userService.updateById(userId, updateData);
        return this.getProfile(userId);
    }

    // ── Update Email ──────────────────────────────────────────
    async updateEmail(userId: string, dto: UpdateEmailDto) {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'user_not_found',
                error_description: 'User not found',
            });
        }

        // Verify current password
        const isMatch = await this.bcrypt.compareBcryptPassword(dto.password, user.password_hash);
        if (!isMatch) {
            throw new ErrorEntity({
                http_code: HttpStatus.UNAUTHORIZED,
                error: 'invalid_password',
                error_description: 'Current password is incorrect',
            });
        }

        // Check if new email is already taken
        const newEmail = dto.new_email.toLowerCase();
        if (newEmail === user.email) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'same_email',
                error_description: 'New email is the same as current email',
            });
        }

        const existing = await this.userService.findByEmail(newEmail);
        if (existing) {
            throw new ErrorEntity({
                http_code: HttpStatus.CONFLICT,
                error: 'email_taken',
                error_description: 'This email is already registered',
            });
        }

        // Update email and require re-verification
        const email_verification_token = RandomNumberGenerator.getUniqueId();
        const email_verification_expires = this.dateHelper.addHours(new Date(), 24);

        await this.userService.updateById(userId, {
            email: newEmail,
            is_verified: false,
            status: UserStatus.PENDING,
            email_verification_token,
            email_verification_expires,
        });

        await this.notificationService.sendEmailUpdateVerification(
            newEmail,
            user.first_name,
            email_verification_token,
        );

        return { message: 'Email updated. Please verify your new email address.' };
    }

    // ── Update Phone ──────────────────────────────────────────
    async updatePhone(userId: string, dto: UpdatePhoneDto) {
        await this.userService.updateById(userId, { phone: dto.phone });
        return this.getProfile(userId);
    }

    // ── Change Password ───────────────────────────────────────
    async changePassword(userId: string, dto: ChangePasswordDto) {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'user_not_found',
                error_description: 'User not found',
            });
        }

        // Verify current password
        const isMatch = await this.bcrypt.compareBcryptPassword(dto.current_password, user.password_hash);
        if (!isMatch) {
            throw new ErrorEntity({
                http_code: HttpStatus.UNAUTHORIZED,
                error: 'invalid_password',
                error_description: 'Current password is incorrect',
            });
        }

        // Prevent same password
        const isSame = await this.bcrypt.compareBcryptPassword(dto.new_password, user.password_hash);
        if (isSame) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'same_password',
                error_description: 'New password must be different from current password',
            });
        }

        const password_hash = await this.bcrypt.generateBcryptPassword(dto.new_password);
        await this.userService.updateById(userId, {
            password_hash,
            password_changed_at: new Date(),
        });

        // Send password changed notification (preference-aware)
        this.notificationService.sendPasswordChangedEmail(
            user.email,
            user.first_name,
            user.notification_preferences,
        );

        return { message: 'Password changed successfully' };
    }

    // ── Upload Avatar ─────────────────────────────────────────
    async uploadAvatar(userId: string, file: Express.Multer.File) {
        if (!file) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'no_file',
                error_description: 'No file uploaded',
            });
        }

        // Remove old avatar if exists
        const user = await this.userService.findById(userId);
        if (user?.avatar_url) {
            const oldPath = path.resolve(user.avatar_url);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        const avatar_url = file.path.replace(/\\/g, '/');
        await this.userService.updateById(userId, { avatar_url });

        return { message: 'Avatar uploaded successfully', avatar_url };
    }

    // ── Remove Avatar ─────────────────────────────────────────
    async removeAvatar(userId: string) {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'user_not_found',
                error_description: 'User not found',
            });
        }

        if (user.avatar_url) {
            const filePath = path.resolve(user.avatar_url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await this.userService.updateById(userId, { avatar_url: undefined } as any);

        return { message: 'Avatar removed successfully' };
    }

    // ── Update Notification Preferences ───────────────────────
    async updateNotifications(userId: string, dto: UpdateNotificationsDto) {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'user_not_found',
                error_description: 'User not found',
            });
        }

        const current = user.notification_preferences || {
            email_on_login: false,
            email_on_password_change: true,
            email_on_security_alert: true,
        };

        const updated = {
            email_on_login: dto.email_on_login ?? current.email_on_login,
            email_on_password_change: dto.email_on_password_change ?? current.email_on_password_change,
            email_on_security_alert: dto.email_on_security_alert ?? current.email_on_security_alert,
        };

        await this.userService.updateById(userId, { notification_preferences: updated });

        return { message: 'Notification preferences updated', notification_preferences: updated };
    }

    // ── GDPR: Data Export ──────────────────────────────────────

    async exportUserData(userId: string) {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'user_not_found',
                error_description: 'User not found',
            });
        }

        // Get sessions
        const sessions = await this.sessionModel
            .find({ user_id: user._id })
            .select('-token_hash')
            .lean();

        return {
            exported_at: new Date().toISOString(),
            user: {
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone: user.phone,
                avatar_url: user.avatar_url,
                status: user.status,
                is_verified: user.is_verified,
                is_2fa_enabled: user.is_2fa_enabled,
                notification_preferences: user.notification_preferences,
                last_login_at: user.last_login_at,
                last_login_ip: user.last_login_ip,
                created_at: user.created_at,
                updated_at: user.updated_at,
            },
            sessions: sessions.map((s: any) => ({
                device: s.device,
                ip_address: s.ip_address,
                location: s.location,
                is_active: s.is_active,
                created_at: s.created_at,
                expires_at: s.expires_at,
            })),
        };
    }

    // ── GDPR: Account Deletion ─────────────────────────────────

    async deleteAccount(userId: string, password: string) {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'user_not_found',
                error_description: 'User not found',
            });
        }

        // Verify password
        const isMatch = await this.bcrypt.compareBcryptPassword(password, user.password_hash);
        if (!isMatch) {
            throw new ErrorEntity({
                http_code: HttpStatus.UNAUTHORIZED,
                error: 'invalid_password',
                error_description: 'Password is incorrect',
            });
        }

        // Soft-delete: mark as deleted, anonymize PII
        await this.userService.updateById(userId, {
            is_deleted: true,
            deleted_at: new Date(),
            status: UserStatus.INACTIVE,
            first_name: 'Deleted',
            last_name: 'User',
            phone: undefined,
            avatar_url: undefined,
            notification_preferences: {
                email_on_login: false,
                email_on_password_change: false,
                email_on_security_alert: false,
            },
        });

        // Terminate all sessions
        await this.sessionModel.updateMany(
            { user_id: user._id },
            { $set: { is_active: false } },
        );

        return {
            message: 'Your account has been scheduled for deletion. You can recover it within 30 days by contacting support or using account recovery.',
        };
    }
}
