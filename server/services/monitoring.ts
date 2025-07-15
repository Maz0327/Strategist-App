import { debugLogger } from './debug-logger';
import { cacheService } from './cache-service';
import { backupService } from './backup-service';
import os from 'os';

export interface SystemMetrics {
  timestamp: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  system: {
    platform: string;
    arch: string;
    nodeVersion: string;
    totalMemory: number;
    freeMemory: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
  };
  database: {
    connected: boolean;
    poolSize?: number;
    activeConnections?: number;
  };
  services: {
    [key: string]: boolean;
  };
}

class MonitoringService {
  private metrics: SystemMetrics[] = [];
  private readonly maxMetricsHistory = 100;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring() {
    // Collect metrics every 60 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 60000);

    // Collect initial metrics
    this.collectMetrics();
  }

  private async collectMetrics() {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const cacheStats = cacheService.getStats();

      const metrics: SystemMetrics = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
          arrayBuffers: memoryUsage.arrayBuffers,
        },
        cpu: {
          usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
          loadAverage: os.loadavg(),
        },
        system: {
          platform: os.platform(),
          arch: os.arch(),
          nodeVersion: process.version,
          totalMemory: os.totalmem(),
          freeMemory: os.freemem(),
        },
        cache: {
          hits: cacheStats.hits,
          misses: cacheStats.misses,
          hitRate: cacheStats.hitRate,
          size: cacheStats.size,
        },
        database: {
          connected: await this.checkDatabaseHealth(),
        },
        services: await this.checkServiceHealth(),
      };

      this.metrics.push(metrics);

      // Keep only the last N metrics
      if (this.metrics.length > this.maxMetricsHistory) {
        this.metrics = this.metrics.slice(-this.maxMetricsHistory);
      }

      // Log warning if memory usage is high
      const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      if (memoryUsagePercent > 80) {
        debugLogger.warn('High memory usage detected', {
          memoryUsagePercent,
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
        });
      }

      // Log warning if CPU usage is high
      if (os.loadavg()[0] > 2) {
        debugLogger.warn('High CPU load detected', {
          loadAverage: os.loadavg(),
        });
      }

    } catch (error) {
      debugLogger.error('Error collecting metrics', error);
    }
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      // Simple database health check
      // In a real implementation, this would ping the database
      return process.env.DATABASE_URL ? true : false;
    } catch (error) {
      debugLogger.error('Database health check failed', error);
      return false;
    }
  }

  private async checkServiceHealth(): Promise<{ [key: string]: boolean }> {
    const services: { [key: string]: boolean } = {};

    // Check OpenAI service
    services.openai = !!process.env.OPENAI_API_KEY;

    // Check Reddit service
    services.reddit = !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET);

    // Check YouTube service
    services.youtube = !!process.env.YOUTUBE_API_KEY;

    // Check News services
    services.news = !!(process.env.NEWS_API_KEY || process.env.GNEWS_API_KEY);

    // Check Spotify service
    services.spotify = !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);

    return services;
  }

  public getCurrentMetrics(): SystemMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  public getMetricsHistory(limit: number = 24): SystemMetrics[] {
    return this.metrics.slice(-limit);
  }

  public getAverageMetrics(windowSizeMinutes: number = 60): Partial<SystemMetrics> {
    const windowSize = Math.min(windowSizeMinutes, this.metrics.length);
    const recentMetrics = this.metrics.slice(-windowSize);

    if (recentMetrics.length === 0) return {};

    const totals = recentMetrics.reduce((acc, metric) => {
      return {
        memory: {
          rss: acc.memory.rss + metric.memory.rss,
          heapUsed: acc.memory.heapUsed + metric.memory.heapUsed,
          heapTotal: acc.memory.heapTotal + metric.memory.heapTotal,
        },
        cpu: {
          usage: acc.cpu.usage + metric.cpu.usage,
          loadAverage: acc.cpu.loadAverage + metric.cpu.loadAverage[0],
        },
        cache: {
          hits: acc.cache.hits + metric.cache.hits,
          misses: acc.cache.misses + metric.cache.misses,
          hitRate: acc.cache.hitRate + metric.cache.hitRate,
        },
      };
    }, {
      memory: { rss: 0, heapUsed: 0, heapTotal: 0 },
      cpu: { usage: 0, loadAverage: 0 },
      cache: { hits: 0, misses: 0, hitRate: 0 },
    });

    const count = recentMetrics.length;

    return {
      memory: {
        rss: totals.memory.rss / count,
        heapUsed: totals.memory.heapUsed / count,
        heapTotal: totals.memory.heapTotal / count,
      },
      cpu: {
        usage: totals.cpu.usage / count,
        loadAverage: [totals.cpu.loadAverage / count],
      },
      cache: {
        hits: totals.cache.hits / count,
        misses: totals.cache.misses / count,
        hitRate: totals.cache.hitRate / count,
      },
    };
  }

  public async generateHealthReport(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
    metrics: SystemMetrics | null;
  }> {
    const currentMetrics = this.getCurrentMetrics();
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (!currentMetrics) {
      return {
        status: 'critical',
        issues: ['No metrics available'],
        recommendations: ['Restart monitoring service'],
        metrics: null,
      };
    }

    // Check memory usage
    const memoryUsagePercent = (currentMetrics.memory.heapUsed / currentMetrics.memory.heapTotal) * 100;
    if (memoryUsagePercent > 90) {
      issues.push('Critical memory usage (>90%)');
      recommendations.push('Consider increasing memory limits or optimizing memory usage');
      status = 'critical';
    } else if (memoryUsagePercent > 70) {
      issues.push('High memory usage (>70%)');
      recommendations.push('Monitor memory usage closely');
      status = 'warning';
    }

    // Check CPU usage
    if (currentMetrics.cpu.loadAverage[0] > 4) {
      issues.push('High CPU load');
      recommendations.push('Investigate CPU-intensive operations');
      status = status === 'critical' ? 'critical' : 'warning';
    }

    // Check cache hit rate
    if (currentMetrics.cache.hitRate < 0.5) {
      issues.push('Low cache hit rate');
      recommendations.push('Review caching strategy');
      status = status === 'critical' ? 'critical' : 'warning';
    }

    // Check database connectivity
    if (!currentMetrics.database.connected) {
      issues.push('Database connection failed');
      recommendations.push('Check database server status');
      status = 'critical';
    }

    // Check service availability
    const failedServices = Object.entries(currentMetrics.services)
      .filter(([_, healthy]) => !healthy)
      .map(([service, _]) => service);

    if (failedServices.length > 0) {
      issues.push(`Services unavailable: ${failedServices.join(', ')}`);
      recommendations.push('Check service configurations and API keys');
      status = status === 'critical' ? 'critical' : 'warning';
    }

    return {
      status,
      issues,
      recommendations,
      metrics: currentMetrics,
    };
  }

  public async createPerformanceReport(): Promise<{
    summary: string;
    metrics: any;
    trends: any;
    recommendations: string[];
  }> {
    const currentMetrics = this.getCurrentMetrics();
    const averageMetrics = this.getAverageMetrics(60);
    const healthReport = await this.generateHealthReport();

    return {
      summary: `System ${healthReport.status}. ${healthReport.issues.length} issues detected.`,
      metrics: {
        current: currentMetrics,
        average: averageMetrics,
      },
      trends: {
        memoryTrend: this.calculateTrend('memory.heapUsed'),
        cpuTrend: this.calculateTrend('cpu.usage'),
        cacheTrend: this.calculateTrend('cache.hitRate'),
      },
      recommendations: healthReport.recommendations,
    };
  }

  private calculateTrend(metricPath: string): 'increasing' | 'decreasing' | 'stable' {
    if (this.metrics.length < 2) return 'stable';

    const recent = this.metrics.slice(-10);
    const values = recent.map(metric => this.getNestedValue(metric, metricPath));
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  private getNestedValue(obj: any, path: string): number {
    return path.split('.').reduce((current, key) => current && current[key], obj) || 0;
  }

  public stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

export const monitoringService = new MonitoringService();