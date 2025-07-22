import { Router } from 'express';
import axios from 'axios';
import { debugLogger } from '../services/debug-logger';
import { brightDataBrowserService } from '../services/bright-data-browser-fix';

const router = Router();

// Require auth middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};

// Test Bright Data browser automation (correct method)
router.post('/browser-test', requireAuth, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      const connectivityTest = await brightDataBrowserService.testConnectivity();
      return res.json(connectivityTest);
    }
    
    const result = await brightDataBrowserService.testYouTubeAccess(url);
    res.json(result);
    
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Test regular proxy (will fail as expected)
router.post('/test', requireAuth, async (req, res) => {
  try {
    const { url } = req.body;
    
    // Get current server IP first
    const serverResponse = await axios.get('https://httpbin.org/ip', { timeout: 5000 });
    const serverIP = serverResponse.data.origin;
    
    debugLogger.info('Testing Bright Data connectivity', { serverIP });
    
    // Test with Bright Data proxy
    const username = process.env.BRIGHT_DATA_USERNAME;
    const password = process.env.BRIGHT_DATA_PASSWORD;
    
    if (!username || !password) {
      return res.json({
        success: false,
        serverIP,
        error: 'Bright Data credentials not configured',
        explanation: 'Missing BRIGHT_DATA_USERNAME or BRIGHT_DATA_PASSWORD'
      });
    }
    
    try {
      // Test basic connectivity with httpbin.org
      const brightDataResponse = await axios.get('https://httpbin.org/ip', {
        proxy: {
          host: 'brd.superproxy.io',
          port: 9515,
          auth: { username, password }
        },
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      
      const residentialIP = brightDataResponse.data.origin;
      
      // Test URL if provided
      let urlTest = null;
      if (url) {
        try {
          const urlResponse = await axios.get(url, {
            proxy: {
              host: 'brd.superproxy.io', 
              port: 9515,
              auth: { username, password }
            },
            timeout: 15000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            },
            validateStatus: () => true
          });
          
          const blocked = urlResponse.data.includes('bot') || 
                         urlResponse.data.includes('captcha') ||
                         urlResponse.data.includes('Sign in to confirm');
          
          urlTest = {
            status: urlResponse.status,
            blocked,
            contentLength: urlResponse.data.length
          };
          
        } catch (urlError: any) {
          urlTest = { error: urlError.message };
        }
      }
      
      res.json({
        success: true,
        serverIP,
        residentialIP,
        ipChanged: serverIP !== residentialIP,
        urlTest,
        explanation: `Bright Data working! Traffic routed through residential IP ${residentialIP} instead of server IP ${serverIP}`
      });
      
    } catch (proxyError: any) {
      res.json({
        success: false,
        serverIP,
        error: proxyError.message,
        explanation: 'Bright Data proxy connection failed - this explains platform blocking'
      });
    }
    
  } catch (error: any) {
    debugLogger.error('Bright Data test failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

export { router as brightDataTestRouter };