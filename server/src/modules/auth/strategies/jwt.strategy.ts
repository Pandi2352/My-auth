import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConfig } from '../../../config/jwt.config.js';
import { UserService } from '../../user/user.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private readonly userService: UserService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtConfig().access_secret,
        });
    }

    async validate(payload: { sub: string; email: string }) {
        const user = await this.userService.findByIdWithRolesAndPermissions(payload.sub);
        if (!user || user.is_deleted) {
            throw new UnauthorizedException('User not found');
        }
        return {
            _id: user._id,
            email: user.email,
            status: user.status,
            roles: user.roles,
        };
    }
}
