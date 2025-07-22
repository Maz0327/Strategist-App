/**
 * Bright Data Test Service - Working Implementation
 * This service tests and demonstrates Bright Data capabilities
 */

import { debugLogger } from './debug-logger';

export class BrightDataTestService {
  private proxyEndpoint: string;
  private username: string;
  private password: string;

  constructor() {
    this.username = process.env.BRIGHT_DATA_USERNAME || '';
    this.password = process.env.BRIGHT_DATA_PASSWORD || '';
    this.proxyEndpoint = process.env.BRIGHT_DATA_PROXY_ENDPOINT || '';
  }

  /**
   * Test actual Bright Data connectivity
   */
  async testConnectivity(): Promise<{
    success: boolean;
    serverIP: string;
    residentialIP?: string;
    error?: string;
    explanation: string;
  }> {
    try {
      // First, get our current server IP
      const axios = (await import('axios')).default;
      
      const serverIPResponse = await axios.get('https://httpbin.org/ip', { timeout: 10000 });
      const serverIP = serverIPResponse.data.origin;

      // Test Bright Data proxy connection
      if (!this.username || !this.password || !this.proxyEndpoint) {
        return {
          success: false,
          serverIP,
          error: 'Missing Bright Data credentials',
          explanation: 'Bright Data credentials not properly configured. Check environment variables.'
        };
      }

      try {
        // Configure proxy with authentication
        const proxyConfig = {
          host: this.proxyEndpoint.split(':')[0],
          port: parseInt(this.proxyEndpoint.split(':')[1]),
          auth: {
            username: this.username,
            password: this.password
          }
        };

        // Test residential IP connection
        const brightDataResponse = await axios.get('https://httpbin.org/ip', {
          proxy: proxyConfig,
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        });

        const residentialIP = brightDataResponse.data.origin;

        return {
          success: true,
          serverIP,
          residentialIP,
          explanation: `Bright Data working! Your traffic now appears from residential IP ${residentialIP} instead of server IP ${serverIP}. This bypasses platform blocking.`
        };

      } catch (proxyError: any) {
        return {
          success: false,
          serverIP,
          error: proxyError.message,
          explanation: 'Bright Data proxy connection failed. This explains why platforms are blocking your requests. The service is configured but not accessible.'
        };
      }

    } catch (error: any) {
      return {
        success: false,
        serverIP: 'Unable to detect',
        error: error.message,
        explanation: 'Network connectivity issues prevent testing Bright Data functionality.'
      };
    }
  }

  /**
   * Test YouTube access with and without Bright Data
   */
  async testYouTubeAccess(url: string): Promise<{
    success: boolean;
    serverTest: {
      status: number;
      blocked: boolean;
      contentLength: number;
    };
    brightDataTest?: {
      status: number;
      blocked: boolean;
      contentLength: number;
    };
    explanation: string;
  }> {
    try {
      const axios = (await import('axios')).default;
      
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      };

      // Test 1: Regular server request
      const serverResponse = await axios.get(url, { 
        headers, 
        timeout: 10000,
        validateStatus: () => true // Don't throw on 4xx/5xx
      });

      const serverBlocked = serverResponse.data.includes('bot') || 
                           serverResponse.data.includes('captcha') ||
                           serverResponse.data.includes('Sign in to confirm');

      const serverTest = {
        status: serverResponse.status,
        blocked: serverBlocked,
        contentLength: serverResponse.data.length
      };

      // Test 2: Bright Data request (if configured)
      if (this.username && this.password && this.proxyEndpoint) {
        try {
          const proxyConfig = {
            host: this.proxyEndpoint.split(':')[0],
            port: parseInt(this.proxyEndpoint.split(':')[1]),
            auth: {
              username: this.username,
              password: this.password
            }
          };

          const brightDataResponse = await axios.get(url, {
            proxy: proxyConfig,
            headers,
            timeout: 15000,
            validateStatus: () => true
          });

          const brightDataBlocked = brightDataResponse.data.includes('bot') || 
                                   brightDataResponse.data.includes('captcha') ||
                                   brightDataResponse.data.includes('Sign in to confirm');

          const brightDataTest = {
            status: brightDataResponse.status,
            blocked: brightDataBlocked,
            contentLength: brightDataResponse.data.length
          };

          const explanation = this.generateYouTubeTestExplanation(serverTest, brightDataTest);

          return {
            success: true,
            serverTest,
            brightDataTest,
            explanation
          };

        } catch (brightDataError) {
          return {
            success: false,
            serverTest,
            explanation: `Server request ${serverBlocked ? 'BLOCKED' : 'succeeded'}, but Bright Data test failed: ${(brightDataError as Error).message}. This confirms the proxy connectivity issue.`
          };
        }
      } else {
        return {
          success: false,
          serverTest,
          explanation: `Server request ${serverBlocked ? 'BLOCKED' : 'succeeded'}. Bright Data not configured - missing credentials prevent residential IP testing.`
        };
      }

    } catch (error: any) {
      return {
        success: false,
        serverTest: { status: 0, blocked: true, contentLength: 0 },
        explanation: `YouTube access test failed: ${error.message}`
      };
    }
  }

  private generateYouTubeTestExplanation(serverTest: any, brightDataTest: any): string {
    if (serverTest.blocked && !brightDataTest.blocked) {
      return `SUCCESS! Server IP blocked (${serverTest.status}), but Bright Data residential IP bypassed blocking (${brightDataTest.status}). This demonstrates Bright Data's value.`;
    } else if (serverTest.blocked && brightDataTest.blocked) {
      return `Both server IP and Bright Data blocked. This may indicate the video is private, age-restricted, or Bright Data needs different configuration.`;
    } else if (!serverTest.blocked && !brightDataTest.blocked) {
      return `Both requests succeeded. This video may be publicly accessible, but Bright Data still provides IP rotation and anti-detection benefits.`;
    } else {
      return `Unexpected result: Server ${serverTest.blocked ? 'blocked' : 'allowed'}, Bright Data ${brightDataTest.blocked ? 'blocked' : 'allowed'}. May indicate configuration issues.`;
    }
  }

  /**
   * Get comprehensive Bright Data status
   */
  async getStatus(): Promise<{
    configured: boolean;
    connectivity: any;
    capabilities: string[];
    nextSteps: string[];
  }> {
    const configured = !!(this.username && this.password && this.proxyEndpoint);
    const connectivity = await this.testConnectivity();

    const capabilities = configured ? [
      'Residential IP rotation (when connected)',
      'Anti-bot detection bypass',
      'Real user traffic simulation',
      'Geographic IP selection',
      'Browser fingerprint masking'
    ] : [
      'Service not configured - missing credentials'
    ];

    const nextSteps = [];
    
    if (!configured) {
      nextSteps.push('Configure Bright Data credentials in environment');
    } else if (!connectivity.success) {
      nextSteps.push('Contact Bright Data support about proxy connectivity');
      nextSteps.push('Test alternative proxy endpoints');
      nextSteps.push('Verify account status and permissions');
    } else {
      nextSteps.push('Bright Data operational - integrate with video extraction');
      nextSteps.push('Test with blocked platforms (YouTube, Instagram, TikTok)');
    }

    return {
      configured,
      connectivity,
      capabilities,
      nextSteps
    };
  }
}

export const brightDataTestService = new BrightDataTestService();