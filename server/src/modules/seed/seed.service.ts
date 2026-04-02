import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PermissionService } from '../permission/permission.service.js';
import { RoleService } from '../role/role.service.js';
import { UserService } from '../user/user.service.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import { BcryptPasswordHelper } from '../../utils/BcryptPasswordHelper.js';

@Injectable()
export class SeedService implements OnModuleInit {
    private readonly logger = new Logger(SeedService.name);

    constructor(
        private readonly permissionService: PermissionService,
        private readonly roleService: RoleService,
        private readonly userService: UserService,
    ) {}

    async onModuleInit() {
        try {
            const seedFilePath = path.join(process.cwd(), 'src', 'config', 'seed.json');
            const seedData = JSON.parse(fs.readFileSync(seedFilePath, 'utf8'));

            await this.seedPermissions(seedData.permissions);
            await this.seedRoles(seedData.roles);
            await this.seedUsers(seedData.users);
            
            this.logger.log('Database seeding completed successfully.');
        } catch (error) {
            this.logger.error('Database seeding failed: ' + error.message);
        }
    }

    private async seedPermissions(permissions: any[]) {
        let created = 0;
        for (const { module, actions } of permissions) {
            for (const action of actions) {
                const slug = `${module}:${action.toLowerCase()}`;
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

    private async seedRoles(roles: any[]) {
        const allPermissions = await this.permissionService.findAll();
        const permMap = new Map(allPermissions.map((p) => [p.slug, (p as any)._id]));

        for (const role of roles) {
            const upsertedRole = await this.roleService.upsertBySlug({
                name: role.name,
                slug: role.slug,
                description: role.description,
                is_system: role.is_system,
                is_default: role.is_default,
            });

            let rolePerms: any[] = [];
            if (role.slug === 'super_admin') {
                rolePerms = allPermissions.map((p) => (p as any)._id);
            } else if (role.slug === 'admin') {
                rolePerms = allPermissions
                    .filter((p) => p.slug !== 'settings:update')
                    .map((p) => (p as any)._id);
            } else if (role.slug === 'moderator') {
                const slugs = ['user:read', 'user:update', 'group:read', 'group:update', 'session:read', 'audit:read'];
                rolePerms = slugs.map((s) => permMap.get(s)).filter(Boolean);
            } else if (role.slug === 'user') {
                const slugs = ['user:read', 'user:update', 'session:read', 'session:delete'];
                rolePerms = slugs.map((s) => permMap.get(s)).filter(Boolean);
            }

            await upsertedRole.updateOne({ $set: { permissions: rolePerms } });
        }
        this.logger.log(`Seeded ${roles.length} roles.`);
    }

    private async seedUsers(users: any[]) {
        for (const userData of users) {
            const existing = await this.userService.findByEmailIncludeDeleted(userData.email);
            const password_hash = await BcryptPasswordHelper.Instance.generateBcryptPassword(userData.password);
            const role = await this.roleService.findBySlug(userData.role);

            if (!role) {
                this.logger.error(`Role ${userData.role} not found for user ${userData.email}`);
                continue;
            }

            if (!existing) {
                const user = await this.userService.create({
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    email: userData.email,
                    password_hash,
                    status: UserStatus.ACTIVE,
                    is_verified: true,
                    is_deleted: false,
                });
                await this.userService.assignRoles(user._id.toString(), [(role as any)._id.toString()]);
                this.logger.log(`Seeded user: ${userData.email}`);
            } else {
                // Verify/update existing
                await this.userService.updateById((existing as any)._id.toString(), {
                    password_hash,
                    status: UserStatus.ACTIVE,
                    is_verified: true,
                    is_deleted: false,
                });
                await this.userService.assignRoles((existing as any)._id.toString(), [(role as any)._id.toString()]);
            }
        }
    }

    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
