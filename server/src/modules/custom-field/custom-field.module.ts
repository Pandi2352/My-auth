import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomField, CustomFieldSchema } from './schemas/custom-field.schema.js';
import { CustomFieldService } from './custom-field.service.js';
import { CustomFieldController } from './custom-field.controller.js';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: CustomField.name, schema: CustomFieldSchema }]),
    ],
    controllers: [CustomFieldController],
    providers: [CustomFieldService],
    exports: [CustomFieldService],
})
export class CustomFieldModule {}
