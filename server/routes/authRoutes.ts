import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { storage } from '../storage';
import { debugLogger } from '../services/debug-logger';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

// Authentication routes
router.post("/login", async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: result.error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    const { email, password } = result.data;
    
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: "Invalid credentials",
        code: 'INVALID_CREDENTIALS'
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        error: "Invalid credentials",
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Set session
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userRole = user.role || 'user';

    debugLogger.info('User login successful', { userId: user.id, email: user.email });

    res.json({ 
      success: true, 
      data: { 
        id: user.id, 
        email: user.email,
        role: user.role || 'user'
      } 
    });
  } catch (error: any) {
    debugLogger.error('Login failed', error, req);
    res.status(500).json({ 
      success: false, 
      error: "Login failed",
      code: 'LOGIN_FAILED'
    });
  }
});

router.post("/register", async (req, res) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: result.error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    const { email, password } = result.data;
    
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        error: "Email already registered",
        code: 'EMAIL_EXISTS'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await storage.createUser({
      email,
      password: hashedPassword,
      role: 'user'
    });

    // Set session
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userRole = user.role || 'user';

    debugLogger.info('User registration successful', { userId: user.id, email: user.email });

    res.status(201).json({ 
      success: true, 
      data: { 
        id: user.id, 
        email: user.email,
        role: user.role || 'user'
      } 
    });
  } catch (error: any) {
    debugLogger.error('Registration failed', error, req);
    res.status(500).json({ 
      success: false, 
      error: "Registration failed",
      code: 'REGISTRATION_FAILED'
    });
  }
});

router.post("/logout", (req, res) => {
  try {
    const userId = req.session.userId;
    req.session.destroy((err) => {
      if (err) {
        debugLogger.error('Logout session destruction failed', err, req);
        return res.status(500).json({ 
          success: false, 
          error: "Logout failed",
          code: 'LOGOUT_FAILED'
        });
      }
      
      debugLogger.info('User logout successful', { userId });
      res.json({ 
        success: true, 
        data: { message: "Logged out successfully" }
      });
    });
  } catch (error: any) {
    debugLogger.error('Logout failed', error, req);
    res.status(500).json({ 
      success: false, 
      error: "Logout failed",
      code: 'LOGOUT_FAILED'
    });
  }
});

router.get("/me", (req, res) => {
  try {
    if (req.session.userId) {
      res.json({ 
        success: true, 
        data: { 
          id: req.session.userId,
          email: req.session.userEmail,
          role: req.session.userRole || 'user'
        }
      });
    } else {
      res.status(401).json({ 
        success: false, 
        error: "Not authenticated",
        code: 'NOT_AUTHENTICATED'
      });
    }
  } catch (error: any) {
    debugLogger.error('Auth check failed', error, req);
    res.status(500).json({ 
      success: false, 
      error: "Authentication check failed",
      code: 'AUTH_CHECK_FAILED'
    });
  }
});

export default router;