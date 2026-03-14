import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { jwtConfig } from '../../config/jwt.config.js';

@WebSocketGateway({
    cors: { origin: '*' },
    namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(NotificationGateway.name);
    private userSockets = new Map<string, Set<string>>();

    constructor(private readonly jwtService: JwtService) {}

    async handleConnection(client: Socket) {
        try {
            const token =
                client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');

            if (!token) {
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token, {
                secret: jwtConfig().access_secret,
            });

            const userId = payload.sub;
            client.data.userId = userId;

            // Track socket
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId)!.add(client.id);

            client.join(`user:${userId}`);
            this.logger.debug(`Client connected: ${client.id} (user: ${userId})`);
        } catch {
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.data?.userId;
        if (userId) {
            this.userSockets.get(userId)?.delete(client.id);
            if (this.userSockets.get(userId)?.size === 0) {
                this.userSockets.delete(userId);
            }
        }
        this.logger.debug(`Client disconnected: ${client.id}`);
    }

    /** Send notification to a specific user */
    sendToUser(userId: string, notification: any) {
        this.server.to(`user:${userId}`).emit('notification', notification);
    }

    /** Send to all connected users */
    broadcast(notification: any) {
        this.server.emit('notification', notification);
    }

    isUserOnline(userId: string): boolean {
        return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
    }
}
