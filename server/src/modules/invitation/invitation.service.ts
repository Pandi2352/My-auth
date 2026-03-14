import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invitation, InvitationDocument } from './schemas/invitation.schema.js';
import { CreateInvitationDto } from './dto/create-invitation.dto.js';
import { RandomNumberGenerator } from '../../utils/random-id-generator-util.js';
import { DateHelper } from '../../utils/DateHelper.js';
import { ErrorEntity } from '../../utils/reponseUtils/ErrorEntity.js';
import { HttpStatus } from '../../utils/reponseUtils/httpStatus.js';
import { NotificationService } from '../notification/notification.service.js';
import { UserService } from '../user/user.service.js';
import { RoleService } from '../role/role.service.js';

@Injectable()
export class InvitationService {
    private dateHelper = DateHelper.Instance;

    constructor(
        @InjectModel(Invitation.name) private invitationModel: Model<InvitationDocument>,
        private readonly notificationService: NotificationService,
        private readonly userService: UserService,
        private readonly roleService: RoleService,
    ) {}

    // ── Create Invitation ─────────────────────────────────────

    async create(dto: CreateInvitationDto, invitedByUserId: string) {
        // Check if user already exists
        const existingUser = await this.userService.findByEmail(dto.email);
        if (existingUser) {
            throw new ErrorEntity({
                http_code: HttpStatus.CONFLICT,
                error: 'user_exists',
                error_description: 'A user with this email already exists',
            });
        }

        // Check for pending invitation
        const existingInvite = await this.invitationModel.findOne({
            email: dto.email.toLowerCase(),
            is_revoked: false,
            accepted_at: null,
            expires_at: { $gt: new Date() },
        });
        if (existingInvite) {
            throw new ErrorEntity({
                http_code: HttpStatus.CONFLICT,
                error: 'invitation_pending',
                error_description: 'An active invitation already exists for this email',
            });
        }

        const token = RandomNumberGenerator.getUniqueId();
        const expires_at = this.dateHelper.addDays(new Date(), 7); // 7-day expiry

        const invitation = await this.invitationModel.create({
            email: dto.email.toLowerCase(),
            role_id: dto.role_id ? new Types.ObjectId(dto.role_id) : undefined,
            token,
            expires_at,
            invited_by: new Types.ObjectId(invitedByUserId),
        });

        // Send invitation email
        const inviter = await this.userService.findById(invitedByUserId);
        await this.notificationService.sendInvitationEmail(
            dto.email,
            token,
            inviter?.first_name || 'Admin',
        );

        return {
            _id: invitation._id,
            email: invitation.email,
            role_id: invitation.role_id,
            expires_at: invitation.expires_at,
            token,
        };
    }

    // ── List Invitations ──────────────────────────────────────

    async findAll(query: { page?: string; limit?: string; status?: string }) {
        const page = parseInt(query.page || '1');
        const limit = Math.min(parseInt(query.limit || '20'), 100);
        const skip = (page - 1) * limit;

        const filter: Record<string, any> = {};
        if (query.status === 'pending') {
            filter.accepted_at = null;
            filter.is_revoked = false;
            filter.expires_at = { $gt: new Date() };
        } else if (query.status === 'accepted') {
            filter.accepted_at = { $ne: null };
        } else if (query.status === 'expired') {
            filter.accepted_at = null;
            filter.is_revoked = false;
            filter.expires_at = { $lte: new Date() };
        } else if (query.status === 'revoked') {
            filter.is_revoked = true;
        }

        const [invitations, total] = await Promise.all([
            this.invitationModel
                .find(filter)
                .populate('role_id', 'name slug')
                .populate('invited_by', 'first_name last_name email')
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.invitationModel.countDocuments(filter),
        ]);

        return {
            invitations,
            meta_data: { page, limit, total, total_pages: Math.ceil(total / limit) },
        };
    }

    // ── Get by ID ─────────────────────────────────────────────

    async findById(id: string) {
        const invitation = await this.invitationModel
            .findById(id)
            .populate('role_id', 'name slug')
            .populate('invited_by', 'first_name last_name email')
            .lean();

        if (!invitation) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'invitation_not_found',
                error_description: 'Invitation not found',
            });
        }
        return invitation;
    }

    // ── Validate Token (for registration) ─────────────────────

    async validateToken(token: string) {
        const invitation = await this.invitationModel.findOne({
            token,
            is_revoked: false,
            accepted_at: null,
            expires_at: { $gt: new Date() },
        }).populate('role_id', 'name slug').lean();

        if (!invitation) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'invalid_invitation',
                error_description: 'Invitation is invalid, expired, or already used',
            });
        }

        return invitation;
    }

    // ── Accept Invitation ─────────────────────────────────────

    async accept(token: string) {
        const invitation = await this.invitationModel.findOneAndUpdate(
            {
                token,
                is_revoked: false,
                accepted_at: null,
                expires_at: { $gt: new Date() },
            },
            { $set: { accepted_at: new Date() } },
            { returnDocument: 'after' },
        );

        if (!invitation) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'invalid_invitation',
                error_description: 'Invitation is invalid, expired, or already used',
            });
        }

        return invitation;
    }

    // ── Revoke Invitation ─────────────────────────────────────

    async revoke(id: string) {
        const invitation = await this.invitationModel.findByIdAndUpdate(
            id,
            { $set: { is_revoked: true } },
            { returnDocument: 'after' },
        ).lean();

        if (!invitation) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'invitation_not_found',
                error_description: 'Invitation not found',
            });
        }

        return { message: 'Invitation revoked' };
    }

    // ── Resend Invitation ─────────────────────────────────────

    async resend(id: string) {
        const invitation = await this.invitationModel.findById(id);
        if (!invitation || invitation.is_revoked || invitation.accepted_at) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: 'cannot_resend',
                error_description: 'Cannot resend this invitation',
            });
        }

        // Extend expiry
        invitation.expires_at = this.dateHelper.addDays(new Date(), 7);
        await invitation.save();

        const inviter = await this.userService.findById(invitation.invited_by.toString());
        await this.notificationService.sendInvitationEmail(
            invitation.email,
            invitation.token,
            inviter?.first_name || 'Admin',
        );

        return { message: 'Invitation resent', expires_at: invitation.expires_at };
    }
}
