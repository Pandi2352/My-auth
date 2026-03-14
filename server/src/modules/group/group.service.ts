import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserGroup, UserGroupDocument } from './schemas/user-group.schema.js';
import { CreateGroupDto } from './dto/create-group.dto.js';
import { UpdateGroupDto } from './dto/update-group.dto.js';
import { ErrorEntity } from '../../utils/reponseUtils/ErrorEntity.js';
import { HttpStatus } from '../../utils/reponseUtils/httpStatus.js';

@Injectable()
export class GroupService {
    constructor(
        @InjectModel(UserGroup.name) private groupModel: Model<UserGroupDocument>,
    ) {}

    // ── Create ────────────────────────────────────────────────

    async create(dto: CreateGroupDto) {
        const existing = await this.groupModel.findOne({ slug: dto.slug.toLowerCase() });
        if (existing) {
            throw new ErrorEntity({
                http_code: HttpStatus.CONFLICT,
                error: 'group_exists',
                error_description: `Group with slug '${dto.slug}' already exists`,
            });
        }

        const createData: any = {
            name: dto.name,
            slug: dto.slug,
            description: dto.description,
            is_active: dto.is_active,
        };

        if (dto.role_ids && dto.role_ids.length > 0) {
            createData.roles = dto.role_ids.map((id) => new Types.ObjectId(id));
        }

        const group = await this.groupModel.create(createData);
        return group.toObject();
    }

    // ── List (Paginated) ──────────────────────────────────────

    async findAll(query: { page?: string; limit?: string; search?: string; is_active?: string }) {
        const page = parseInt(query.page || '1');
        const limit = Math.min(parseInt(query.limit || '20'), 100);
        const skip = (page - 1) * limit;

        const filter: Record<string, any> = {};
        if (query.search) {
            filter.$or = [
                { name: { $regex: query.search, $options: 'i' } },
                { slug: { $regex: query.search, $options: 'i' } },
            ];
        }
        if (query.is_active !== undefined) {
            filter.is_active = query.is_active === 'true';
        }

        const [groups, total] = await Promise.all([
            this.groupModel
                .find(filter)
                .populate('roles', 'name slug')
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.groupModel.countDocuments(filter),
        ]);

        return {
            groups,
            meta_data: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        };
    }

    // ── Get By ID ─────────────────────────────────────────────

    async findById(id: string) {
        const group = await this.groupModel
            .findById(id)
            .populate('roles', 'name slug permissions')
            .populate('users', 'first_name last_name email')
            .lean();

        if (!group) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'group_not_found',
                error_description: 'Group not found',
            });
        }

        return group;
    }

    // ── Update ────────────────────────────────────────────────

    async update(id: string, dto: UpdateGroupDto) {
        const group = await this.groupModel.findByIdAndUpdate(id, dto, { returnDocument: 'after' }).lean();
        if (!group) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'group_not_found',
                error_description: 'Group not found',
            });
        }
        return group;
    }

    // ── Delete ────────────────────────────────────────────────

    async delete(id: string) {
        const group = await this.groupModel.findByIdAndDelete(id).lean();
        if (!group) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'group_not_found',
                error_description: 'Group not found',
            });
        }
        return { deleted: true };
    }

    // ── Add Users ─────────────────────────────────────────────

    async addUsers(id: string, userIds: string[]) {
        const objectIds = userIds.map((uid) => new Types.ObjectId(uid));

        const group = await this.groupModel.findByIdAndUpdate(
            id,
            { $addToSet: { users: { $each: objectIds } } },
            { returnDocument: 'after' },
        ).populate('users', 'first_name last_name email').lean();

        if (!group) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'group_not_found',
                error_description: 'Group not found',
            });
        }

        return group;
    }

    // ── Remove Users ──────────────────────────────────────────

    async removeUsers(id: string, userIds: string[]) {
        const objectIds = userIds.map((uid) => new Types.ObjectId(uid));

        const group = await this.groupModel.findByIdAndUpdate(
            id,
            { $pull: { users: { $in: objectIds } } },
            { returnDocument: 'after' },
        ).populate('users', 'first_name last_name email').lean();

        if (!group) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'group_not_found',
                error_description: 'Group not found',
            });
        }

        return group;
    }

    // ── Assign Roles ──────────────────────────────────────────

    async assignRoles(id: string, roleIds: string[]) {
        const objectIds = roleIds.map((rid) => new Types.ObjectId(rid));

        const group = await this.groupModel.findByIdAndUpdate(
            id,
            { $addToSet: { roles: { $each: objectIds } } },
            { returnDocument: 'after' },
        ).populate('roles', 'name slug').lean();

        if (!group) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'group_not_found',
                error_description: 'Group not found',
            });
        }

        return group;
    }

    // ── Remove Roles ──────────────────────────────────────────

    async removeRoles(id: string, roleIds: string[]) {
        const objectIds = roleIds.map((rid) => new Types.ObjectId(rid));

        const group = await this.groupModel.findByIdAndUpdate(
            id,
            { $pull: { roles: { $in: objectIds } } },
            { returnDocument: 'after' },
        ).populate('roles', 'name slug').lean();

        if (!group) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'group_not_found',
                error_description: 'Group not found',
            });
        }

        return group;
    }

    // ── Get Group Permissions (resolved) ──────────────────────

    async getGroupPermissions(id: string) {
        const group = await this.groupModel
            .findById(id)
            .populate({
                path: 'roles',
                populate: { path: 'permissions', select: 'name slug category' },
            })
            .lean();

        if (!group) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'group_not_found',
                error_description: 'Group not found',
            });
        }

        // Flatten and deduplicate permissions from all roles
        const permissionMap = new Map<string, any>();
        for (const role of (group.roles || []) as any[]) {
            for (const perm of role.permissions || []) {
                permissionMap.set(perm._id.toString(), perm);
            }
        }

        return {
            group_id: group._id,
            group_name: group.name,
            permissions: Array.from(permissionMap.values()),
            total: permissionMap.size,
        };
    }

    // ── Get Groups for a User ─────────────────────────────────

    async getGroupsByUser(userId: string) {
        return this.groupModel
            .find({ users: new Types.ObjectId(userId), is_active: true })
            .populate('roles', 'name slug')
            .lean();
    }
}
