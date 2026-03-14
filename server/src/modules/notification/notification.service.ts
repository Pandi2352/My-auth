import { Injectable, Logger } from '@nestjs/common';
import { SMTPEmailer } from '../../utils/email-util/SMTPEmailer.js';
import { CommonEmailSendEntity } from '../../utils/email-util/entity/CommonEmailSendEntity.js';
import { EmailConfig } from '../../utils/email-util/entity/EmailConfig.js';
import { UserAgentHelper } from '../../utils/UserAgentHelper.js';
import {
    emailVerificationTemplate,
    emailUpdateVerificationTemplate,
    passwordResetTemplate,
    passwordChangedTemplate,
    newLoginTemplate,
    securityAlertTemplate,
    welcomeTemplate,
    accountLockedTemplate,
    invitationTemplate,
    accountRecoveryTemplate,
} from './email-templates.js';

export interface NotificationPreferences {
    email_on_login: boolean;
    email_on_password_change: boolean;
    email_on_security_alert: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
    email_on_login: false,
    email_on_password_change: true,
    email_on_security_alert: true,
};

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);
    private uaHelper = UserAgentHelper.Instance;

    // ── Core Email Sender ────────────────────────────────────

    private getEmailConfig(): EmailConfig {
        return {
            provider: 'smtp',
            host_name: process.env.SMTP_HOST || '',
            host_port: Number(process.env.SMTP_PORT) || 587,
            client_id: process.env.SMTP_USER,
            client_secret: process.env.SMTP_PASS,
            from: process.env.SMTP_FROM || 'noreply@app.com',
        };
    }

    private async send(to: string, subject: string, html: string): Promise<void> {
        const entity: CommonEmailSendEntity = {
            email_config: this.getEmailConfig(),
            from_name: process.env.APP_NAME || 'NestJS App',
            to,
            subject,
            html,
        };

        try {
            await SMTPEmailer.Instance.sendEmail(entity);
            this.logger.log(`Email sent: "${subject}" → ${to}`);
        } catch (error) {
            this.logger.error(`Failed to send email: "${subject}" → ${to}`, error);
        }
    }

    // ── Email Verification (always sent — not preference-gated) ──

    async sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
        const baseUrl = process.env.APP_URL || 'http://localhost:3000';
        const verifyUrl = `${baseUrl}/api/v1/auth/verify-email?token=${token}`;

        const html = emailVerificationTemplate({ name, verifyUrl });
        await this.send(to, 'Verify Your Email', html);
    }

    // ── Email Update Verification (always sent) ──────────────

    async sendEmailUpdateVerification(to: string, name: string, token: string): Promise<void> {
        const baseUrl = process.env.APP_URL || 'http://localhost:3000';
        const verifyUrl = `${baseUrl}/api/v1/auth/verify-email?token=${token}`;

        const html = emailUpdateVerificationTemplate({ name, verifyUrl, newEmail: to });
        await this.send(to, 'Verify Your New Email', html);
    }

    // ── Password Reset (always sent — user requested it) ─────

    async sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
        const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
        const resetUrl = `${baseUrl}/api/v1/auth/reset-password?token=${token}`;

        const html = passwordResetTemplate({ name, resetUrl });
        await this.send(to, 'Reset Your Password', html);
    }

    // ── Password Changed (preference: email_on_password_change) ──

    async sendPasswordChangedEmail(
        to: string,
        name: string,
        preferences?: NotificationPreferences,
        ip?: string,
    ): Promise<void> {
        const prefs = preferences || DEFAULT_PREFERENCES;
        if (!prefs.email_on_password_change) return;

        const html = passwordChangedTemplate({
            name,
            changedAt: new Date().toUTCString(),
            ip,
        });
        await this.send(to, 'Your Password Was Changed', html);
    }

    // ── New Login Alert (preference: email_on_login) ─────────

    async sendNewLoginEmail(
        to: string,
        name: string,
        preferences?: NotificationPreferences,
        context?: { ip: string; userAgent: string; location?: string },
    ): Promise<void> {
        const prefs = preferences || DEFAULT_PREFERENCES;
        if (!prefs.email_on_login) return;

        const parsed = context ? this.uaHelper.getSimplifiedDeviceInfo(context.userAgent) : null;

        const html = newLoginTemplate({
            name,
            device: parsed?.device || `${parsed?.os || ''} ${parsed?.deviceType || ''}`.trim() || 'Unknown',
            browser: parsed ? `${parsed.browser} ${parsed.browserVersion}`.trim() : 'Unknown',
            os: parsed ? `${parsed.os} ${parsed.osVersion}`.trim() : 'Unknown',
            ip: context?.ip || 'Unknown',
            location: context?.location || '',
            time: new Date().toUTCString(),
        });
        await this.send(to, 'New Login to Your Account', html);
    }

    // ── Security Alert (preference: email_on_security_alert) ─

    async sendSecurityAlertEmail(
        to: string,
        name: string,
        event: string,
        description: string,
        preferences?: NotificationPreferences,
        ip?: string,
    ): Promise<void> {
        const prefs = preferences || DEFAULT_PREFERENCES;
        if (!prefs.email_on_security_alert) return;

        const html = securityAlertTemplate({
            name,
            event,
            description,
            time: new Date().toUTCString(),
            ip,
        });
        await this.send(to, `Security Alert: ${event}`, html);
    }

    // ── Welcome Email (always sent — after verification) ─────

    async sendWelcomeEmail(to: string, name: string): Promise<void> {
        const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
        const loginUrl = `${baseUrl}/login`;

        const html = welcomeTemplate({ name, loginUrl });
        await this.send(to, `Welcome to ${process.env.APP_NAME || 'NestJS App'}!`, html);
    }

    // ── Invitation Email (always sent) ──────────────────────

    async sendInvitationEmail(to: string, token: string, inviterName: string): Promise<void> {
        const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
        const inviteUrl = `${baseUrl}/register?invitation=${token}`;

        const html = invitationTemplate({ inviterName, inviteUrl });
        await this.send(to, `You've been invited to ${process.env.APP_NAME || 'NestJS App'}`, html);
    }

    // ── Account Recovery Email (always sent) ──────────────────

    async sendAccountRecoveryEmail(to: string, name: string, token: string): Promise<void> {
        const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
        const recoveryUrl = `${baseUrl}/api/v1/auth/recover-account?token=${token}`;

        const html = accountRecoveryTemplate({ name, recoveryUrl });
        await this.send(to, 'Recover Your Account', html);
    }

    // ── Account Locked (always sent — security critical) ─────

    async sendAccountLockedEmail(to: string, name: string, lockedUntil: Date, attempts: number): Promise<void> {
        const html = accountLockedTemplate({
            name,
            lockedUntil: lockedUntil.toUTCString(),
            attempts,
        });
        await this.send(to, 'Your Account Has Been Locked', html);
    }
}
