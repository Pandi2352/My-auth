import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AnalyticsSummaryDocument = AnalyticsSummary & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'analytics_summaries',
})
export class AnalyticsSummary {
  @Prop({ required: true, unique: true, index: true })
  date: string; // YYYY-MM-DD

  @Prop({ type: Object, required: true })
  users: {
    total: number;
    verified: number;
    unverified: number;
    deleted: number;
  };

  @Prop({ type: Object, required: true })
  activity: {
    active_24h: number;
    active_7d: number;
    active_30d: number;
    active_sessions: number;
    logins_success: number;
    logins_failed: number;
  };

  @Prop({ type: [Object], required: true })
  role_distribution: Array<{
    role_slug: string;
    role_name: string;
    count: number;
  }>;
}

export const AnalyticsSummarySchema = SchemaFactory.createForClass(AnalyticsSummary);
