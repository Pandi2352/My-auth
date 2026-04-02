import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InAppNotification, InAppNotificationDocument, NotificationType } from './schemas/in-app-notification.schema.js';

@Injectable()
export class InAppNotificationService {
    constructor(
        @InjectModel(InAppNotification.name)
        private notifModel: Model<InAppNotificationDocument>,
    ) {}

    async create(data: {
        user_id: string;
        title: string;
        message: string;
        type?: NotificationType;
        link?: string;
    }): Promise<InAppNotificationDocument> {
        return this.notifModel.create({
            user_id: new Types.ObjectId(data.user_id),
            title: data.title,
            message: data.message,
            type: data.type || NotificationType.INFO,
            link: data.link,
        });
    }

    /** Broadcast to multiple users */
    async createMany(userIds: string[], data: {
        title: string;
        message: string;
        type?: NotificationType;
        link?: string;
    }): Promise<void> {
        const docs = userIds.map((uid) => ({
            user_id: new Types.ObjectId(uid),
            title: data.title,
            message: data.message,
            type: data.type || NotificationType.INFO,
            link: data.link,
        }));
        await this.notifModel.insertMany(docs);
    }

    async getForUser(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [notifications, total] = await Promise.all([
            this.notifModel
                .find({ user_id: new Types.ObjectId(userId) })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.notifModel.countDocuments({ user_id: new Types.ObjectId(userId) }),
        ]);

        return {
            notifications,
            meta_data: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        };
    }

    async getUnreadCount(userId: string): Promise<number> {
        return this.notifModel.countDocuments({
            user_id: new Types.ObjectId(userId),
            is_read: false,
        });
    }

    async markAsRead(userId: string, notificationId: string): Promise<void> {
        await this.notifModel.updateOne(
            { _id: notificationId, user_id: new Types.ObjectId(userId) },
            { $set: { is_read: true } },
        );
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.notifModel.updateMany(
            { user_id: new Types.ObjectId(userId), is_read: false },
            { $set: { is_read: true } },
        );
    }

    async delete(userId: string, notificationId: string): Promise<void> {
        await this.notifModel.deleteOne({
            _id: notificationId,
            user_id: new Types.ObjectId(userId),
        });
    }

    async deleteAll(userId: string): Promise<void> {
        await this.notifModel.deleteMany({ user_id: new Types.ObjectId(userId) });
    }

    async performAction(userId: string, id: string, result: 'approved' | 'rejected') {
        const notification = await this.notifModel.findOne({
            _id: id,
            user_id: new Types.ObjectId(userId),
        });

        if (!notification) {
            throw new Error('Notification not found');
        }

        if (notification.is_action_taken) {
            throw new Error('Action already taken on this notification');
        }

        // Logic for what happens when approved/rejected would go here
        // For now, we update the notification status
        await this.notifModel.updateOne(
            { _id: id },
            {
                $set: {
                    is_action_taken: true,
                    action_result: result,
                    is_read: true,
                },
            },
        );

        return {
            success: true,
            message: `Request ${result} successfully`,
            result,
        };
    }
}
