import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // Routes setup - session and modular routes already configured in index.ts
  // This function only creates the HTTP server
  
  const httpServer = createServer(app);
  return httpServer;
}