import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User, UserDocument } from '../user/schemas/user.schema.js';
import { LoginAttempt, LoginAttemptDocument } from '../session/schemas/login-attempt.schema.js';
import { Session, SessionDocument } from '../session/schemas/session.schema.js';
import { AnalyticsSummary, AnalyticsSummaryDocument } from './schemas/analytics-summary.schema.js';

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(LoginAttempt.name) private loginAttemptModel: Model<LoginAttemptDocument>,
        @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
        @InjectModel(AnalyticsSummary.name) private summaryModel: Model<AnalyticsSummaryDocument>,
    ) {}

    // ── Total Users Count ────────────────────────────────────

    async getTotalUsers() {
        const [total, verified, unverified, deleted] = await Promise.all([
            this.userModel.countDocuments({ is_deleted: { $ne: true } }),
            this.userModel.countDocuments({ is_deleted: { $ne: true }, is_verified: true }),
            this.userModel.countDocuments({ is_deleted: { $ne: true }, is_verified: false }),
            this.userModel.countDocuments({ is_deleted: true }),
        ]);

        return { total, verified, unverified, deleted };
    }

    // ── Active Users Count ───────────────────────────────────

    async getActiveUsers() {
        const now = new Date();
        const day1 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [active_24h, active_7d, active_30d, active_sessions] = await Promise.all([
            this.userModel.countDocuments({ last_login_at: { $gte: day1 }, is_deleted: { $ne: true } }),
            this.userModel.countDocuments({ last_login_at: { $gte: day7 }, is_deleted: { $ne: true } }),
            this.userModel.countDocuments({ last_login_at: { $gte: day30 }, is_deleted: { $ne: true } }),
            this.sessionModel.countDocuments({ is_active: true, expires_at: { $gt: now } }),
        ]);

        return { active_24h, active_7d, active_30d, active_sessions };
    }

    // ── Users by Status ──────────────────────────────────────

    async getUsersByStatus() {
        return this.userModel.aggregate([
            { $match: { is_deleted: { $ne: true } } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $project: { status: '$_id', count: 1, _id: 0 } },
        ]);
    }

    // ── New Users Growth (per day/week/month) ────────────────

    async getUserGrowth(period: string = 'day', days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        let groupBy: any;
        switch (period) {
            case 'week':
                groupBy = { $isoWeek: '$created_at' };
                break;
            case 'month':
                groupBy = { $month: '$created_at' };
                break;
            default: // day
                groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } };
        }

        const yearGroup = period !== 'day'
            ? { year: { $year: '$created_at' }, period: groupBy }
            : { period: groupBy };

        return this.userModel.aggregate([
            { $match: { created_at: { $gte: startDate } } },
            {
                $group: {
                    _id: yearGroup,
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.period': 1, '_id.year': 1, '_id': 1 } },
            {
                $project: {
                    _id: 0,
                    period: period === 'day' ? '$_id.period' : { $concat: [{ $toString: '$_id.year' }, '-', { $toString: '$_id.period' }] },
                    count: 1,
                },
            },
        ]);
    }

    // ── Login Activity Over Time ─────────────────────────────

    async getLoginActivity(days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return this.loginAttemptModel.aggregate([
            { $match: { created_at: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
                        success: '$success',
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.date': 1 } },
            {
                $group: {
                    _id: '$_id.date',
                    successful: {
                        $sum: { $cond: [{ $eq: ['$_id.success', true] }, '$count', 0] },
                    },
                    failed: {
                        $sum: { $cond: [{ $eq: ['$_id.success', false] }, '$count', 0] },
                    },
                    total: { $sum: '$count' },
                },
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    _id: 0,
                    date: '$_id',
                    successful: 1,
                    failed: 1,
                    total: 1,
                },
            },
        ]);
    }

    // ── Role Distribution ────────────────────────────────────

    async getRoleDistribution() {
        return this.userModel.aggregate([
            { $match: { is_deleted: { $ne: true } } },
            { $unwind: '$roles' },
            {
                $lookup: {
                    from: 'roles',
                    localField: 'roles',
                    foreignField: '_id',
                    as: 'role',
                },
            },
            { $unwind: '$role' },
            {
                $group: {
                    _id: { slug: '$role.slug', name: '$role.name' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            {
                $project: {
                    _id: 0,
                    role_slug: '$_id.slug',
                    role_name: '$_id.name',
                    count: 1,
                },
            },
        ]);
    }

    // ── User Growth Chart Data ───────────────────────────────

    async getUserChartData(days: number = 90) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const dailyNew = await this.userModel.aggregate([
            { $match: { created_at: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
                    new_users: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const baseCount = await this.userModel.countDocuments({
            created_at: { $lt: startDate },
        });

        let cumulative = baseCount;
        const chart = dailyNew.map((d) => {
            cumulative += d.new_users;
            return {
                date: d._id,
                new_users: d.new_users,
                total_users: cumulative,
            };
        });

        return {
            period_days: days,
            start_date: startDate.toISOString().split('T')[0],
            base_count: baseCount,
            chart,
        };
    }

    // ── Dashboard Overview ───────────────────────────────────

    async getDashboardOverview() {
        const [totalUsers, activeUsers, statusBreakdown, roleDistribution] = await Promise.all([
            this.getTotalUsers(),
            this.getActiveUsers(),
            this.getUsersByStatus(),
            this.getRoleDistribution(),
        ]);

        return {
            users: totalUsers,
            activity: activeUsers,
            status_breakdown: statusBreakdown,
            role_distribution: roleDistribution,
        };
    }

    // ── Daily Data Aggregation ───────────────────────────────

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleDailyAggregation() {
        this.logger.log('Starting daily analytics aggregation...');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];

        try {
            const [overview, roleDistribution] = await Promise.all([
                this.getDashboardOverview(),
                this.getRoleDistribution(),
            ]);

            const loginStats = await this.loginAttemptModel.aggregate([
                { $match: { created_at: { $gte: new Date(dateStr) } } },
                { $group: { _id: '$success', count: { $sum: 1 } } }
            ]);

            const logins_success = loginStats.find(s => s._id === true)?.count || 0;
            const logins_failed = loginStats.find(s => s._id === false)?.count || 0;

            await this.summaryModel.updateOne(
                { date: dateStr },
                {
                    $set: {
                        users: overview.users,
                        activity: {
                            ...overview.activity,
                            logins_success,
                            logins_failed,
                        },
                        role_distribution: roleDistribution,
                    },
                },
                { upsert: true }
            );

            this.logger.log(`Aggregated analytics for ${dateStr}`);
        } catch (error) {
            this.logger.error('Failed to aggregate analytics:', error);
        }
    }

    // ── Summarized History for Large Ranges ──────────────────

    async getSummarizedHistory(days: number = 365) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const dateStr = startDate.toISOString().split('T')[0];

        return this.summaryModel.find({ date: { $gte: dateStr } }).sort({ date: 1 }).lean();
    }

    // ── Linear Regression for Prediction ─────────────────────

    async getChurnPrediction() {
        const summaries = await this.summaryModel.find().sort({ date: -1 }).limit(14).lean();
        if (summaries.length < 5) return { prediction: 'insufficient_data' };

        const points = summaries.reverse().map((s, i) => ({ x: i, y: s.activity.active_24h }));
        const n = points.length;
        
        const sumX = points.reduce((acc, p) => acc + p.x, 0);
        const sumY = points.reduce((acc, p) => acc + p.y, 0);
        const sumXY = points.reduce((acc, p) => acc + p.x * p.y, 0);
        const sumXX = points.reduce((acc, p) => acc + p.x * p.x, 0);

        const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const b = (sumY - m * sumX) / n;

        const forecast: Array<{ day: number; predicted_active: number }> = [];
        for (let i = n; i < n + 7; i++) {
            forecast.push({
                day: i - n + 1,
                predicted_active: Math.max(0, Math.round(m * i + b)),
            });
        }

        const currentActive = points[n - 1].y;
        const forecastedActive = forecast[6].predicted_active;
        const trend = m > 0 ? 'increasing' : m < 0 ? 'decreasing' : 'stable';
        const churn_risk = m < -0.5 ? 'high' : m < 0 ? 'medium' : 'low';

        return {
            trend,
            churn_risk,
            slope: m,
            intercept: b,
            current_active: currentActive,
            forecast_7d: forecastedActive,
            full_forecast: forecast,
        };
    }
}
