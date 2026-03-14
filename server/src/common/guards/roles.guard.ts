import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../constants/index.js';
import { ErrorEntity } from '../../utils/reponseUtils/ErrorEntity.js';
import { HttpStatus } from '../../utils/reponseUtils/httpStatus.js';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles || requiredRoles.length === 0) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.roles) {
            throw new ErrorEntity({
                http_code: HttpStatus.FORBIDDEN,
                error: 'insufficient_role',
                error_description: 'You do not have the required role to access this resource',
            });
        }

        const userRoleSlugs = user.roles.map((r: any) => r.slug || r);
        const hasRole = requiredRoles.some((role) => userRoleSlugs.includes(role));

        if (!hasRole) {
            throw new ErrorEntity({
                http_code: HttpStatus.FORBIDDEN,
                error: 'insufficient_role',
                error_description: 'You do not have the required role to access this resource',
            });
        }

        return true;
    }
}
