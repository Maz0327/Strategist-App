import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
// Import modular routes
import authRoutes from './routes/authRoutes';
import signalRoutes from './routes/signalRoutes';
import analysisRoutes from './routes/analysisRoutes';
import adminRoutes from './routes/adminRoutes';
import userRoutes from './routes/userRoutes';
import traceabilityRoutes from './routes/traceabilityRoutes';
import { systemMonitor } from './services/system-monitor';
import { setupVite, serveStatic, log } from "./vite";
import { debugLogger, errorHandler } from "./services/debug-logger";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    userEmail?: string;
    userRole?: string;
  }
}

// API credentials should be set via environment variables
// REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET
// TWITTER_BEARER_TOKEN

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
const MemoryStoreSession = MemoryStore(session);

app.use(session({
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  secret: process.env.SESSION_SECRET || 'default-development-secret-please-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Always false for Replit deployment compatibility
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Add CORS headers for credentials (including Chrome extension)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  const origin = req.headers.origin;
  
  // Allow Chrome extension origins
  if (origin && (origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://'))) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    // Standard CORS for web clients
    const allowedOrigins = [
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin || 'http://localhost:5000');
    }
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Add process error handlers
process.on('uncaughtException', (error) => {
  debugLogger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  debugLogger.error('Unhandled Rejection at:', reason);
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
      
      // Enhanced debug logging
      debugLogger.apiCall(req, res, duration, res.statusCode >= 400 ? new Error(capturedJsonResponse?.message || 'Request failed') : undefined);
      
      // Record metrics for system monitoring
      const userId = (req as any).session?.userId;
      const userAgent = req.get('User-Agent');
      const errorMessage = res.statusCode >= 400 ? capturedJsonResponse?.error || 'Request failed' : undefined;
      
      systemMonitor.recordRequest(
        req.method,
        path,
        res.statusCode,
        duration,
        userId,
        userAgent,
        errorMessage
      );
    }
  });

  next();
});

(async () => {
  // Setup modular routes with comprehensive validation
  app.use('/api/auth', authRoutes);
  app.use('/api/signals', signalRoutes);
  app.use('/api/analyze', analysisRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/traceability', traceabilityRoutes);
  
  debugLogger.info('All modular routes registered successfully', {
    routes: ['auth', 'signals', 'analyze', 'admin', 'user', 'traceability']
  });
  
  const http = await import("http");
  const server = http.createServer(app);

  // Enhanced error handling with debug logging
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log error details
    debugLogger.error(`Server error: ${message}`, err, req);
    
    res.status(status).json({ 
      message,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
