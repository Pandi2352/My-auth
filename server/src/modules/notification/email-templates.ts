// ── Email Template Builder ──────────────────────────────────────────
// All email templates use a shared layout wrapper for consistent branding.

const APP_NAME = () => process.env.APP_NAME || 'NestJS App';
const PRIMARY_COLOR = '#4F46E5';

function layout(title: string, body: string): string {
    const appName = APP_NAME();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color:${PRIMARY_COLOR};padding:24px 32px;">
                            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">${appName}</h1>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding:32px;">
                            ${body}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding:20px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
                            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                                &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
                            </p>
                            <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
                                This is an automated message. Please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`.trim();
}

function button(text: string, url: string): string {
    return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
        <tr>
            <td style="background-color:${PRIMARY_COLOR};border-radius:6px;">
                <a href="${url}" target="_blank" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
                    ${text}
                </a>
            </td>
        </tr>
    </table>`;
}

// ── Templates ──────────────────────────────────────────────────────

export function emailVerificationTemplate(data: { name: string; verifyUrl: string }): string {
    const body = `
        <h2 style="margin:0 0 16px;color:#111827;font-size:22px;">Verify Your Email</h2>
        <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6;">
            Hi ${data.name},
        </p>
        <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6;">
            Thank you for registering. Please click the button below to verify your email address.
        </p>
        ${button('Verify Email', data.verifyUrl)}
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
            Or copy and paste this link into your browser:
        </p>
        <p style="margin:0 0 16px;color:#4F46E5;font-size:13px;word-break:break-all;">
            ${data.verifyUrl}
        </p>
        <p style="margin:0;color:#9ca3af;font-size:13px;">
            This link expires in 24 hours.
        </p>`;
    return layout('Verify Your Email', body);
}

export function emailUpdateVerificationTemplate(data: { name: string; verifyUrl: string; newEmail: string }): string {
    const body = `
        <h2 style="margin:0 0 16px;color:#111827;font-size:22px;">Verify Your New Email</h2>
        <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6;">
            Hi ${data.name},
        </p>
        <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6;">
            Your email address has been updated to <strong>${data.newEmail}</strong>. Please verify this new email address by clicking the button below.
        </p>
        ${button('Verify New Email', data.verifyUrl)}
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
            Or copy and paste this link into your browser:
        </p>
        <p style="margin:0 0 16px;color:#4F46E5;font-size:13px;word-break:break-all;">
            ${data.verifyUrl}
        </p>
        <p style="margin:0;color:#9ca3af;font-size:13px;">
            This link expires in 24 hours.
        </p>`;
    return layout('Verify Your New Email', body);
}

export function passwordResetTemplate(data: { name: string; resetUrl: string }): string {
    const body = `
        <h2 style="margin:0 0 16px;color:#111827;font-size:22px;">Reset Your Password</h2>
        <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6;">
            Hi ${data.name},
        </p>
        <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6;">
            We received a request to reset your password. Click the button below to set a new password.
        </p>
        ${button('Reset Password', data.resetUrl)}
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
            Or copy and paste this link into your browser:
        </p>
        <p style="margin:0 0 16px;color:#4F46E5;font-size:13px;word-break:break-all;">
            ${data.resetUrl}
        </p>
        <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;">
            This link expires in 1 hour.
        </p>
        <p style="margin:0;color:#9ca3af;font-size:13px;">
            If you did not request this, please ignore this email. Your password will remain unchanged.
        </p>`;
    return layout('Reset Your Password', body);
}

export function passwordChangedTemplate(data: { name: string; changedAt: string; ip?: string }): string {
    const ipLine = data.ip ? `<li><strong>IP Address:</strong> ${data.ip}</li>` : '';
    const body = `
        <h2 style="margin:0 0 16px;color:#111827;font-size:22px;">Password Changed</h2>
        <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6;">
            Hi ${data.name},
        </p>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
            Your password was successfully changed.
        </p>
        <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin:0 0 16px;">
            <ul style="margin:0;padding:0 0 0 20px;color:#374151;font-size:14px;line-height:1.8;">
                <li><strong>Time:</strong> ${data.changedAt}</li>
                ${ipLine}
            </ul>
        </div>
        <p style="margin:0;color:#dc2626;font-size:14px;font-weight:500;">
            If you did not make this change, please reset your password immediately and contact support.
        </p>`;
    return layout('Password Changed', body);
}

export function newLoginTemplate(data: { name: string; device: string; browser: string; os: string; ip: string; location: string; time: string }): string {
    const locationLine = data.location ? `<li><strong>Location:</strong> ${data.location}</li>` : '';
    const body = `
        <h2 style="margin:0 0 16px;color:#111827;font-size:22px;">New Login Detected</h2>
        <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6;">
            Hi ${data.name},
        </p>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
            A new login to your account was detected.
        </p>
        <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin:0 0 16px;">
            <ul style="margin:0;padding:0 0 0 20px;color:#374151;font-size:14px;line-height:1.8;">
                <li><strong>Device:</strong> ${data.device}</li>
                <li><strong>Browser:</strong> ${data.browser}</li>
                <li><strong>OS:</strong> ${data.os}</li>
                <li><strong>IP Address:</strong> ${data.ip}</li>
                ${locationLine}
                <li><strong>Time:</strong> ${data.time}</li>
            </ul>
        </div>
        <p style="margin:0;color:#dc2626;font-size:14px;font-weight:500;">
            If this wasn't you, please change your password immediately and review your active sessions.
        </p>`;
    return layout('New Login Detected', body);
}

export function securityAlertTemplate(data: { name: string; event: string; description: string; time: string; ip?: string }): string {
    const ipLine = data.ip ? `<li><strong>IP Address:</strong> ${data.ip}</li>` : '';
    const body = `
        <h2 style="margin:0 0 16px;color:#111827;font-size:22px;">Security Alert</h2>
        <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6;">
            Hi ${data.name},
        </p>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
            A security-related change was made to your account.
        </p>
        <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:16px;margin:0 0 16px;">
            <p style="margin:0 0 8px;color:#991b1b;font-size:15px;font-weight:600;">${data.event}</p>
            <p style="margin:0 0 12px;color:#374151;font-size:14px;">${data.description}</p>
            <ul style="margin:0;padding:0 0 0 20px;color:#374151;font-size:14px;line-height:1.8;">
                <li><strong>Time:</strong> ${data.time}</li>
                ${ipLine}
            </ul>
        </div>
        <p style="margin:0;color:#dc2626;font-size:14px;font-weight:500;">
            If you did not perform this action, please secure your account immediately.
        </p>`;
    return layout('Security Alert', body);
}

export function welcomeTemplate(data: { name: string; loginUrl: string }): string {
    const body = `
        <h2 style="margin:0 0 16px;color:#111827;font-size:22px;">Welcome to ${APP_NAME()}!</h2>
        <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6;">
            Hi ${data.name},
        </p>
        <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6;">
            Your email has been verified and your account is now active. You're all set to get started!
        </p>
        ${button('Go to Login', data.loginUrl)}
        <p style="margin:0;color:#9ca3af;font-size:13px;">
            If you have any questions, feel free to contact our support team.
        </p>`;
    return layout(`Welcome to ${APP_NAME()}`, body);
}

export function invitationTemplate(data: { inviterName: string; inviteUrl: string }): string {
    const body = `
        <h2 style="margin:0 0 16px;color:#111827;font-size:22px;">You've Been Invited!</h2>
        <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6;">
            Hi there,
        </p>
        <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6;">
            ${data.inviterName} has invited you to join <strong>${APP_NAME()}</strong>. Click the button below to create your account.
        </p>
        ${button('Accept Invitation', data.inviteUrl)}
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
            Or copy and paste this link into your browser:
        </p>
        <p style="margin:0 0 16px;color:#4F46E5;font-size:13px;word-break:break-all;">
            ${data.inviteUrl}
        </p>
        <p style="margin:0;color:#9ca3af;font-size:13px;">
            This invitation expires in 7 days.
        </p>`;
    return layout("You've Been Invited", body);
}

export function accountRecoveryTemplate(data: { name: string; recoveryUrl: string }): string {
    const body = `
        <h2 style="margin:0 0 16px;color:#111827;font-size:22px;">Account Recovery</h2>
        <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6;">
            Hi ${data.name},
        </p>
        <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6;">
            You requested to recover your deleted account. Click the button below to reactivate your account.
        </p>
        ${button('Recover Account', data.recoveryUrl)}
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
            Or copy and paste this link into your browser:
        </p>
        <p style="margin:0 0 16px;color:#4F46E5;font-size:13px;word-break:break-all;">
            ${data.recoveryUrl}
        </p>
        <p style="margin:0;color:#9ca3af;font-size:13px;">
            This link expires in 24 hours. If you did not request this, please ignore this email.
        </p>`;
    return layout('Account Recovery', body);
}

export function accountLockedTemplate(data: { name: string; lockedUntil: string; attempts: number }): string {
    const body = `
        <h2 style="margin:0 0 16px;color:#111827;font-size:22px;">Account Locked</h2>
        <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6;">
            Hi ${data.name},
        </p>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
            Your account has been temporarily locked due to ${data.attempts} failed login attempts.
        </p>
        <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:16px;margin:0 0 16px;">
            <p style="margin:0;color:#991b1b;font-size:14px;">
                <strong>Locked until:</strong> ${data.lockedUntil}
            </p>
        </div>
        <p style="margin:0 0 8px;color:#374151;font-size:14px;">
            You can try logging in again after the lock period, or reset your password to unlock your account immediately.
        </p>
        <p style="margin:0;color:#dc2626;font-size:14px;font-weight:500;">
            If these login attempts were not made by you, someone may be trying to access your account. Please reset your password immediately.
        </p>`;
    return layout('Account Locked', body);
}
