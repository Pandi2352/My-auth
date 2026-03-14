import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AdvertisementDocument = HydratedDocument<Advertisement>;

export enum AdPosition {
    HEADER = 'header',
    SIDEBAR = 'sidebar',
    CONTENT_TOP = 'content_top',
    CONTENT_BOTTOM = 'content_bottom',
    FOOTER = 'footer',
    POPUP = 'popup',
}

export enum AdType {
    IMAGE = 'image',
    HTML = 'html',
    SCRIPT = 'script',
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Advertisement {
    @Prop({ required: true, trim: true })
    title: string;

    @Prop({ enum: AdType, default: AdType.IMAGE })
    type: AdType;

    @Prop({ enum: AdPosition, required: true })
    position: AdPosition;

    /** For IMAGE type: the banner image URL */
    @Prop()
    image_url: string;

    /** Destination URL when user clicks the ad */
    @Prop()
    link_url: string;

    /** For HTML type: raw HTML content */
    @Prop()
    html_content: string;

    /** For SCRIPT type: third-party ad script (e.g., AdSense snippet) */
    @Prop()
    script_content: string;

    /** Alt text for image ads */
    @Prop()
    alt_text: string;

    /** Display priority — higher = shown first */
    @Prop({ default: 0 })
    priority: number;

    @Prop({ default: true })
    is_active: boolean;

    /** Schedule: only show after this date */
    @Prop()
    start_date: Date;

    /** Schedule: stop showing after this date */
    @Prop()
    end_date: Date;

    /** Tracking */
    @Prop({ default: 0 })
    impressions: number;

    @Prop({ default: 0 })
    clicks: number;

    /** Optional: restrict to specific pages (empty = all pages) */
    @Prop({ type: [String], default: [] })
    target_pages: string[];

    @Prop()
    created_at: Date;

    @Prop()
    updated_at: Date;
}

export const AdvertisementSchema = SchemaFactory.createForClass(Advertisement);
