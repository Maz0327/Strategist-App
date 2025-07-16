import { debugLogger } from './debug-logger';

interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  timestamp: number;
  userId?: number;
  status: number;
  memoryUsage: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics
  private readonly slowRequestThreshold = 2000; // 2 seconds

  recordRequest(endpoint: string, method: string, duration: number, status: number, userId?: number) {
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    
    const metric: PerformanceMetric = {
      endpoint,
      method,
      duration,
      timestamp: Date.now(),
      userId,
      status,
      memoryUsage
    };

    this.metrics.push(metric);
    
    // Keep only the last maxMetrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow requests
    if (duration > this.slowRequestThreshold) {
      debugLogger.warn(`Slow request detected: ${method} ${endpoint} took ${duration}ms`, {
        duration,
        endpoint,
        method,
        userId,
        memoryUsage
      });
    }
  }

  getMetrics() {
    return {
      totalRequests: this.metrics.length,
      avgResponseTime: this.metrics.length > 0 ? 
        Math.round(this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length) : 0,
      slowRequests: this.metrics.filter(m => m.duration > this.slowRequestThreshold).length,
      errorRate: this.metrics.length > 0 ? 
        Math.round((this.metrics.filter(m => m.status >= 400).length / this.metrics.length) * 100) : 0,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      uptime: process.uptime(),
      recentRequests: this.metrics.slice(-50).map(m => ({
        endpoint: m.endpoint,
        method: m.method,
        duration: m.duration,
        status: m.status,
        timestamp: new Date(m.timestamp).toISOString()
      }))
    };
  }

  getEndpointStats() {
    const endpointStats = new Map<string, { count: number; avgDuration: number; errorCount: number }>();
    
    this.metrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      const existing = endpointStats.get(key) || { count: 0, avgDuration: 0, errorCount: 0 };
      
      existing.count++;
      existing.avgDuration = (existing.avgDuration * (existing.count - 1) + metric.duration) / existing.count;
      if (metric.status >= 400) {
        existing.errorCount++;
      }
      
      endpointStats.set(key, existing);
    });

    return Array.from(endpointStats.entries()).map(([endpoint, stats]) => ({
      endpoint,
      ...stats,
      avgDuration: Math.round(stats.avgDuration),
      errorRate: Math.round((stats.errorCount / stats.count) * 100)
    }));
  }

  clearMetrics() {
    this.metrics = [];
    debugLogger.info('Performance metrics cleared');
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Express middleware for automatic performance monitoring
export const performanceMiddleware = (req: any, res: any, next: any) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    performanceMonitor.recordRequest(
      req.route?.path || req.path,
      req.method,
      duration,
      res.statusCode,
      req.session?.userId
    );
  });

  next();
};