import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

describe('Health Endpoint', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    
    // Mock the health endpoint
    app.get('/api/health', (req, res) => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        environment: process.env.NODE_ENV || 'development',
        database: 'connected',
        services: {
          openai: !!process.env.OPENAI_API_KEY,
          reddit: !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET),
          youtube: !!process.env.YOUTUBE_API_KEY,
          news: !!process.env.NEWS_API_KEY,
          spotify: !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET)
        }
      };
      
      res.json(health);
    });
  });

  it('should return health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('memory');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('environment');
    expect(response.body).toHaveProperty('database');
    expect(response.body).toHaveProperty('services');
  });

  it('should include service status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body.services).toHaveProperty('openai');
    expect(response.body.services).toHaveProperty('reddit');
    expect(response.body.services).toHaveProperty('youtube');
    expect(response.body.services).toHaveProperty('news');
    expect(response.body.services).toHaveProperty('spotify');
  });
});