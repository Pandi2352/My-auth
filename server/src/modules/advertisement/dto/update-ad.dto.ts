import { PartialType } from '@nestjs/swagger';
import { CreateAdDto } from './create-ad.dto.js';

export class UpdateAdDto extends PartialType(CreateAdDto) {}
