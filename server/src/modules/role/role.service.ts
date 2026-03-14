import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { PermissionService } from '../permission/permission.service.js';
import { UserService } from '../user/user.service.js';
import { ErrorEntity } from '../../utils/reponseUtils/ErrorEntity.js';
import { HttpStatus } from '../../utils/reponseUtils/httpStatus.js';

@Injectable()
export class RoleService {
    constructor(
        @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
        private readonly permissionService: PermissionService,
        private readonly userService: UserService,
    ) {}

    async create(dto: CreateRoleDto) {
        const existing = await this.roleModel.findOne({ slug: dto.slug.toLowerCase() });
        if (existing) {
            throw new ErrorEntity({
                http_code: HttpStatus.CONFLICT,
                error: 'role_exists',
                error_description: `Role with slug '${dto.slug}' already exists`,
            });
        }

        // Validate permission IDs if provided
        const createData: any = {
            name: dto.name,
            slug: dto.slug,
            description: dto.description,
            is_default: dto.is_default,
        };

        if (dto.permission_ids && dto.permission_ids.length > 0) {
            const permissions = await this.permissionService.findByIds(dto.permission_ids);
            if (permissions.length !== dto.permission_ids.length) {
                throw new ErrorEntity({
                    http_code: HttpStatus.BAD_REQUEST,
                    error: 'invalid_permissions',
                    error_description: 'One or more permission IDs are invalid',
                });
            }
            createData.permissions = dto.permission_ids;
        }

        // If setting as default, unset other default roles
        if (dto.is_default) {
            await this.roleModel.updateMany({}, { $set: { is_default: false } });
        }

        const role = await this.roleModel.create(createData);
        return { message: 'Role created successfully', role };
    }

    async findAll() {
        return this.roleModel.find().sort({ name: 1 });
    }

    async findById(id: string) {
        const role = await this.roleModel.findById(id).populate('permissions');
        if (!role) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'role_not_found',
                error_description: 'Role not found',
            });
        }
        return role;
    }

    async findBySlug(slug: string) {
        return this.roleModel.findOne({ slug: slug.toLowerCase() });
    }

    async findDefaultRole() {
        return this.roleModel.findOne({ is_default: true });
    }

    async update(id: string, dto: UpdateRoleDto) {
        const role = await this.roleModel.findById(id);
        if (!role) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'role_not_found',
                error_description: 'Role not found',
            });
        }

        // Block slug/name changes on system roles
        if (role.is_system && (dto.slug || dto.name)) {
            throw new ErrorEntity({
                http_code: HttpStatus.FORBIDDEN,
                error: 'system_role',
                error_description: 'Cannot change name or slug of system roles',
            });
        }

        if (dto.slug) {
            const existing = await this.roleModel.findOne({
                slug: dto.slug.toLowerCase(),
                _id: { $ne: id },
            });
            if (existing) {
                throw new ErrorEntity({
                    http_code: HttpStatus.CONFLICT,
                    error: 'role_exists',
                    error_description: `Role with slug '${dto.slug}' already exists`,
                });
            }
        }

        // If setting as default, unset other default roles
        if (dto.is_default) {
            await this.roleModel.updateMany({ _id: { $ne: id } }, { $set: { is_default: false } });
        }

        const updated = await this.roleModel.findByIdAndUpdate(id, dto, { returnDocument: 'after' }).populate('permissions');
        return { message: 'Role updated successfully', role: updated };
    }

    async delete(id: string) {
        const role = await this.roleModel.findById(id);
        if (!role) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'role_not_found',
                error_description: 'Role not found',
            });
        }

        if (role.is_system) {
            throw new ErrorEntity({
                http_code: HttpStatus.FORBIDDEN,
                error: 'system_role',
                error_description: 'Cannot delete system roles',
            });
        }

        // Remove role from all users
        await this.userService.removeRoleFromAllUsers(id);
        await this.roleModel.findByIdAndDelete(id);

        return { message: 'Role deleted successfully' };
    }

    // ── Permission Assignment ───────────────────────────────

    async getPermissions(roleId: string) {
        const role = await this.roleModel.findById(roleId).populate('permissions');
        if (!role) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'role_not_found',
                error_description: 'Role not found',
            });
        }
        return role.permissions;
    }

    async assignPermissions(roleId: string, permissionIds: string[]) {
        const role = await this.roleModel.findById(roleId);
        if (!role) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'role_not_found',
                error_description: 'Role not found',
            });
        }

        // Validate all permission IDs
        const permissions = await this.permissionService.findByIds(permissionIds);
        if (permissions.length !== permissionIds.length) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'invalid_permissions',
                error_description: 'One or more permission IDs are invalid',
            });
        }

        const updated = await this.roleModel.findByIdAndUpdate(
            roleId,
            { $addToSet: { permissions: { $each: permissionIds } } },
            { returnDocument: 'after' },
        ).populate('permissions');

        return { message: 'Permissions assigned successfully', role: updated };
    }

    async removePermissions(roleId: string, permissionIds: string[]) {
        const role = await this.roleModel.findById(roleId);
        if (!role) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'role_not_found',
                error_description: 'Role not found',
            });
        }

        const updated = await this.roleModel.findByIdAndUpdate(
            roleId,
            { $pull: { permissions: { $in: permissionIds } } },
            { returnDocument: 'after' },
        ).populate('permissions');

        return { message: 'Permissions removed successfully', role: updated };
    }

    // ── User Role Assignment ────────────────────────────────

    async assignRolesToUser(userId: string, roleIds: string[]) {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'user_not_found',
                error_description: 'User not found',
            });
        }

        // Validate all role IDs
        const roles = await this.roleModel.find({ _id: { $in: roleIds } });
        if (roles.length !== roleIds.length) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'invalid_roles',
                error_description: 'One or more role IDs are invalid',
            });
        }

        const updated = await this.userService.assignRoles(userId, roleIds);
        return { message: 'Roles assigned to user successfully', user: updated };
    }

    async removeRolesFromUser(userId: string, roleIds: string[]) {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'user_not_found',
                error_description: 'User not found',
            });
        }

        const updated = await this.userService.removeRoles(userId, roleIds);
        return { message: 'Roles removed from user successfully', user: updated };
    }

    // ── Seed Helper ─────────────────────────────────────────

    async upsertBySlug(data: Partial<Role> & { slug: string }) {
        return this.roleModel.findOneAndUpdate(
            { slug: data.slug },
            { $set: data },
            { upsert: true, returnDocument: 'after' },
        );
    }

    async removePermissionFromAllRoles(permissionId: string): Promise<void> {
        await this.roleModel.updateMany(
            { permissions: permissionId },
            { $pull: { permissions: permissionId } },
        );
    }
}
