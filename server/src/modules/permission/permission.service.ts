import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission, PermissionDocument } from './schemas/permission.schema.js';
import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';
import { ErrorEntity } from '../../utils/reponseUtils/ErrorEntity.js';
import { HttpStatus } from '../../utils/reponseUtils/httpStatus.js';

@Injectable()
export class PermissionService {
    constructor(
        @InjectModel(Permission.name) private permissionModel: Model<PermissionDocument>,
    ) {}

    async create(dto: CreatePermissionDto) {
        const existing = await this.permissionModel.findOne({ slug: dto.slug.toLowerCase() });
        if (existing) {
            throw new ErrorEntity({
                http_code: HttpStatus.CONFLICT,
                error: 'permission_exists',
                error_description: `Permission with slug '${dto.slug}' already exists`,
            });
        }

        const permission = await this.permissionModel.create(dto);
        return { message: 'Permission created successfully', permission };
    }

    async findAll() {
        return this.permissionModel.find().sort({ module: 1, action: 1 });
    }

    async findById(id: string) {
        const permission = await this.permissionModel.findById(id);
        if (!permission) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'permission_not_found',
                error_description: 'Permission not found',
            });
        }
        return permission;
    }

    async findByIds(ids: string[]) {
        return this.permissionModel.find({ _id: { $in: ids } });
    }

    async findBySlug(slug: string) {
        return this.permissionModel.findOne({ slug: slug.toLowerCase() });
    }

    async update(id: string, dto: UpdatePermissionDto) {
        if (dto.slug) {
            const existing = await this.permissionModel.findOne({
                slug: dto.slug.toLowerCase(),
                _id: { $ne: id },
            });
            if (existing) {
                throw new ErrorEntity({
                    http_code: HttpStatus.CONFLICT,
                    error: 'permission_exists',
                    error_description: `Permission with slug '${dto.slug}' already exists`,
                });
            }
        }

        const permission = await this.permissionModel.findByIdAndUpdate(id, dto, { returnDocument: 'after' });
        if (!permission) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'permission_not_found',
                error_description: 'Permission not found',
            });
        }

        return { message: 'Permission updated successfully', permission };
    }

    async delete(id: string) {
        const permission = await this.permissionModel.findById(id);
        if (!permission) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'permission_not_found',
                error_description: 'Permission not found',
            });
        }

        await this.permissionModel.findByIdAndDelete(id);
        return { message: 'Permission deleted successfully' };
    }

    async upsertBySlug(data: Partial<Permission>) {
        return this.permissionModel.findOneAndUpdate(
            { slug: data.slug },
            { $set: data },
            { upsert: true, returnDocument: 'after' },
        );
    }
}
