import { debugLogger } from '../services/debug-logger';
import { storage } from '../storage';

/**
 * Source Traceability Enforcement Utility
 * Ensures every signal has proper source attribution for compliance and audit trails
 */

export interface SourceTraceabilityCheck {
  hasSource: boolean;
  sourceType: string | null;
  sourceDomain: string | null;
  sourceUrl: string | null;
  isCompliant: boolean;
  violations: string[];
}

export class SourceTraceabilityService {
  /**
   * Validates that a signal meets source traceability requirements
   */
  static validateSourceTraceability(signalData: any): SourceTraceabilityCheck {
    const violations: string[] = [];
    let isCompliant = true;

    // Check for URL presence
    const hasUrl = signalData.url && signalData.url.trim() !== '';
    const hasSourceUrl = signalData.sourceUrl && signalData.sourceUrl.trim() !== '';
    const hasSource = hasUrl || hasSourceUrl || signalData.sourceType === 'manual';

    if (!hasSource) {
      violations.push('Signal must reference a source URL or be marked as manual entry');
      isCompliant = false;
    }

    // Extract domain information
    let sourceDomain = null;
    let sourceUrl = null;
    
    try {
      const urlToCheck = signalData.url || signalData.sourceUrl;
      if (urlToCheck) {
        sourceDomain = new URL(urlToCheck).hostname;
        sourceUrl = urlToCheck;
      }
    } catch (error) {
      if (hasUrl || hasSourceUrl) {
        violations.push('Invalid URL format provided');
        isCompliant = false;
      }
    }

    // Check for source type specification
    if (!signalData.sourceType) {
      violations.push('Source type must be specified');
      isCompliant = false;
    }

    return {
      hasSource,
      sourceType: signalData.sourceType || null,
      sourceDomain,
      sourceUrl,
      isCompliant,
      violations
    };
  }

  /**
   * Enforces source traceability during signal creation
   */
  static async enforceSourceTraceability(signalData: any, userId: number): Promise<void> {
    const check = this.validateSourceTraceability(signalData);
    
    if (!check.isCompliant) {
      throw new Error(`Source traceability violations: ${check.violations.join(', ')}`);
    }

    // Create source record if URL is provided
    if (check.sourceUrl) {
      try {
        await storage.createSource({
          url: check.sourceUrl,
          title: signalData.title || 'Untitled',
          domain: check.sourceDomain!,
          userId: userId,
          sourceType: check.sourceType || 'webpage',
          description: signalData.content?.substring(0, 200) || '',
          firstCaptured: new Date(),
          reliability: 'pending'
        });

        debugLogger.info('Source record created for traceability enforcement', {
          sourceUrl: check.sourceUrl,
          domain: check.sourceDomain,
          userId
        });
      } catch (error: any) {
        debugLogger.warn('Source record creation failed (may already exist)', error);
        // Continue - source might already exist
      }
    }
  }

  /**
   * Audits existing signals for source traceability compliance
   */
  static async auditSourceTraceability(userId?: number): Promise<{
    compliant: number;
    violations: number;
    details: any[];
  }> {
    // For now, only support user-specific audits since getAllSignals doesn't exist
    if (!userId) {
      throw new Error('User ID required for source traceability audit');
    }
    
    const signals = await storage.getSignalsByUserId(userId);

    let compliant = 0;
    let violations = 0;
    const details: any[] = [];

    for (const signal of signals) {
      const check = this.validateSourceTraceability(signal);
      
      if (check.isCompliant) {
        compliant++;
      } else {
        violations++;
        details.push({
          signalId: signal.id,
          title: signal.title,
          violations: check.violations
        });
      }
    }

    return { compliant, violations, details };
  }
}

export default SourceTraceabilityService;