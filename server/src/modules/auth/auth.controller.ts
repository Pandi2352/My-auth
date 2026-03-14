import {
    Body,
    Controller,
    Get,
    Ip,
    Param,
    Post,
    Query,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { LocalAuthGuard } from '../../common/guards/local-auth.guard.js';
import { CaptchaGuard } from '../../common/guards/captcha.guard.js';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { Verify2faDto } from './dto/enable-2fa.dto.js';
import type { Request, Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @UseGuards(CaptchaGuard)
    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Public()
    @Post('verify-email')
    @ApiOperation({ summary: 'Verify email with token (POST)' })
    verifyEmail(@Body() dto: VerifyEmailDto) {
        return this.authService.verifyEmail(dto.token);
    }

    @Public()
    @Get('verify-email')
    @ApiOperation({ summary: 'Verify email from browser link (GET)' })
    async verifyEmailGet(@Query('token') token: string, @Res() res: Response) {
        try {
            await this.authService.verifyEmail(token);
            res.send(`
                <html>
                <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f9ff;">
                    <div style="text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h1 style="color: #16a34a;">&#10004; Email Verified!</h1>
                        <p style="color: #555;">Your email has been verified successfully. You can now log in.</p>
                    </div>
                </body>
                </html>
            `);
        } catch (error: any) {
            const message = error?.error_description || 'Invalid or expired verification token';
            res.status(400).send(`
                <html>
                <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #fef2f2;">
                    <div style="text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h1 style="color: #dc2626;">&#10008; Verification Failed</h1>
                        <p style="color: #555;">${message}</p>
                    </div>
                </body>
                </html>
            `);
        }
    }

    @Public()
    @Post('resend-verification')
    @ApiOperation({ summary: 'Resend verification email' })
    resendVerification(@Body() dto: ForgotPasswordDto) {
        return this.authService.resendVerification(dto.email);
    }

    @Public()
    @UseGuards(CaptchaGuard, LocalAuthGuard)
    @Post('login')
    @ApiOperation({ summary: 'Login with email and password' })
    login(@Req() req: Request, @Body() dto: LoginDto, @Ip() ip: string) {
        const userAgent = req.headers['user-agent'] || '';
        return this.authService.login(req.user as any, dto, ip, userAgent);
    }

    @Public()
    @Post('refresh')
    @ApiOperation({ summary: 'Refresh access token' })
    refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refreshToken(dto.refresh_token);
    }

    @ApiBearerAuth('access-token')
    @Post('logout')
    @ApiOperation({ summary: 'Logout (revoke all refresh tokens)' })
    logout(@CurrentUser('_id') userId: string) {
        return this.authService.logout(userId);
    }

    @Public()
    @UseGuards(CaptchaGuard)
    @Post('forgot-password')
    @ApiOperation({ summary: 'Send password reset email' })
    forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.email);
    }

    @Public()
    @Post('reset-password')
    @ApiOperation({ summary: 'Reset password with token' })
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }

    // ── Account Recovery ─────────────────────────────────────

    @Public()
    @Post('recover-account')
    @ApiOperation({ summary: 'Request account recovery for a deleted account' })
    requestRecovery(@Body() dto: ForgotPasswordDto) {
        return this.authService.requestAccountRecovery(dto.email);
    }

    @Public()
    @Post('recover-account/confirm')
    @ApiOperation({ summary: 'Confirm account recovery with token' })
    confirmRecovery(@Body() dto: VerifyEmailDto) {
        return this.authService.confirmAccountRecovery(dto.token);
    }

    // ── Admin Impersonation ──────────────────────────────────

    @ApiBearerAuth('access-token')
    @Post('impersonate/:id')
    @ApiOperation({ summary: 'Impersonate a user (admin only — returns short-lived token)' })
    impersonate(@CurrentUser('_id') adminUserId: string, @Param('id') targetUserId: string) {
        return this.authService.impersonate(adminUserId, targetUserId);
    }

    // ── 2FA ───────────────────────────────────────────────────

    @ApiBearerAuth('access-token')
    @Post('2fa/enable')
    @ApiOperation({ summary: 'Enable 2FA — returns secret and QR URL' })
    enable2fa(@CurrentUser('_id') userId: string) {
        return this.authService.enable2fa(userId);
    }

    @ApiBearerAuth('access-token')
    @Post('2fa/verify')
    @ApiOperation({ summary: 'Verify 2FA token and activate' })
    verify2fa(@CurrentUser('_id') userId: string, @Body() dto: Verify2faDto) {
        return this.authService.verify2fa(userId, dto.token);
    }

    @ApiBearerAuth('access-token')
    @Post('2fa/disable')
    @ApiOperation({ summary: 'Disable 2FA' })
    disable2fa(@CurrentUser('_id') userId: string, @Body() dto: Verify2faDto) {
        return this.authService.disable2fa(userId, dto.token);
    }
}
