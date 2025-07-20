/**
 * Comprehensive Proxy Rotation Service
 * Provides automated IP changing for video transcription with multiple providers
 */

import { debugLogger } from './debug-logger';

interface ProxyEndpoint {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol: 'http' | 'https' | 'socks5';
  provider: string;
}

class ProxyRotationService {
  private freeProxies: ProxyEndpoint[] = [];
  private premiumProxies: ProxyEndpoint[] = [];
  private currentProxyIndex = 0;
  private rotationInterval = 300000; // 5 minutes
  private lastRotation = 0;

  constructor() {
    this.initializeFreeProxies();
    this.initializePremiumProxies();
  }

  private initializeFreeProxies() {
    // Rotating list of free proxy services
    this.freeProxies = [
      // Public HTTP proxies (these change frequently)
      { host: '8.8.8.8', port: 3128, protocol: 'http', provider: 'free-public' },
      { host: '1.1.1.1', port: 3128, protocol: 'http', provider: 'free-public' },
      { host: '9.9.9.9', port: 3128, protocol: 'http', provider: 'free-public' },
      
      // Tor (if available)
      { host: '127.0.0.1', port: 9050, protocol: 'socks5', provider: 'tor' },
      { host: '127.0.0.1', port: 8118, protocol: 'http', provider: 'tor-http' },
    ];
  }

  private initializePremiumProxies() {
    // Premium proxy services (configured via environment variables)
    
    // Bright Data (formerly Luminati)
    if (process.env.BRIGHTDATA_USERNAME && process.env.BRIGHTDATA_PASSWORD) {
      this.premiumProxies.push({
        host: 'zproxy.lum-superproxy.io',
        port: 22225,
        username: process.env.BRIGHTDATA_USERNAME,
        password: process.env.BRIGHTDATA_PASSWORD,
        protocol: 'http',
        provider: 'brightdata'
      });
    }

    // Smartproxy
    if (process.env.SMARTPROXY_USERNAME && process.env.SMARTPROXY_PASSWORD) {
      this.premiumProxies.push({
        host: 'gate.smartproxy.com',
        port: 10000,
        username: process.env.SMARTPROXY_USERNAME,
        password: process.env.SMARTPROXY_PASSWORD,
        protocol: 'http',
        provider: 'smartproxy'
      });
    }

    // ProxyEmpire
    if (process.env.PROXYEMPIRE_USERNAME && process.env.PROXYEMPIRE_PASSWORD) {
      this.premiumProxies.push({
        host: 'rotating.proxyempire.io',
        port: 9001,
        username: process.env.PROXYEMPIRE_USERNAME,
        password: process.env.PROXYEMPIRE_PASSWORD,
        protocol: 'http',
        provider: 'proxyempire'
      });
    }

    // Oxylabs
    if (process.env.OXYLABS_USERNAME && process.env.OXYLABS_PASSWORD) {
      this.premiumProxies.push({
        host: 'pr.oxylabs.io',
        port: 7777,
        username: process.env.OXYLABS_USERNAME,
        password: process.env.OXYLABS_PASSWORD,
        protocol: 'http',
        provider: 'oxylabs'
      });
    }
  }

  getCurrentProxy(): ProxyEndpoint | null {
    const allProxies = [...this.premiumProxies, ...this.freeProxies];
    
    if (allProxies.length === 0) return null;
    
    // Check if we need to rotate
    const now = Date.now();
    if (now - this.lastRotation > this.rotationInterval) {
      this.rotateProxy();
    }
    
    return allProxies[this.currentProxyIndex] || null;
  }

  rotateProxy(): void {
    const allProxies = [...this.premiumProxies, ...this.freeProxies];
    
    if (allProxies.length === 0) return;
    
    this.currentProxyIndex = (this.currentProxyIndex + 1) % allProxies.length;
    this.lastRotation = Date.now();
    
    const currentProxy = allProxies[this.currentProxyIndex];
    debugLogger.info('Rotated to new proxy', {
      provider: currentProxy?.provider,
      host: currentProxy?.host,
      port: currentProxy?.port,
      index: this.currentProxyIndex
    });
  }

  forceRotation(): void {
    debugLogger.info('Forcing proxy rotation due to failure');
    this.rotateProxy();
  }

  getProxyString(): string | null {
    const proxy = this.getCurrentProxy();
    if (!proxy) return null;

    const { protocol, username, password, host, port } = proxy;
    
    if (username && password) {
      return `${protocol}://${username}:${password}@${host}:${port}`;
    }
    
    return `${protocol}://${host}:${port}`;
  }

  // Get proxy configuration for yt-dlp
  getYtDlpProxyArgs(): string[] {
    const proxyString = this.getProxyString();
    if (!proxyString) return [];
    
    return ['--proxy', proxyString];
  }

  // Get available proxy count
  getAvailableProxyCount(): number {
    return this.premiumProxies.length + this.freeProxies.length;
  }

  // Get proxy statistics
  getProxyStats() {
    return {
      total: this.getAvailableProxyCount(),
      premium: this.premiumProxies.length,
      free: this.freeProxies.length,
      current: this.getCurrentProxy()?.provider || 'none',
      currentIndex: this.currentProxyIndex
    };
  }

  // Test proxy connectivity
  async testCurrentProxy(): Promise<{ success: boolean; error?: string; responseTime?: number }> {
    const proxy = this.getCurrentProxy();
    if (!proxy) {
      return { success: false, error: 'No proxy available' };
    }

    try {
      const startTime = Date.now();
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const proxyString = this.getProxyString();
      const testCommand = `curl -s --proxy "${proxyString}" --max-time 10 https://httpbin.org/ip`;
      
      const { stdout } = await execAsync(testCommand);
      const responseTime = Date.now() - startTime;
      
      if (stdout.includes('origin')) {
        return { success: true, responseTime };
      } else {
        return { success: false, error: 'Invalid response' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Build enhanced yt-dlp command with current proxy
  buildYtDlpCommand(url: string, outputTemplate: string): string {
    const baseArgs = [
      'yt-dlp',
      '--extract-audio',
      '--audio-format mp3',
      '--no-playlist',
      '--ignore-errors',
      '--no-check-certificate',
      '--sleep-interval 2',
      '--max-sleep-interval 4',
      '--retries 2'
    ];

    // Add proxy arguments
    const proxyArgs = this.getYtDlpProxyArgs();
    baseArgs.push(...proxyArgs);

    // Add rotating user agents
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    baseArgs.push('--user-agent', `"${randomUserAgent}"`);

    // YouTube-specific optimizations
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const clients = ['android', 'ios', 'web'];
      const randomClient = clients[Math.floor(Math.random() * clients.length)];
      baseArgs.push('--extractor-args', `"youtube:player_client=${randomClient}"`);
    }

    // Add output template and URL
    baseArgs.push('--output', `"${outputTemplate}"`);
    baseArgs.push(`"${url}"`);

    return baseArgs.join(' ');
  }
}

// Singleton instance
export const proxyRotationService = new ProxyRotationService();

// Helper function to execute yt-dlp with automatic proxy rotation
export async function executeYtDlpWithRotation(
  url: string,
  outputTemplate: string,
  maxRetries: number = 3
): Promise<{ success: boolean; output?: string; error?: string; retriesUsed: number }> {
  
  let retriesUsed = 0;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const command = proxyRotationService.buildYtDlpCommand(url, outputTemplate);
      
      debugLogger.info('Executing yt-dlp with proxy rotation', { 
        attempt: attempt + 1,
        proxy: proxyRotationService.getProxyStats().current,
        command: command.substring(0, 200) + '...'
      });

      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 180000 // 3 minutes
      });
      
      // Check for success indicators
      if (!stderr.includes('ERROR') && !stderr.includes('blocked') && !stderr.includes('bot')) {
        return { 
          success: true, 
          output: stdout,
          retriesUsed
        };
      } else if (stderr.includes('blocked') || stderr.includes('bot') || stderr.includes('403')) {
        // IP/proxy is blocked, rotate and retry
        debugLogger.info('Proxy blocked, rotating to next proxy', { attempt: attempt + 1 });
        proxyRotationService.forceRotation();
        retriesUsed++;
        
        if (attempt < maxRetries - 1) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        }
      }
      
      return {
        success: false,
        error: stderr || 'Command failed',
        retriesUsed
      };
      
    } catch (error) {
      debugLogger.warn('yt-dlp execution failed', { 
        attempt: attempt + 1, 
        error: error.message 
      });
      
      if (attempt < maxRetries - 1) {
        // Rotate proxy before next attempt
        proxyRotationService.forceRotation();
        retriesUsed++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  return {
    success: false,
    error: `All ${maxRetries} attempts failed with proxy rotation`,
    retriesUsed
  };
}