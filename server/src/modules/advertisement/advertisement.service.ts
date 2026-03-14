import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Advertisement, AdvertisementDocument, AdPosition } from './schemas/advertisement.schema.js';
import { CreateAdDto } from './dto/create-ad.dto.js';
import { UpdateAdDto } from './dto/update-ad.dto.js';
import { ErrorEntity } from '../../utils/reponseUtils/ErrorEntity.js';
import { HttpStatus } from '../../utils/reponseUtils/httpStatus.js';

@Injectable()
export class AdvertisementService {
    constructor(
        @InjectModel(Advertisement.name) private adModel: Model<AdvertisementDocument>,
    ) {}

    async create(dto: CreateAdDto): Promise<AdvertisementDocument> {
        return this.adModel.create(dto);
    }

    async findAll(): Promise<AdvertisementDocument[]> {
        return this.adModel.find().sort({ position: 1, priority: -1 }).exec();
    }

    async findById(id: string): Promise<AdvertisementDocument> {
        const ad = await this.adModel.findById(id).exec();
        if (!ad) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'ad_not_found',
                error_description: 'Advertisement not found',
            });
        }
        return ad;
    }

    async update(id: string, dto: UpdateAdDto): Promise<AdvertisementDocument> {
        const ad = await this.adModel.findByIdAndUpdate(id, dto, { new: true }).exec();
        if (!ad) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'ad_not_found',
                error_description: 'Advertisement not found',
            });
        }
        return ad;
    }

    async toggle(id: string): Promise<AdvertisementDocument> {
        const ad = await this.findById(id);
        ad.is_active = !ad.is_active;
        return ad.save();
    }

    async delete(id: string): Promise<void> {
        const result = await this.adModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new ErrorEntity({
                http_code: HttpStatus.NOT_FOUND,
                error: 'ad_not_found',
                error_description: 'Advertisement not found',
            });
        }
    }

    /**
     * Public: get active ads for a position, respecting schedule and target pages.
     */
    async getActiveAds(position: AdPosition, page?: string): Promise<AdvertisementDocument[]> {
        const now = new Date();

        const query: any = {
            position,
            is_active: true,
            $or: [{ start_date: { $exists: false } }, { start_date: null }, { start_date: { $lte: now } }],
        };

        const ads = await this.adModel
            .find(query)
            .sort({ priority: -1 })
            .exec();

        return ads.filter((ad) => {
            // Check end_date
            if (ad.end_date && new Date(ad.end_date) < now) return false;
            // Check target_pages (empty = all pages)
            if (ad.target_pages && ad.target_pages.length > 0 && page) {
                return ad.target_pages.some((p) => page.startsWith(p));
            }
            return true;
        });
    }

    /**
     * Track an impression
     */
    async trackImpression(id: string): Promise<void> {
        await this.adModel.findByIdAndUpdate(id, { $inc: { impressions: 1 } }).exec();
    }

    /**
     * Track a click
     */
    async trackClick(id: string): Promise<void> {
        await this.adModel.findByIdAndUpdate(id, { $inc: { clicks: 1 } }).exec();
    }
}
