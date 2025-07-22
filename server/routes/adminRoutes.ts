import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../middleware/require-auth';
import { debugLogger } from '../services/debug-logger';

const router = Router();

// Validation schemas
const debugQuerySchema = z.object({
  limit: z.string().transform(val => parseInt(val) || 50).optional(),
  level: z.enum(['info', 'warn', 'error', 'debug']).optional()
});

// Debug and monitoring routes with consistent API responses and admin access
router.get("/debug/logs", requireAdmin, async (req, res) => {
  try {
    const result = debugQuerySchema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid query parameters',
        details: result.error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    const { limit = 50, level } = result.data;
    const logs = debugLogger.getRecentLogs(limit, level);
    res.json({ 
      success: true, 
      data: { logs, count: logs.length, level, limit }
    });
  } catch (error: any) {
    debugLogger.error('Failed to retrieve debug logs', error, req);
    res.status(500).json({ 
      success: false, 
      error: "Failed to retrieve debug logs",
      code: 'DEBUG_LOGS_FAILED'
    });
  }
});

router.get("/debug/errors", requireAdmin, async (req, res) => {
  try {
    const errorSummary = debugLogger.getErrorSummary();
    res.json({ 
      success: true, 
      data: errorSummary
    });
  } catch (error: any) {
    debugLogger.error('Failed to retrieve error summary', error, req);
    res.status(500).json({ 
      success: false, 
      error: "Failed to retrieve error summary",
      code: 'ERROR_SUMMARY_FAILED'
    });
  }
});

router.get("/debug/performance", requireAdmin, async (req, res) => {
  try {
    const performanceMetrics = debugLogger.getPerformanceMetrics();
    res.json({ 
      success: true, 
      data: performanceMetrics
    });
  } catch (error: any) {
    debugLogger.error('Failed to retrieve performance metrics', error, req);
    res.status(500).json({ 
      success: false,
      error: "Failed to retrieve performance metrics",
      code: 'PERFORMANCE_METRICS_FAILED',
      data: {
        totalRequests: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        slowRequests: 0
      }
    });
  }
});

router.post("/debug/clear-logs", requireAdmin, async (req, res) => {
  try {
    debugLogger.clearLogs();
    res.json({ 
      success: true, 
      data: { message: 'Debug logs cleared successfully' }
    });
  } catch (error: any) {
    debugLogger.error('Failed to clear debug logs', error, req);
    res.status(500).json({ 
      success: false, 
      error: "Failed to clear debug logs",
      code: 'CLEAR_LOGS_FAILED'
    });
  }
});

// System health endpoint
router.get("/health", requireAdmin, async (req, res) => {
  try {
    const healthData = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };

    res.json({ 
      success: true, 
      data: healthData
    });
  } catch (error: any) {
    debugLogger.error('Failed to retrieve system health', error, req);
    res.status(500).json({ 
      success: false, 
      error: "Failed to retrieve system health",
      code: 'HEALTH_CHECK_FAILED'
    });
  }
});

export default router;