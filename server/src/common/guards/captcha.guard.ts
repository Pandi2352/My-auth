import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { CaptchaService } from '../../modules/captcha/captcha.service.js';

@Injectable()
export class CaptchaGuard implements CanActivate {
    constructor(private readonly captchaService: CaptchaService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = request.body?.captcha_token;
        await this.captchaService.verify(token);
        return true;
    }
}
