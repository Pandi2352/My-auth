import {
    Body,
    Controller,
    Delete,
    Get,
    Patch,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import * as path from 'path';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { RandomNumberGenerator } from '../../utils/random-id-generator-util.js';
import { UserProfileService } from './user-profile.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdateEmailDto } from './dto/update-email.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UpdateNotificationsDto } from './dto/update-notifications.dto.js';
import { UpdatePhoneDto } from './dto/update-phone.dto.js';
import { DeleteAccountDto } from './dto/delete-account.dto.js';

const avatarStorage = diskStorage({
    destination: './uploads/avatars',
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${RandomNumberGenerator.getUniqueId()}${ext}`;
        cb(null, filename);
    },
});

const imageFileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
};

@ApiTags('User Profile')
@ApiBearerAuth('access-token')
@Controller('user')
export class UserProfileController {
    constructor(private readonly profileService: UserProfileService) {}

    @Get('profile')
    @Permissions('user:read')
    @ApiOperation({ summary: 'Get own profile' })
    getProfile(@CurrentUser('_id') userId: string) {
        return this.profileService.getProfile(userId);
    }

    @Patch('profile')
    @Permissions('user:update')
    @ApiOperation({ summary: 'Update profile (name, phone)' })
    updateProfile(@CurrentUser('_id') userId: string, @Body() dto: UpdateProfileDto) {
        return this.profileService.updateProfile(userId, dto);
    }

    @Patch('email')
    @Permissions('user:update')
    @ApiOperation({ summary: 'Update email (requires password confirmation, triggers re-verification)' })
    updateEmail(@CurrentUser('_id') userId: string, @Body() dto: UpdateEmailDto) {
        return this.profileService.updateEmail(userId, dto);
    }

    @Patch('phone')
    @Permissions('user:update')
    @ApiOperation({ summary: 'Update phone number' })
    updatePhone(@CurrentUser('_id') userId: string, @Body() dto: UpdatePhoneDto) {
        return this.profileService.updatePhone(userId, dto);
    }

    @Patch('password')
    @Permissions('user:update')
    @ApiOperation({ summary: 'Change password (requires current password)' })
    changePassword(@CurrentUser('_id') userId: string, @Body() dto: ChangePasswordDto) {
        return this.profileService.changePassword(userId, dto);
    }

    @Post('profile/avatar')
    @Permissions('user:update')
    @ApiOperation({ summary: 'Upload profile image' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('avatar', {
        storage: avatarStorage,
        fileFilter: imageFileFilter,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }))
    uploadAvatar(
        @CurrentUser('_id') userId: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.profileService.uploadAvatar(userId, file);
    }

    @Delete('profile/avatar')
    @Permissions('user:update')
    @ApiOperation({ summary: 'Remove profile image' })
    removeAvatar(@CurrentUser('_id') userId: string) {
        return this.profileService.removeAvatar(userId);
    }

    @Patch('notifications')
    @Permissions('user:update')
    @ApiOperation({ summary: 'Update notification preferences' })
    updateNotifications(@CurrentUser('_id') userId: string, @Body() dto: UpdateNotificationsDto) {
        return this.profileService.updateNotifications(userId, dto);
    }

    // ── GDPR ───────────────────────────────────────────────────

    @Get('data-export')
    @Permissions('user:read')
    @ApiOperation({ summary: 'Export all your data (GDPR)' })
    exportData(@CurrentUser('_id') userId: string) {
        return this.profileService.exportUserData(userId);
    }

    @Delete('account')
    @Permissions('user:update')
    @ApiOperation({ summary: 'Delete your account (GDPR) — requires password confirmation' })
    deleteAccount(@CurrentUser('_id') userId: string, @Body() dto: DeleteAccountDto) {
        return this.profileService.deleteAccount(userId, dto.password);
    }
}
