import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/require-auth';
import { debugLogger } from '../services/debug-logger';
import SourceTraceabilityService from '../utils/source-traceability';

const router = Router();

// Validation schemas
const auditQuerySchema = z.object({
  userId: z.number().int().positive().optional()
});

// Source traceability audit route (admin only for system-wide audits)
router.get("/audit", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    
    debugLogger.info('Starting source traceability audit', { userId }, req);
    
    const auditResults = await SourceTraceabilityService.auditSourceTraceability(userId);
    
    res.json({
      success: true,
      data: {
        audit: auditResults,
        compliance_rate: auditResults.compliant / (auditResults.compliant + auditResults.violations),
        total_signals: auditResults.compliant + auditResults.violations
      }
    });
    
    debugLogger.info('Source traceability audit completed', {
      userId,
      compliant: auditResults.compliant,
      violations: auditResults.violations
    }, req);
    
  } catch (error: any) {
    debugLogger.error('Source traceability audit failed', error, req);
    res.status(500).json({
      success: false,
      error: "Source traceability audit failed",
      message: error.message,
      code: 'TRACEABILITY_AUDIT_FAILED'
    });
  }
});

export default router;