import { Request, Response, NextFunction } from 'express';
import { debugLogger } from '../services/debug-logger';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    debugLogger.warn('Unauthorized access attempt', { 
      path: req.path, 
      method: req.method, 
      ip: req.ip 
    }, req);
    
    return res.status(401).json({ 
      success: false, 
      error: "Authentication required",
      code: 'AUTH_REQUIRED'
    });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    debugLogger.warn('Unauthorized admin access attempt', { 
      path: req.path, 
      method: req.method, 
      ip: req.ip 
    }, req);
    
    return res.status(401).json({ 
      success: false, 
      error: "Authentication required",
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (req.session.userRole !== 'admin') {
    debugLogger.warn('Non-admin user attempted admin access', { 
      userId: req.session.userId,
      userRole: req.session.userRole,
      path: req.path, 
      method: req.method 
    }, req);
    
    return res.status(403).json({ 
      success: false, 
      error: "Admin access required",
      code: 'ADMIN_REQUIRED'
    });
  }
  
  next();
}