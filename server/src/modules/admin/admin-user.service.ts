import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema.js';
import { RefreshToken, RefreshTokenDocument } from '../auth/schemas/refresh-token.schema.js';
import { Role, RoleDocument } from '../role/schemas/role.schema.js';
import { AdminCreateUserDto } from './dto/admin-create-user.dto.js';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto.js';
import { ListUsersQueryDto } from './dto/list-users-query.dto.js';
import { BcryptPasswordHelper } from '../../utils/BcryptPasswordHelper.js';
import { ErrorEntity } from '../../utils/reponseUtils/ErrorEntity.js';
import { HttpStatus } from '../../utils/reponseUtils/httpStatus.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';

const ADMIN_USER_PROJECTION = {
    password_hash: 0,
    email_verification_token: 0,
    email_verification_expires: 0,
    password_reset_token: 0,
    password_reset_expires: 0,
    two_fa_secret: 0,
    __v: 0,
};

@Injectable()
export class AdminUserService {
    private bcrypt = BcryptPasswordHelper.Instance;

    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshTokenDocument>,
        @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    ) {}

    // ── List Users (Paginated, Search, Filter) ──────────────

    async listUsers(query: ListUsersQueryDto) {
        const page = Math.max(1, parseInt(query.page || '1'));
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10')));
        const skip = (page - 1) * limit;

        const filter: any = {};

        // Search by name or email
        if (query.search) {
            const searchRegex = new RegExp(query.search, 'i');
            filter.$or = [
                { first_name: searchRegex },
                { last_name: searchRegex },
                { email: searchRegex },
            ];
        }

        // Filter by status
        if (query.status) {
            filter.status = query.status;
        }

        // Filter by role slug
        if (query.role) {
            const role = await this.roleModel.findOne({ slug: query.role.toLowerCase() });
            if (role) {
                filter.roles = role._id;
            } else {
                // Role not found — return empty results
                return {
                    users: [],
                    meta_data: { page, limit, total: 0, total_pages: 0 },
                };
            }
        }

        // Sort
        const sortField = query.sort_by || 'created_at';
        const sortOrder = query.sort_order === 'asc' ? 1 : -1;
        const sort: any = { [sortField]: sortOrder };

        const [users, total] = await Promise.all([
            this.userModel
                .find(filter, ADMIN_USER_PROJECTION)
                .populate('roles', 'name slug')
                .sort(sort)
                .skip(skip)
                .limit(limit),
            this.userModel.countDocuments(filter),
        ]);

        return {
            users,
            meta_data: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        };
    }

    // ── Get Single User ─────────────────────────────────────

    async getUserById(id: string) {
        const user = await this.userModel
            .findById(id, ADMIN_USER_PROJECTION)
            .populate('roles', 'name slug');
        if (!user) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'user_not_found',
                error_description: 'User not found',
            });
        }
        return user;
    }

    // ── Create User (Admin) ─────────────────────────────────

    async createUser(dto: AdminCreateUserDto) {
        const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() });
        if (existing) {
            throw new ErrorEntity({
                http_code: HttpStatus.CONFLICT,
                error: 'email_exists',
                error_description: 'Email already registered',
            });
        }

        const password_hash = await this.bcrypt.generateBcryptPassword(dto.password);

        const userData: any = {
            first_name: dto.first_name,
            last_name: dto.last_name,
            email: dto.email.toLowerCase(),
            password_hash,
            phone: dto.phone,
            status: dto.status || UserStatus.ACTIVE,
            is_verified: dto.is_verified !== undefined ? dto.is_verified : true,
            requires_password_change: dto.requires_password_change || false,
        };

        // Assign roles if provided
        if (dto.role_ids && dto.role_ids.length > 0) {
            const roles = await this.roleModel.find({ _id: { $in: dto.role_ids } });
            if (roles.length !== dto.role_ids.length) {
                throw new ErrorEntity({
                    http_code: HttpStatus.BAD_REQUEST,
                    error: 'invalid_roles',
                    error_description: 'One or more role IDs are invalid',
                });
            }
            userData.roles = dto.role_ids;
        } else {
            // Assign default role
            const defaultRole = await this.roleModel.findOne({ is_default: true });
            if (defaultRole) {
                userData.roles = [defaultRole._id];
            }
        }

        const user = await this.userModel.create(userData);
        const populated = await this.userModel
            .findById(user._id, ADMIN_USER_PROJECTION)
            .populate('roles', 'name slug');

        return { message: 'User created successfully', user: populated };
    }

    // ── Update User (Admin) ─────────────────────────────────

    async updateUser(id: string, dto: AdminUpdateUserDto) {
        const user = await this.userModel.findById(id);
        if (!user) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'user_not_found',
                error_description: 'User not found',
            });
        }

        // Check email uniqueness if changing email
        if (dto.email && dto.email.toLowerCase() !== user.email) {
            const existing = await this.userModel.findOne({
                email: dto.email.toLowerCase(),
                _id: { $ne: id },
            });
            if (existing) {
                throw new ErrorEntity({
                    http_code: HttpStatus.CONFLICT,
                    error: 'email_exists',
                    error_description: 'Email already in use by another user',
                });
            }
            (dto as any).email = dto.email.toLowerCase();
        }

        const updated = await this.userModel
            .findByIdAndUpdate(id, { $set: dto }, { returnDocument: 'after' })
            .select(ADMIN_USER_PROJECTION)
            .populate('roles', 'name slug');

        return { message: 'User updated successfully', user: updated };
    }

    // ── Update User Status ──────────────────────────────────

    async updateStatus(id: string, status: UserStatus) {
        const user = await this.userModel.findById(id);
        if (!user) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'user_not_found',
                error_description: 'User not found',
            });
        }

        const updateData: any = { status };

        // If activating, clear lock
        if (status === UserStatus.ACTIVE) {
            updateData.failed_login_attempts = 0;
            updateData.locked_until = null;
        }

        await this.userModel.findByIdAndUpdate(id, { $set: updateData });

        return { message: `User status updated to '${status}'` };
    }

    // ── Suspend User ────────────────────────────────────────

    async suspendUser(id: string) {
        return this.updateStatus(id, UserStatus.SUSPENDED);
    }

    // ── Admin Reset Password ────────────────────────────────

    async resetPassword(id: string, newPassword: string) {
        const user = await this.userModel.findById(id);
        if (!user) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'user_not_found',
                error_description: 'User not found',
            });
        }

        const password_hash = await this.bcrypt.generateBcryptPassword(newPassword);

        await this.userModel.findByIdAndUpdate(id, {
            $set: {
                password_hash,
                password_changed_at: new Date(),
                failed_login_attempts: 0,
                locked_until: null,
            },
        });

        // Revoke all refresh tokens
        await this.refreshTokenModel.updateMany(
            { user_id: new Types.ObjectId(id) },
            { $set: { is_revoked: true } },
        );

        return { message: 'Password reset successfully. All sessions have been revoked.' };
    }

    // ── Assign Roles ────────────────────────────────────────

    async assignRoles(userId: string, roleIds: string[]) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'user_not_found',
                error_description: 'User not found',
            });
        }

        const roles = await this.roleModel.find({ _id: { $in: roleIds } });
        if (roles.length !== roleIds.length) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'invalid_roles',
                error_description: 'One or more role IDs are invalid',
            });
        }

        const updated = await this.userModel
            .findByIdAndUpdate(
                userId,
                { $addToSet: { roles: { $each: roleIds } } },
                { returnDocument: 'after' },
            )
            .select(ADMIN_USER_PROJECTION)
            .populate('roles', 'name slug');

        return { message: 'Roles assigned successfully', user: updated };
    }

    // ── Remove Roles ────────────────────────────────────────

    async removeRoles(userId: string, roleIds: string[]) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'user_not_found',
                error_description: 'User not found',
            });
        }

        const updated = await this.userModel
            .findByIdAndUpdate(
                userId,
                { $pull: { roles: { $in: roleIds } } },
                { returnDocument: 'after' },
            )
            .select(ADMIN_USER_PROJECTION)
            .populate('roles', 'name slug');

        return { message: 'Roles removed successfully', user: updated };
    }

    // ── Soft Delete ─────────────────────────────────────────

    async softDelete(id: string) {
        const user = await this.userModel.findById(id);
        if (!user) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'user_not_found',
                error_description: 'User not found',
            });
        }

        if (user.is_deleted) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'already_deleted',
                error_description: 'User is already deleted',
            });
        }

        await this.userModel.findByIdAndUpdate(id, {
            $set: {
                is_deleted: true,
                deleted_at: new Date(),
                status: UserStatus.INACTIVE,
            },
        });

        // Revoke all refresh tokens
        await this.refreshTokenModel.updateMany(
            { user_id: new Types.ObjectId(id) },
            { $set: { is_revoked: true } },
        );

        return { message: 'User soft deleted successfully' };
    }

    // ── Hard Delete ─────────────────────────────────────────

    async hardDelete(id: string) {
        const user = await this.userModel.findById(id);
        if (!user) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'user_not_found',
                error_description: 'User not found',
            });
        }

        // Delete refresh tokens
        await this.refreshTokenModel.deleteMany({ user_id: new Types.ObjectId(id) });
        // Delete user
        await this.userModel.findByIdAndDelete(id);

        return { message: 'User permanently deleted' };
    }

    // ── Restore Soft-Deleted User ───────────────────────────

    async restoreUser(id: string) {
        const user = await this.userModel.findById(id);
        if (!user) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'user_not_found',
                error_description: 'User not found',
            });
        }

        if (!user.is_deleted) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'not_deleted',
                error_description: 'User is not deleted',
            });
        }

        await this.userModel.findByIdAndUpdate(id, {
            $set: {
                is_deleted: false,
                deleted_at: null,
                status: UserStatus.ACTIVE,
            },
        });

        return { message: 'User restored successfully' };
    }

    // ── Bulk Export (JSON) ──────────────────────────────────

    async exportUsers(query: ListUsersQueryDto) {
        const filter: any = {};

        if (query.search) {
            const searchRegex = new RegExp(query.search, 'i');
            filter.$or = [
                { first_name: searchRegex },
                { last_name: searchRegex },
                { email: searchRegex },
            ];
        }
        if (query.status) {
            filter.status = query.status;
        }

        const users = await this.userModel
            .find(filter, {
                first_name: 1,
                last_name: 1,
                email: 1,
                phone: 1,
                status: 1,
                is_verified: 1,
                last_login_at: 1,
                created_at: 1,
            })
            .populate('roles', 'name slug')
            .sort({ created_at: -1 });

        return {
            total: users.length,
            exported_at: new Date().toISOString(),
            users,
        };
    }

    // ── Bulk Operations ──────────────────────────────────────

    async bulkUpdateStatus(userIds: string[], status: UserStatus) {
        if (!userIds || userIds.length === 0) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'invalid_request',
                error_description: 'No users selected',
            });
        }

        const updateData: any = { status };
        if (status === UserStatus.ACTIVE) {
            updateData.failed_login_attempts = 0;
            updateData.locked_until = null;
        }

        const objectIds = userIds.map(id => new Types.ObjectId(id));

        await this.userModel.updateMany(
            { _id: { $in: objectIds } },
            { $set: updateData },
        );

        return { message: `Successfully updated status for ${userIds.length} users to '${status}'` };
    }

    async bulkAssignRoles(userIds: string[], roleIds: string[]) {
        if (!userIds || userIds.length === 0) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'invalid_request',
                error_description: 'No users selected',
            });
        }

        // Validate roles
        const roles = await this.roleModel.find({ _id: { $in: roleIds } });
        if (roles.length !== roleIds.length) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'invalid_roles',
                error_description: 'One or more role IDs are invalid',
            });
        }

        const objectIds = userIds.map(id => new Types.ObjectId(id));

        await this.userModel.updateMany(
            { _id: { $in: objectIds } },
            { $addToSet: { roles: { $each: roleIds } } },
        );

        return { message: `Successfully assigned roles to ${userIds.length} users` };
    }

    async bulkDelete(userIds: string[], soft: boolean = true) {
        if (!userIds || userIds.length === 0) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'invalid_request',
                error_description: 'No users selected',
            });
        }

        const objectIds = userIds.map(id => new Types.ObjectId(id));

        if (soft) {
            await this.userModel.updateMany(
                { _id: { $in: objectIds } },
                { $set: { is_deleted: true, deleted_at: new Date(), status: UserStatus.INACTIVE } },
            );
            // Revoke refresh tokens
            await this.refreshTokenModel.updateMany(
                { user_id: { $in: objectIds } },
                { $set: { is_revoked: true } },
            );
        } else {
            // Delete refresh tokens first
            await this.refreshTokenModel.deleteMany({ user_id: { $in: objectIds } });
            // Permanent delete users
            await this.userModel.deleteMany({ _id: { $in: objectIds } });
        }

        return { message: `Successfully deleted ${userIds.length} users` };
    }
}
