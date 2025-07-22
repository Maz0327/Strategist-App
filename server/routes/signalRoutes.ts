import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { debugLogger } from '../services/debug-logger';
import { requireAuth } from '../middleware/require-auth';

const router = Router();

// Validation schemas
const createSignalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  url: z.string().url('Invalid URL format').optional().or(z.literal('')),
  userNotes: z.string().max(1000, 'User notes too long').optional(),
  status: z.enum(['capture', 'potential_signal', 'signal']).default('capture')
});

const updateSignalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  status: z.enum(['capture', 'potential_signal', 'signal']).optional(),
  userNotes: z.string().max(1000, 'User notes too long').optional(),
  promotionReason: z.string().max(500, 'Promotion reason too long').optional(),
  systemSuggestionReason: z.string().max(500, 'System suggestion reason too long').optional()
});

const signalIdSchema = z.object({
  id: z.string().transform((val) => {
    const num = parseInt(val);
    if (isNaN(num)) throw new Error('Invalid signal ID');
    return num;
  })
});

// Signal routes
router.get("/", requireAuth, async (req, res) => {
  try {
    const signals = await storage.getSignalsByUserId(req.session.userId!);
    res.json({ 
      success: true, 
      data: { 
        signals,
        count: signals.length
      } 
    });
  } catch (error: any) {
    debugLogger.error('Failed to get signals', error, req);
    res.status(500).json({ 
      success: false, 
      error: "Failed to get signals",
      code: 'GET_SIGNALS_FAILED'
    });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const paramResult = signalIdSchema.safeParse(req.params);
    if (!paramResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid signal ID format',
        code: 'VALIDATION_ERROR'
      });
    }

    const { id } = paramResult.data;
    const signal = await storage.getSignal(id);
    
    if (!signal || signal.userId !== req.session.userId) {
      return res.status(404).json({ 
        success: false, 
        error: "Signal not found",
        code: 'SIGNAL_NOT_FOUND'
      });
    }
    
    res.json({ success: true, data: { signal } });
  } catch (error: any) {
    debugLogger.error('Failed to get signal', error, req);
    res.status(500).json({ 
      success: false, 
      error: "Failed to get signal",
      code: 'GET_SIGNAL_FAILED'
    });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const result = createSignalSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: result.error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    const signalData = {
      ...result.data,
      userId: req.session.userId!
    };
    
    const signal = await storage.createSignal(signalData);
    
    debugLogger.info('Signal created successfully', { 
      signalId: signal.id, 
      userId: req.session.userId,
      status: signal.status
    }, req);
    
    res.status(201).json({ 
      success: true, 
      data: { signal } 
    });
  } catch (error: any) {
    debugLogger.error('Failed to create signal', error, req);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create signal",
      code: 'CREATE_SIGNAL_FAILED'
    });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const paramResult = signalIdSchema.safeParse(req.params);
    if (!paramResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid signal ID format',
        code: 'VALIDATION_ERROR'
      });
    }

    const bodyResult = updateSignalSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: bodyResult.error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    const { id } = paramResult.data;
    const updates = bodyResult.data;
    
    const signal = await storage.getSignal(id);
    if (!signal || signal.userId !== req.session.userId) {
      return res.status(404).json({ 
        success: false, 
        error: "Signal not found",
        code: 'SIGNAL_NOT_FOUND'
      });
    }
    
    // Track promotion timestamps
    if (updates.status && updates.status !== signal.status) {
      if (updates.status === "potential_signal") {
        (updates as any).flaggedAt = new Date();
      } else if (updates.status === "signal") {
        (updates as any).promotedAt = new Date();
      }
    }
    
    const updatedSignal = await storage.updateSignal(id, updates);
    
    debugLogger.info('Signal updated successfully', { 
      signalId: id, 
      userId: req.session.userId,
      oldStatus: signal.status,
      newStatus: updates.status
    }, req);
    
    res.json({ success: true, data: { signal: updatedSignal } });
  } catch (error: any) {
    debugLogger.error('Failed to update signal', error, req);
    res.status(400).json({ 
      success: false, 
      error: "Failed to update signal",
      code: 'UPDATE_SIGNAL_FAILED'
    });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const paramResult = signalIdSchema.safeParse(req.params);
    if (!paramResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid signal ID format',
        code: 'VALIDATION_ERROR'
      });
    }

    const { id } = paramResult.data;
    
    const signal = await storage.getSignal(id);
    if (!signal || signal.userId !== req.session.userId) {
      return res.status(404).json({ 
        success: false, 
        error: "Signal not found",
        code: 'SIGNAL_NOT_FOUND'
      });
    }
    
    await storage.deleteSignal(id);
    
    debugLogger.info('Signal deleted successfully', { 
      signalId: id, 
      userId: req.session.userId
    }, req);
    
    res.json({ 
      success: true, 
      data: { message: "Signal deleted successfully" }
    });
  } catch (error: any) {
    debugLogger.error('Failed to delete signal', error, req);
    res.status(500).json({ 
      success: false, 
      error: "Failed to delete signal",
      code: 'DELETE_SIGNAL_FAILED'
    });
  }
});

// Signal promotion endpoints
router.post("/:id/promote", requireAuth, async (req, res) => {
  try {
    const paramResult = signalIdSchema.safeParse(req.params);
    if (!paramResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid signal ID format',
        code: 'VALIDATION_ERROR'
      });
    }

    const reasonSchema = z.object({
      reason: z.string().min(1, 'Promotion reason is required').max(500, 'Reason too long')
    });

    const bodyResult = reasonSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: bodyResult.error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    const { id } = paramResult.data;
    const { reason } = bodyResult.data;
    
    const signal = await storage.getSignal(id);
    if (!signal || signal.userId !== req.session.userId) {
      return res.status(404).json({ 
        success: false, 
        error: "Signal not found",
        code: 'SIGNAL_NOT_FOUND'
      });
    }

    let newStatus: string;
    if (signal.status === 'capture') {
      newStatus = 'potential_signal';
    } else if (signal.status === 'potential_signal') {
      newStatus = 'signal';
    } else {
      return res.status(400).json({ 
        success: false, 
        error: "Signal cannot be promoted further",
        code: 'PROMOTION_NOT_ALLOWED'
      });
    }

    const updates = {
      status: newStatus,
      promotionReason: reason,
      ...(newStatus === 'potential_signal' ? { flaggedAt: new Date() } : {}),
      ...(newStatus === 'signal' ? { promotedAt: new Date() } : {})
    };

    const updatedSignal = await storage.updateSignal(id, updates);
    
    debugLogger.info('Signal promoted successfully', { 
      signalId: id, 
      userId: req.session.userId,
      oldStatus: signal.status,
      newStatus,
      reason
    }, req);
    
    res.json({ 
      success: true, 
      data: { 
        signal: updatedSignal,
        message: `Signal promoted to ${newStatus}`
      }
    });
  } catch (error: any) {
    debugLogger.error('Failed to promote signal', error, req);
    res.status(500).json({ 
      success: false, 
      error: "Failed to promote signal",
      code: 'PROMOTE_SIGNAL_FAILED'
    });
  }
});

router.post("/:id/demote", requireAuth, async (req, res) => {
  try {
    const paramResult = signalIdSchema.safeParse(req.params);
    if (!paramResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid signal ID format',
        code: 'VALIDATION_ERROR'
      });
    }

    const reasonSchema = z.object({
      reason: z.string().min(1, 'Demotion reason is required').max(500, 'Reason too long')
    });

    const bodyResult = reasonSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: bodyResult.error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    const { id } = paramResult.data;
    const { reason } = bodyResult.data;
    
    const signal = await storage.getSignal(id);
    if (!signal || signal.userId !== req.session.userId) {
      return res.status(404).json({ 
        success: false, 
        error: "Signal not found",
        code: 'SIGNAL_NOT_FOUND'
      });
    }

    let newStatus: string;
    if (signal.status === 'signal') {
      newStatus = 'potential_signal';
    } else if (signal.status === 'potential_signal') {
      newStatus = 'capture';
    } else {
      return res.status(400).json({ 
        success: false, 
        error: "Signal cannot be demoted further",
        code: 'DEMOTION_NOT_ALLOWED'
      });
    }

    const updatedSignal = await storage.updateSignal(id, {
      status: newStatus,
      promotionReason: reason
    });
    
    debugLogger.info('Signal demoted successfully', { 
      signalId: id, 
      userId: req.session.userId,
      oldStatus: signal.status,
      newStatus,
      reason
    }, req);
    
    res.json({ 
      success: true, 
      data: { 
        signal: updatedSignal,
        message: `Signal demoted to ${newStatus}`
      }
    });
  } catch (error: any) {
    debugLogger.error('Failed to demote signal', error, req);
    res.status(500).json({ 
      success: false, 
      error: "Failed to demote signal",
      code: 'DEMOTE_SIGNAL_FAILED'
    });
  }
});

export default router;