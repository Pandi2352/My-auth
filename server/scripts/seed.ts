import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UserService } from '../src/modules/user/user.service';
import { RoleService } from '../src/modules/role/role.service';
import { BcryptPasswordHelper } from '../src/utils/BcryptPasswordHelper';
import { UserStatus } from '../src/common/enums/user-status.enum';
import { faker } from '@faker-js/faker';
import { Logger } from '@nestjs/common';

async function generateDummyUsers() {
  const logger = new Logger('FakerSeeder');
  const app = await NestFactory.createApplicationContext(AppModule);
  const userService = app.get(UserService);
  const roleService = app.get(RoleService);

  logger.log('Starting dummy user generation (1,000 users)...');

  const userRole = await roleService.findBySlug('user');
  if (!userRole) {
    logger.error('Role "user" not found. Please run seed first.');
    await app.close();
    return;
  }

  const roleId = (userRole as any)._id.toString();
  const passwordHash = await BcryptPasswordHelper.Instance.generateBcryptPassword('DummyPass123!');

  const BATCH_SIZE = 100;
  const TOTAL_USERS = 1000;

  for (let i = 0; i < TOTAL_USERS; i += BATCH_SIZE) {
    const usersToCreate: Promise<any>[] = [];
    for (let j = 0; j < BATCH_SIZE; j++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName }).toLowerCase();

      usersToCreate.push(
        userService.create({
          first_name: firstName,
          last_name: lastName,
          email: email,
          password_hash: passwordHash,
          status: UserStatus.ACTIVE,
          is_verified: true,
          is_deleted: false,
          phone: faker.phone.number(),
          avatar_url: faker.image.avatar(),
        }).then(user => userService.assignRoles(user._id.toString(), [roleId]))
      );
    }
    
    await Promise.all(usersToCreate);
    logger.log(`Progress: ${i + BATCH_SIZE}/${TOTAL_USERS} users generated.`);
  }

  logger.log('Successfully generated 1,000 dummy users.');
  await app.close();
}

generateDummyUsers().catch(err => {
  console.error('Failed to generate users:', err);
  process.exit(1);
});
