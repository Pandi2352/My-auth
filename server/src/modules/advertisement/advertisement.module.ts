import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Advertisement, AdvertisementSchema } from './schemas/advertisement.schema.js';
import { AdvertisementService } from './advertisement.service.js';
import { AdvertisementController, PublicAdController } from './advertisement.controller.js';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Advertisement.name, schema: AdvertisementSchema }]),
    ],
    controllers: [AdvertisementController, PublicAdController],
    providers: [AdvertisementService],
    exports: [AdvertisementService],
})
export class AdvertisementModule {}
