import { Injectable, Logger } from '@nestjs/common';
import { ErrorEntity } from '../../utils/reponseUtils/ErrorEntity.js';
import { HttpStatus } from '../../utils/reponseUtils/httpStatus.js';

const GOOGLE_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

@Injectable()
export class CaptchaService {
    private readonly logger = new Logger(CaptchaService.name);

    get isEnabled(): boolean {
        return process.env.RECAPTCHA_ENABLED === 'true';
    }

    private get secretKey(): string {
        return process.env.RECAPTCHA_SECRET_KEY || '';
    }

    async verify(token: string | undefined): Promise<void> {
        if (!this.isEnabled) return;

        if (!token) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'captcha_required',
                error_description: 'CAPTCHA verification is required',
            });
        }

        if (!this.secretKey) {
            this.logger.warn('RECAPTCHA_SECRET_KEY not configured — skipping verification');
            return;
        }

        try {
            const params = new URLSearchParams({
                secret: this.secretKey,
                response: token,
            });

            const res = await fetch(GOOGLE_VERIFY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString(),
            });

            const data = await res.json();

            if (!data.success) {
                this.logger.warn(`CAPTCHA verification failed: ${JSON.stringify(data['error-codes'])}`);
                throw new ErrorEntity({
                    http_code: HttpStatus.BAD_REQUEST,
                    error: 'captcha_failed',
                    error_description: 'CAPTCHA verification failed. Please try again.',
                });
            }
        } catch (error) {
            if (error instanceof ErrorEntity) throw error;

            this.logger.error('CAPTCHA verification request failed', error);
            // Fail open — don't block users if Google is unreachable
            this.logger.warn('CAPTCHA verification skipped due to network error');
        }
    }
}
