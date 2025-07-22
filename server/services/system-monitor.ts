import { debugLogger } from './debug-logger';
import { storage } from '../storage';

/**
 * System Monitoring Service
 * Tracks system health, performance metrics, and error patterns for admin dashboard
 */

export interface SystemMetrics {
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  requestCount: number;
  errorCount: number;
  slowRequestCount: number;
  averageResponseTime: number;
  databaseConnections: number;
  cacheHitRate: number;
  lastErrors: ErrorRecord[];
  slowRequests: SlowRequest[];
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export interface ErrorRecord {
  timestamp: Date;
  method: string;
  path: string;
  statusCode: number;
  error: string;
  userId?: number;
  duration: number;
  userAgent?: string;
}

export interface SlowRequest {
  timestamp: Date;
  method: string;
  path: string;
  duration: number;
  userId?: number;
  statusCode: number;
}

class SystemMonitorService {
  private startTime = Date.now();
  private requestCount = 0;
  private errorCount = 0;
  private slowRequestCount = 0;
  private responseTimes: number[] = [];
  private recentErrors: ErrorRecord[] = [];
  private slowRequests: SlowRequest[] = [];
  private readonly SLOW_REQUEST_THRESHOLD = 2000; // 2 seconds
  private readonly MAX_STORED_RECORDS = 100;

  /**
   * Records a completed request with performance metrics
   */
  recordRequest(method: string, path: string, statusCode: number, duration: number, userId?: number, userAgent?: string, error?: string) {
    this.requestCount++;
    this.responseTimes.push(duration);
    
    // Keep only last 1000 response times for rolling average
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }

    // Record errors (4xx and 5xx responses)
    if (statusCode >= 400) {
      this.errorCount++;
      this.recentErrors.unshift({
        timestamp: new Date(),
        method,
        path,
        statusCode,
        error: error || 'Unknown error',
        userId,
        duration,
        userAgent
      });
      
      // Keep only recent errors
      if (this.recentErrors.length > this.MAX_STORED_RECORDS) {
        this.recentErrors = this.recentErrors.slice(0, this.MAX_STORED_RECORDS);
      }
    }

    // Record slow requests
    if (duration > this.SLOW_REQUEST_THRESHOLD) {
      this.slowRequestCount++;
      this.slowRequests.unshift({
        timestamp: new Date(),
        method,
        path,
        duration,
        userId,
        statusCode
      });
      
      // Keep only recent slow requests
      if (this.slowRequests.length > this.MAX_STORED_RECORDS) {
        this.slowRequests = this.slowRequests.slice(0, this.MAX_STORED_RECORDS);
      }
    }

    debugLogger.info('Request recorded', {
      method, path, statusCode, duration, userId,
      totalRequests: this.requestCount,
      totalErrors: this.errorCount
    });
  }

  /**
   * Get comprehensive system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const uptime = Date.now() - this.startTime;
    const memoryUsage = process.memoryUsage();
    const averageResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length 
      : 0;

    // Calculate cache hit rate (placeholder - would integrate with actual cache service)
    const cacheHitRate = 0.65; // 65% hit rate simulation

    // Determine system health
    const errorRate = this.requestCount > 0 ? this.errorCount / this.requestCount : 0;
    const systemHealth: 'healthy' | 'warning' | 'critical' = 
      errorRate > 0.1 ? 'critical' :
      errorRate > 0.05 || averageResponseTime > 3000 ? 'warning' : 
      'healthy';

    return {
      uptime,
      memoryUsage,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      slowRequestCount: this.slowRequestCount,
      averageResponseTime,
      databaseConnections: 1, // Single PostgreSQL connection
      cacheHitRate,
      lastErrors: this.recentErrors.slice(0, 20), // Last 20 errors
      slowRequests: this.slowRequests.slice(0, 20), // Last 20 slow requests
      systemHealth
    };
  }

  /**
   * Get detailed error analysis
   */
  getErrorAnalysis() {
    const errorsByPath = this.recentErrors.reduce((acc, error) => {
      acc[error.path] = (acc[error.path] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsByStatusCode = this.recentErrors.reduce((acc, error) => {
      acc[error.statusCode] = (acc[error.statusCode] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      totalErrors: this.errorCount,
      errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
      errorsByPath,
      errorsByStatusCode,
      recentErrors: this.recentErrors.slice(0, 50)
    };
  }

  /**
   * Get performance analysis
   */
  getPerformanceAnalysis() {
    const sortedTimes = [...this.responseTimes].sort((a, b) => a - b);
    const percentile95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
    const percentile99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;

    return {
      totalRequests: this.requestCount,
      averageResponseTime: this.responseTimes.length > 0 
        ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length 
        : 0,
      percentile95,
      percentile99,
      slowRequestCount: this.slowRequestCount,
      slowRequestRate: this.requestCount > 0 ? this.slowRequestCount / this.requestCount : 0,
      recentSlowRequests: this.slowRequests.slice(0, 20)
    };
  }

  /**
   * Reset all metrics (useful for testing or fresh starts)
   */
  reset() {
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
    this.slowRequestCount = 0;
    this.responseTimes = [];
    this.recentErrors = [];
    this.slowRequests = [];
    
    debugLogger.info('System monitor metrics reset');
  }
}

export const systemMonitor = new SystemMonitorService();
export default SystemMonitorService;