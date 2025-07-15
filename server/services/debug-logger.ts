import { Request, Response, NextFunction } from 'express';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  stack?: string;
  userId?: number;
  endpoint?: string;
  userAgent?: string;
  ip?: string;
}

class DebugLogger {
  private logs: LogEntry[] = [];
  private readonly maxLogs = 1000;

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    data?: any,
    req?: Request,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      stack: error?.stack,
      endpoint: req?.originalUrl,
      userAgent: req?.get('User-Agent'),
      ip: req?.ip || req?.connection?.remoteAddress,
      userId: (req as any)?.session?.userId
    };

    return entry;
  }

  private addLog(entry: LogEntry) {
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Also log to console for immediate visibility
    const logMessage = `[${entry.level.toUpperCase()}] ${entry.timestamp} - ${entry.message}`;
    
    switch (entry.level) {
      case 'error':
        console.error(logMessage, entry.data || '', entry.stack || '');
        break;
      case 'warn':
        console.warn(logMessage, entry.data || '');
        break;
      case 'debug':
        console.debug(logMessage, entry.data || '');
        break;
      default:
        console.log(logMessage, entry.data || '');
    }
  }

  info(message: string, data?: any, req?: Request) {
    const entry = this.createLogEntry('info', message, data, req);
    this.addLog(entry);
  }

  warn(message: string, data?: any, req?: Request) {
    const entry = this.createLogEntry('warn', message, data, req);
    this.addLog(entry);
  }

  error(message: string, error?: Error | any, req?: Request) {
    const entry = this.createLogEntry('error', message, error, req, error);
    this.addLog(entry);
  }

  debug(message: string, data?: any, req?: Request) {
    const entry = this.createLogEntry('debug', message, data, req);
    this.addLog(entry);
  }

  // API endpoint logging
  apiCall(req: Request, res: Response, responseTime: number, error?: Error) {
    const message = `${req.method} ${req.originalUrl} - ${res.statusCode} (${responseTime}ms)`;
    const data = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      body: req.body,
      query: req.query,
      params: req.params,
      error: error?.message
    };

    if (error || res.statusCode >= 400) {
      this.error(message, error || data, req);
    } else {
      this.info(message, data, req);
    }
    
    // Skip analytics tracking to prevent console errors
    // Analytics tables need to be set up first
  }

  // Database operation logging
  dbOperation(operation: string, table: string, data?: any, error?: Error, req?: Request) {
    const message = `DB ${operation} on ${table}`;
    const logData = { operation, table, data, error: error?.message };

    if (error) {
      this.error(message, error, req);
    } else {
      this.debug(message, logData, req);
    }
  }

  // External API logging
  externalAPI(service: string, endpoint: string, success: boolean, data?: any, error?: Error, req?: Request) {
    const message = `External API call to ${service} ${endpoint} - ${success ? 'SUCCESS' : 'FAILED'}`;
    const logData = { service, endpoint, success, data, error: error?.message };

    if (!success || error) {
      this.error(message, error || logData, req);
    } else {
      this.info(message, logData, req);
    }
  }

  // Get recent logs for debugging
  getRecentLogs(limit: number = 50, level?: LogEntry['level']) {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }

    return filteredLogs.slice(0, limit);
  }

  // Get error summary
  getErrorSummary() {
    const errors = this.logs.filter(log => log.level === 'error');
    const errorCounts: Record<string, number> = {};
    
    errors.forEach(error => {
      const key = error.endpoint || error.message;
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });

    return {
      totalErrors: errors.length,
      recentErrors: errors.slice(0, 10),
      errorCounts,
      errorsByEndpoint: this.groupBy(errors, 'endpoint'),
      errorsByUser: this.groupBy(errors, 'userId')
    };
  }

  // Performance monitoring
  getPerformanceMetrics() {
    const apiLogs = this.logs.filter(log => log.data?.responseTime);
    const responseTimes = apiLogs.map(log => log.data.responseTime);
    
    if (responseTimes.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        slowRequests: 0
      };
    }

    const sorted = responseTimes.sort((a, b) => a - b);
    const avg = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return {
      totalRequests: apiLogs.length,
      averageResponseTime: Math.round(avg),
      p95ResponseTime: p95 || 0,
      p99ResponseTime: p99 || 0,
      slowRequests: apiLogs.filter(log => log.data.responseTime > 1000).length
    };
  }

  private groupBy(items: LogEntry[], key: keyof LogEntry) {
    return items.reduce((groups, item) => {
      const group = String(item[key] || 'unknown');
      groups[group] = (groups[group] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);
  }

  // Clear logs (for maintenance)
  clearLogs() {
    this.logs = [];
    this.info('Debug logs cleared');
  }
}

export const debugLogger = new DebugLogger();

// Express middleware for automatic request logging
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log request start
  debugLogger.info(`Incoming request: ${req.method} ${req.originalUrl}`, {
    body: req.body,
    query: req.query,
    headers: req.headers
  }, req);

  // Override res.end to capture response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const responseTime = Date.now() - start;
    debugLogger.apiCall(req, res, responseTime);
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Global error handler
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  debugLogger.error(`Unhandled error: ${error.message}`, error, req);
  
  // Don't expose internal errors in production
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    error: isDev ? error.message : 'Internal server error',
    stack: isDev ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });
};