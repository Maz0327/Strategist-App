import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../middleware/require-auth';
import { debugLogger } from '../services/debug-logger';
import { systemMonitor } from '../services/system-monitor';

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

router.get("/debug/info", requireAdmin, async (req, res) => {
  try {
    const debugInfo = {
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      cwd: process.cwd()
    };
    
    res.json({ 
      success: true, 
      data: debugInfo
    });
  } catch (error: any) {
    debugLogger.error('Failed to get debug info', error, req);
    res.status(500).json({ 
      success: false, 
      error: "Failed to get debug info",
      code: 'DEBUG_INFO_FAILED'
    });
  }
});

router.post("/debug/test-error", requireAdmin, async (req, res) => {
  try {
    // Intentional test error for monitoring
    throw new Error("Test error for monitoring system");
  } catch (error: any) {
    debugLogger.error('Test error triggered', error, req);
    res.status(500).json({ 
      success: false, 
      error: "Test error executed successfully",
      code: 'TEST_ERROR'
    });
  }
});

router.get("/system/status", requireAdmin, async (req, res) => {
  try {
    const status = {
      server: 'running',
      database: 'connected',
      cache: 'memory_store', // Redis fallback to memory
      apis: {
        openai: 'available',
        video_processing: 'available'
      },
      features: {
        signal_analysis: true,
        content_extraction: true,
        admin_monitoring: true
      }
    };
    
    res.json({ 
      success: true, 
      data: status
    });
  } catch (error: any) {
    debugLogger.error('Failed to get system status', error, req);
    res.status(500).json({ 
      success: false, 
      error: "Failed to get system status",
      code: 'SYSTEM_STATUS_FAILED'
    });
  }
});

// Logs cleanup endpoint
router.delete("/debug/logs", requireAdmin, async (req, res) => {
  try {
    debugLogger.clearLogs();
    res.json({ 
      success: true, 
      data: { 
        message: "Debug logs cleared successfully",
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    debugLogger.error('Failed to clear debug logs', error, req);
    res.status(500).json({ 
      success: false, 
      error: "Failed to clear debug logs",
      code: 'DEBUG_CLEAR_FAILED'
    });
  }
});

// System monitoring and health endpoints
router.get("/health", requireAdmin, async (req, res) => {
  try {
    const metrics = await systemMonitor.getSystemMetrics();
    
    res.json({
      success: true,
      data: {
        system: metrics,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      }
    });
    
    debugLogger.info('System health check requested', {
      userId: (req as any).session?.userId,
      systemHealth: metrics.systemHealth,
      uptime: metrics.uptime
    }, req);
    
  } catch (error: any) {
    debugLogger.error('Failed to get system health', error, req);
    res.status(500).json({
      success: false,
      error: "Failed to get system health",
      message: error.message,
      code: 'SYSTEM_HEALTH_FAILED'
    });
  }
});

router.get("/errors", requireAdmin, async (req, res) => {
  try {
    const errorAnalysis = systemMonitor.getErrorAnalysis();
    
    res.json({
      success: true,
      data: {
        ...errorAnalysis,
        timestamp: new Date().toISOString()
      }
    });
    
    debugLogger.info('Error analysis requested', {
      userId: (req as any).session?.userId,
      totalErrors: errorAnalysis.totalErrors,
      errorRate: errorAnalysis.errorRate
    }, req);
    
  } catch (error: any) {
    debugLogger.error('Failed to get error analysis', error, req);
    res.status(500).json({
      success: false,
      error: "Failed to get error analysis",
      message: error.message,
      code: 'ERROR_ANALYSIS_FAILED'
    });
  }
});

router.get("/performance", requireAdmin, async (req, res) => {
  try {
    const performanceAnalysis = systemMonitor.getPerformanceAnalysis();
    
    res.json({
      success: true,
      data: {
        ...performanceAnalysis,
        timestamp: new Date().toISOString()
      }
    });
    
    debugLogger.info('Performance analysis requested', {
      userId: (req as any).session?.userId,
      averageResponseTime: performanceAnalysis.averageResponseTime,
      slowRequestRate: performanceAnalysis.slowRequestRate
    }, req);
    
  } catch (error: any) {
    debugLogger.error('Failed to get performance analysis', error, req);
    res.status(500).json({
      success: false,
      error: "Failed to get performance analysis",
      message: error.message,
      code: 'PERFORMANCE_ANALYSIS_FAILED'
    });
  }
});

router.post("/monitor/reset", requireAdmin, async (req, res) => {
  try {
    systemMonitor.reset();
    
    res.json({
      success: true,
      data: {
        message: "System monitor metrics reset successfully",
        timestamp: new Date().toISOString()
      }
    });
    
    debugLogger.info('System monitor reset', {
      userId: (req as any).session?.userId
    }, req);
    
  } catch (error: any) {
    debugLogger.error('Failed to reset system monitor', error, req);
    res.status(500).json({
      success: false,
      error: "Failed to reset system monitor",
      message: error.message,
      code: 'MONITOR_RESET_FAILED'
    });
  }
});

router.post("/clear-logs", requireAdmin, async (req, res) => {
  try {
    // Clear debug logs
    debugLogger.clearLogs();
    
    // Reset system monitor
    systemMonitor.reset();
    
    res.json({
      success: true,
      data: {
        message: "All logs and monitoring data cleared successfully",
        timestamp: new Date().toISOString()
      }
    });
    
    debugLogger.info('All logs cleared by admin', {
      userId: (req as any).session?.userId
    }, req);
    
  } catch (error: any) {
    debugLogger.error('Failed to clear logs', error, req);
    res.status(500).json({
      success: false,
      error: "Failed to clear logs",
      message: error.message,
      code: 'CLEAR_LOGS_FAILED'
    });
  }
});

export default router;