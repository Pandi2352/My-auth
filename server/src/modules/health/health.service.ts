import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class HealthService {
    private readonly startTime = Date.now();

    constructor(
        @InjectConnection() private readonly connection: Connection,
    ) {}

    getHealth() {
        const uptimeSec = Math.floor((Date.now() - this.startTime) / 1000);
        const memUsage = process.memoryUsage();

        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime_seconds: uptimeSec,
            uptime_human: this.formatUptime(uptimeSec),
            environment: process.env.NODE_ENV || 'development',
            node_version: process.version,
            memory: {
                rss_mb: +(memUsage.rss / 1024 / 1024).toFixed(2),
                heap_used_mb: +(memUsage.heapUsed / 1024 / 1024).toFixed(2),
                heap_total_mb: +(memUsage.heapTotal / 1024 / 1024).toFixed(2),
                external_mb: +(memUsage.external / 1024 / 1024).toFixed(2),
            },
        };
    }

    async getReadiness() {
        const checks: Record<string, { status: string; latency_ms?: number; error?: string }> = {};

        // MongoDB check
        const dbStart = Date.now();
        try {
            const state = this.connection.readyState;
            // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
            if (state === 1) {
                await this.connection.db!.admin().ping();
                checks.mongodb = { status: 'up', latency_ms: Date.now() - dbStart };
            } else {
                checks.mongodb = { status: 'down', error: `readyState=${state}` };
            }
        } catch (err: any) {
            checks.mongodb = { status: 'down', latency_ms: Date.now() - dbStart, error: err.message };
        }

        const allUp = Object.values(checks).every((c) => c.status === 'up');

        return {
            status: allUp ? 'ready' : 'degraded',
            timestamp: new Date().toISOString(),
            checks,
        };
    }

    private formatUptime(seconds: number): string {
        const d = Math.floor(seconds / 86400);
        const h = Math.floor((seconds % 86400) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        const parts: string[] = [];
        if (d > 0) parts.push(`${d}d`);
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}m`);
        parts.push(`${s}s`);
        return parts.join(' ');
    }
}
