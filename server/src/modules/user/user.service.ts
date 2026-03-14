import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema.js';

// Fields excluded from profile responses
const PROFILE_PROJECTION = {
    password_hash: 0,
    email_verification_token: 0,
    email_verification_expires: 0,
    password_reset_token: 0,
    password_reset_expires: 0,
    two_fa_secret: 0,
    failed_login_attempts: 0,
    locked_until: 0,
    is_deleted: 0,
    deleted_at: 0,
    __v: 0,
};

@Injectable()
export class UserService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

    async create(data: Partial<User>): Promise<UserDocument> {
        const user = new this.userModel(data);
        return user.save();
    }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email: email.toLowerCase(), is_deleted: false });
    }

    async findByEmailIncludeDeleted(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email: email.toLowerCase() });
    }

    async findById(id: string): Promise<UserDocument | null> {
        return this.userModel.findById(id);
    }

    async findByVerificationToken(token: string): Promise<UserDocument | null> {
        return this.userModel.findOne({
            email_verification_token: token,
            email_verification_expires: { $gt: new Date() },
        });
    }

    async findByResetToken(token: string): Promise<UserDocument | null> {
        return this.userModel.findOne({
            password_reset_token: token,
            password_reset_expires: { $gt: new Date() },
        });
    }

    async updateById(id: string, data: Partial<User>): Promise<UserDocument | null> {
        return this.userModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' });
    }

    async incrementFailedAttempts(id: string): Promise<void> {
        await this.userModel.findByIdAndUpdate(id, { $inc: { failed_login_attempts: 1 } });
    }

    async resetFailedAttempts(id: string): Promise<void> {
        await this.userModel.findByIdAndUpdate(id, {
            $set: { failed_login_attempts: 0, locked_until: null },
        });
    }

    // ── Profile Methods ───────────────────────────────────────

    async getProfile(id: string): Promise<UserDocument | null> {
        return this.userModel
            .findOne({ _id: id, is_deleted: false }, PROFILE_PROJECTION)
            .populate({
                path: 'roles',
                populate: { path: 'permissions' },
            });
    }

    // ── Role Methods ────────────────────────────────────────

    async findByIdWithRolesAndPermissions(id: string): Promise<UserDocument | null> {
        return this.userModel.findById(id).populate({
            path: 'roles',
            populate: { path: 'permissions' },
        });
    }

    async assignRoles(id: string, roleIds: string[]): Promise<UserDocument | null> {
        return this.userModel.findByIdAndUpdate(
            id,
            { $addToSet: { roles: { $each: roleIds } } },
            { returnDocument: 'after' },
        ).populate('roles');
    }

    async removeRoles(id: string, roleIds: string[]): Promise<UserDocument | null> {
        return this.userModel.findByIdAndUpdate(
            id,
            { $pull: { roles: { $in: roleIds } } },
            { returnDocument: 'after' },
        ).populate('roles');
    }

    async removeRoleFromAllUsers(roleId: string): Promise<void> {
        await this.userModel.updateMany(
            { roles: roleId },
            { $pull: { roles: roleId } },
        );
    }
}
