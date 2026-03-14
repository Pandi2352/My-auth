import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema.js';
import { LoginAttempt, LoginAttemptDocument } from '../session/schemas/login-attempt.schema.js';
import { Session, SessionDocument } from '../session/schemas/session.schema.js';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(LoginAttempt.name) private loginAttemptModel: Model<LoginAttemptDocument>,
        @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
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

        // Cumulative user growth
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

        // Get total users before start date for cumulative count
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
}
