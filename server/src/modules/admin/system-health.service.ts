import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Server } from 'socket.io';
import { WebSocketServer, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

export interface HealthMetric {
  cpu: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };
  eventLoopLag: number;
  rps: number;
  avgLatency: number;
  uptime: number;
  timestamp: string;
}

@Injectable()
export class SystemHealthMetricsService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  private reqCount: number = 0;
  private totalLatency: number = 0;
  private lastTime: number = Date.now();
  private lastLagTime: number = Date.now();
  private currentLag: number = 0;

  constructor() {
    this.startLagMonitor();
  }

  onModuleInit() {
    this.timer = setInterval(() => this.collectAndEmit(), 3000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  recordRequest(latencyMs: number) {
    this.reqCount++;
    this.totalLatency += latencyMs;
  }

  private startLagMonitor() {
    const check = () => {
      const start = Date.now();
      setImmediate(() => {
        this.currentLag = Date.now() - start;
        setTimeout(check, 1000);
      });
    };
    check();
  }

  private getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = Date.now();
      
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = Date.now();
        const elapsedMs = endTime - startTime;
        const totalUsageMs = (endUsage.user + endUsage.system) / 1000;
        const percent = (totalUsageMs / elapsedMs) * 100;
        resolve(Math.min(100, Math.round(percent * 10) / 10));
      }, 100);
    });
  }

  private async collectAndEmit() {
    const memory = process.memoryUsage();
    const cpu = await this.getCpuUsage();
    const now = Date.now();
    const elapsedSec = (now - this.lastTime) / 1000;
    
    const rps = Math.round(this.reqCount / elapsedSec);
    const avgLatency = this.reqCount > 0 ? Math.round(this.totalLatency / this.reqCount) : 0;
    
    const metric: HealthMetric = {
      cpu,
      memory: {
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
        rss: Math.round(memory.rss / 1024 / 1024),
        external: Math.round(memory.external / 1024 / 1024),
      },
      eventLoopLag: this.currentLag,
      rps,
      avgLatency,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };

    // Reset counters
    this.reqCount = 0;
    this.totalLatency = 0;
    this.lastTime = now;

    // Emit via global gateway if needed, but we can also use a dedicated gateway
    return metric;
  }
}

@WebSocketGateway({
  namespace: 'health',
  cors: { origin: '*' },
})
export class SystemHealthGateway {
  @WebSocketServer()
  server: Server;

  constructor(private healthService: SystemHealthMetricsService) {
    setInterval(async () => {
      const metrics = await (this.healthService as any).collectAndEmit();
      this.server.emit('metrics_update', metrics);
    }, 3000);
  }
}
