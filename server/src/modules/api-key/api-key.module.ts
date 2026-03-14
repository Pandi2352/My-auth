import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiKey, ApiKeySchema } from './schemas/api-key.schema.js';
import { ApiKeyService } from './api-key.service.js';
import { ApiKeyController } from './api-key.controller.js';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ApiKey.name, schema: ApiKeySchema },
        ]),
    ],
    controllers: [ApiKeyController],
    providers: [ApiKeyService],
    exports: [ApiKeyService],
})
export class ApiKeyModule {}
