import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, PERMISSIONS_KEY } from '../constants/index.js';
import { ErrorEntity } from '../../utils/reponseUtils/ErrorEntity.js';
import { HttpStatus } from '../../utils/reponseUtils/httpStatus.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredPermissions || requiredPermissions.length === 0) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.roles) {
            throw new ErrorEntity({
                http_code: HttpStatus.FORBIDDEN,
                error: 'insufficient_permission',
                error_description: 'You do not have the required permission to access this resource',
            });
        }

        // Flatten user roles → permissions → slugs
        const userPermissionSlugs = new Set<string>();
        for (const role of user.roles) {
            if (role.permissions && Array.isArray(role.permissions)) {
                for (const perm of role.permissions) {
                    userPermissionSlugs.add(perm.slug || perm);
                }
            }
        }

        const hasAllPermissions = requiredPermissions.every((perm) => userPermissionSlugs.has(perm));

        if (!hasAllPermissions) {
            throw new ErrorEntity({
                http_code: HttpStatus.FORBIDDEN,
                error: 'insufficient_permission',
                error_description: 'You do not have the required permission to access this resource',
            });
        }

        return true;
    }
}
