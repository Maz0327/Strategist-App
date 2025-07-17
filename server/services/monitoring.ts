import { debugLogger } from './debug-logger';

interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  timestamp: number;
  success: boolean;
  cacheHit?: boolean;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000;
  private readonly slowThreshold = 5000; // 5 seconds
  private readonly criticalThreshold = 10000; // 10 seconds

  logRequest(endpoint: string, method: string, duration: number, success: boolean = true, cacheHit: boolean = false): void {
    const metric: PerformanceMetric = {
      endpoint,
      method,
      duration,
      timestamp: Date.now(),
      success,
      cacheHit
    };

    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log performance issues
    if (duration > this.criticalThreshold) {
      debugLogger.error(`CRITICAL: ${method} ${endpoint} took ${duration}ms`);
      this.sendAlert('critical', endpoint, method, duration);
    } else if (duration > this.slowThreshold) {
      debugLogger.warn(`SLOW: ${method} ${endpoint} took ${duration}ms`);
      this.sendAlert('slow', endpoint, method, duration);
    }

    // Log cache performance
    if (cacheHit) {
      debugLogger.info(`Cache hit: ${method} ${endpoint} (${duration}ms)`);
    }
  }

  getAverageResponseTime(endpoint?: string): number {
    const filteredMetrics = endpoint 
      ? this.metrics.filter(m => m.endpoint === endpoint)
      : this.metrics;
    
    if (filteredMetrics.length === 0) return 0;
    
    const total = filteredMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / filteredMetrics.length;
  }

  getErrorRate(endpoint?: string): number {
    const filteredMetrics = endpoint 
      ? this.metrics.filter(m => m.endpoint === endpoint)
      : this.metrics;
    
    if (filteredMetrics.length === 0) return 0;
    
    const errors = filteredMetrics.filter(m => !m.success).length;
    return (errors / filteredMetrics.length) * 100;
  }

  getCacheHitRate(endpoint?: string): number {
    const filteredMetrics = endpoint 
      ? this.metrics.filter(m => m.endpoint === endpoint)
      : this.metrics;
    
    if (filteredMetrics.length === 0) return 0;
    
    const cacheHits = filteredMetrics.filter(m => m.cacheHit).length;
    return (cacheHits / filteredMetrics.length) * 100;
  }

  getSlowRequests(threshold: number = this.slowThreshold): PerformanceMetric[] {
    return this.metrics.filter(m => m.duration > threshold);
  }

  getStats() {
    const recentMetrics = this.metrics.filter(m => Date.now() - m.timestamp < 60000); // Last minute
    
    return {
      totalRequests: this.metrics.length,
      recentRequests: recentMetrics.length,
      averageResponseTime: this.getAverageResponseTime(),
      errorRate: this.getErrorRate(),
      cacheHitRate: this.getCacheHitRate(),
      slowRequests: this.getSlowRequests().length,
      criticalRequests: this.getSlowRequests(this.criticalThreshold).length
    };
  }

  private sendAlert(level: 'slow' | 'critical', endpoint: string, method: string, duration: number): void {
    // In production, this would send to monitoring service (e.g., Sentry, DataDog)
    const message = `${level.toUpperCase()}: ${method} ${endpoint} took ${duration}ms`;
    console.warn(`[ALERT] ${message}`);
    
    // TODO: Implement actual alerting (email, webhook, etc.)
  }

  reset(): void {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Middleware for automatic performance tracking
export function trackPerformance(req: any, res: any, next: any) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const success = res.statusCode < 400;
    
    performanceMonitor.logRequest(
      req.path,
      req.method,
      duration,
      success
    );
  });
  
  next();
}