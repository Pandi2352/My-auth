import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PermissionService } from '../permission/permission.service.js';
import { RoleService } from '../role/role.service.js';
import { UserService } from '../user/user.service.js';
import { PermissionAction } from '../../common/enums/permission-action.enum.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import { BcryptPasswordHelper } from '../../utils/BcryptPasswordHelper.js';

const DEFAULT_PERMISSIONS = [
    { module: 'user', actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE, PermissionAction.DELETE] },
    { module: 'role', actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE, PermissionAction.DELETE] },
    { module: 'permission', actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE, PermissionAction.DELETE] },
    { module: 'session', actions: [PermissionAction.READ, PermissionAction.DELETE] },
    { module: 'audit', actions: [PermissionAction.READ] },
    { module: 'analytics', actions: [PermissionAction.READ] },
    { module: 'group', actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE, PermissionAction.DELETE] },
    { module: 'settings', actions: [PermissionAction.READ, PermissionAction.UPDATE] },
    { module: 'invitation', actions: [PermissionAction.CREATE, PermissionAction.READ] },
    { module: 'connector', actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE, PermissionAction.DELETE] },
    { module: 'advertisement', actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE, PermissionAction.DELETE] },
];

@Injectable()
export class SeedService implements OnModuleInit {
    private readonly logger = new Logger(SeedService.name);

    constructor(
        private readonly permissionService: PermissionService,
        private readonly roleService: RoleService,
        private readonly userService: UserService,
    ) {}

    async onModuleInit() {
        await this.seedPermissions();
        await this.seedRoles();
        await this.seedSuperAdmin();
        await this.seedDevUser();
    }

    private async seedPermissions() {
        let created = 0;
        for (const { module, actions } of DEFAULT_PERMISSIONS) {
            for (const action of actions) {
                const slug = `${module}:${action}`;
                const name = `${this.capitalize(module)} ${this.capitalize(action)}`;
                await this.permissionService.upsertBySlug({
                    name,
                    slug,
                    module,
                    action,
                    description: `${this.capitalize(action)} ${module} resources`,
                });
                created++;
            }
        }
        this.logger.log(`Seeded ${created} permissions (upsert)`);
    }

    private async seedRoles() {
        const allPermissions = await this.permissionService.findAll();
        const permMap = new Map(allPermissions.map((p) => [p.slug, (p as any)._id]));

        // Super Admin — all permissions
        const superAdminPerms = allPermissions.map((p) => (p as any)._id);
        const superAdmin = await this.roleService.upsertBySlug({
            name: 'Super Admin',
            slug: 'super_admin',
            description: 'Full system access',
            is_system: true,
            is_default: false,
        });
        await superAdmin.updateOne({ $set: { permissions: superAdminPerms } });

        // Admin — all except settings:update
        const adminPerms = allPermissions
            .filter((p) => p.slug !== 'settings:update')
            .map((p) => (p as any)._id);
        const admin = await this.roleService.upsertBySlug({
            name: 'Admin',
            slug: 'admin',
            description: 'Administrative access',
            is_system: true,
            is_default: false,
        });
        await admin.updateOne({ $set: { permissions: adminPerms } });

        // Moderator — user:read, user:update, group:read, group:update, session:read, audit:read
        const modSlugs = ['user:read', 'user:update', 'group:read', 'group:update', 'session:read', 'audit:read'];
        const modPerms = modSlugs.map((s) => permMap.get(s)).filter(Boolean);
        const moderator = await this.roleService.upsertBySlug({
            name: 'Moderator',
            slug: 'moderator',
            description: 'Content moderation access',
            is_system: false,
            is_default: false,
        });
        await moderator.updateOne({ $set: { permissions: modPerms } });

        // User — basic self-service access (default role)
        const userPerms = ['user:read', 'user:update', 'session:read', 'session:delete'].map((s) => permMap.get(s)).filter(Boolean);
        const userRole = await this.roleService.upsertBySlug({
            name: 'User',
            slug: 'user',
            description: 'Basic user access',
            is_system: false,
            is_default: true,
        });
        await userRole.updateOne({ $set: { permissions: userPerms } });

        this.logger.log('Seeded 4 roles: super_admin, admin, moderator, user');
    }

    private async seedSuperAdmin() {
        const adminEmail = 'superadmin@example.com';
        const existing = await this.userService.findByEmailIncludeDeleted(adminEmail);
        const password_hash = await BcryptPasswordHelper.Instance.generateBcryptPassword('AdminPassword123!');

        if (!existing) {
            const superAdminRole = await this.roleService.findBySlug('super_admin');
            if (!superAdminRole) {
                this.logger.error('Super Admin role not found. Skipping user creation.');
                return;
            }

            const user = await this.userService.create({
                first_name: 'Super',
                last_name: 'Admin',
                email: adminEmail,
                password_hash,
                status: UserStatus.ACTIVE,
                is_verified: true,
                is_deleted: false,
            });

            await this.userService.assignRoles(user._id.toString(), [(superAdminRole as any)._id.toString()]);
            this.logger.log(`Seeded Super Admin user: ${adminEmail} (Pass: AdminPassword123!)`);
        } else {
            // Force update password and status to be sure
            await this.userService.updateById((existing as any)._id.toString(), {
                password_hash,
                status: UserStatus.ACTIVE,
                is_verified: true,
                is_deleted: false,
            });
            this.logger.log('Super Admin user updated/verified on startup.');
        }
    }

    private async seedDevUser() {
        const devEmail = 'dev@example.com';
        const existing = await this.userService.findByEmailIncludeDeleted(devEmail);
        const password_hash = await BcryptPasswordHelper.Instance.generateBcryptPassword('DevPassword123!');

        const superAdminRole = await this.roleService.findBySlug('super_admin');
        if (!superAdminRole) {
            this.logger.error('Super Admin role not found. Skipping dev user creation.');
            return;
        }

        if (!existing) {
            const user = await this.userService.create({
                first_name: 'Dev',
                last_name: 'User',
                email: devEmail,
                password_hash,
                status: UserStatus.ACTIVE,
                is_verified: true,
                is_deleted: false,
            });

            await this.userService.assignRoles(user._id.toString(), [(superAdminRole as any)._id.toString()]);
            this.logger.log(`Seeded Dev user: ${devEmail} (Pass: DevPassword123!)`);
        } else {
            await this.userService.updateById((existing as any)._id.toString(), {
                password_hash,
                status: UserStatus.ACTIVE,
                is_verified: true,
                is_deleted: false,
            });
            // Ensure dev user has super_admin role
            await this.userService.assignRoles((existing as any)._id.toString(), [(superAdminRole as any)._id.toString()]);
            this.logger.log('Dev user updated/verified on startup.');
        }
    }

    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
