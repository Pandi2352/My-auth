import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemConfig, SystemConfigSchema } from './schemas/system-config.schema.js';
import { SystemConfigService } from './system-config.service.js';
import { SystemConfigController } from './system-config.controller.js';
import { PublicConfigController } from './public-config.controller.js';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: SystemConfig.name, schema: SystemConfigSchema },
        ]),
    ],
    controllers: [SystemConfigController, PublicConfigController],
    providers: [SystemConfigService],
    exports: [SystemConfigService],
})
export class SystemConfigModule {}
