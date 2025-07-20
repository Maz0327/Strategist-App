import { debugLogger } from './debug-logger';

interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  type: 'http' | 'https' | 'socks5';
}

interface ProxyProvider {
  name: string;
  getRandomProxy(): ProxyConfig | null;
  isAvailable(): boolean;
}

class ProxyManager {
  private providers: ProxyProvider[] = [];
  private currentProxy: ProxyConfig | null = null;
  private proxyRotationInterval = 300000; // 5 minutes
  private lastRotation = 0;

  constructor() {
    // Initialize with free proxy providers
    this.initializeFreeProxyProviders();
  }

  private initializeFreeProxyProviders() {
    // Free proxy lists that can be rotated
    const freeProxies = [
      // Public HTTP proxies (these rotate frequently)
      { host: '8.8.8.8', port: 8080, type: 'http' as const },
      { host: '1.1.1.1', port: 8080, type: 'http' as const },
      { host: '208.67.222.222', port: 8080, type: 'http' as const },
    ];

    this.providers.push({
      name: 'free-proxy-list',
      getRandomProxy: () => {
        const proxy = freeProxies[Math.floor(Math.random() * freeProxies.length)];
        return proxy;
      },
      isAvailable: () => true
    });

    // Tor proxy (if available)
    this.providers.push({
      name: 'tor-proxy',
      getRandomProxy: () => ({
        host: '127.0.0.1',
        port: 9050,
        type: 'socks5' as const
      }),
      isAvailable: () => process.env.TOR_ENABLED === 'true'
    });
  }

  // Add premium proxy provider
  addPremiumProxyProvider(apiKey: string, provider: 'brightdata' | 'smartproxy' | 'oxylabs') {
    switch (provider) {
      case 'brightdata':
        this.providers.push({
          name: 'brightdata',
          getRandomProxy: () => ({
            host: 'rotating-residential.brightdata.com',
            port: 22225,
            username: `customer-${apiKey}`,
            password: apiKey,
            type: 'http' as const
          }),
          isAvailable: () => !!apiKey
        });
        break;
      
      case 'smartproxy':
        this.providers.push({
          name: 'smartproxy',
          getRandomProxy: () => ({
            host: 'gate.smartproxy.com',
            port: 10000,
            username: apiKey.split(':')[0],
            password: apiKey.split(':')[1],
            type: 'http' as const
          }),
          isAvailable: () => !!apiKey
        });
        break;
    }
  }

  async getActiveProxy(): Promise<ProxyConfig | null> {
    const now = Date.now();
    
    // Rotate proxy if enough time has passed or no current proxy
    if (!this.currentProxy || (now - this.lastRotation) > this.proxyRotationInterval) {
      await this.rotateProxy();
    }

    return this.currentProxy;
  }

  async rotateProxy(): Promise<void> {
    const availableProviders = this.providers.filter(p => p.isAvailable());
    
    if (availableProviders.length === 0) {
      debugLogger.warn('No proxy providers available');
      this.currentProxy = null;
      return;
    }

    const randomProvider = availableProviders[Math.floor(Math.random() * availableProviders.length)];
    this.currentProxy = randomProvider.getRandomProxy();
    this.lastRotation = Date.now();

    debugLogger.info('Rotated to new proxy', { 
      provider: randomProvider.name,
      proxy: this.currentProxy ? `${this.currentProxy.host}:${this.currentProxy.port}` : 'none'
    });
  }

  getProxyString(): string | null {
    if (!this.currentProxy) return null;

    const { host, port, username, password, type } = this.currentProxy;
    
    if (username && password) {
      return `${type}://${username}:${password}@${host}:${port}`;
    }
    
    return `${type}://${host}:${port}`;
  }

  // Force proxy rotation for failed requests
  async handleProxyFailure(): Promise<void> {
    debugLogger.info('Proxy failed, forcing rotation');
    await this.rotateProxy();
  }
}

export const proxyManager = new ProxyManager();

// Initialize premium proxies if environment variables are set
if (process.env.BRIGHTDATA_API_KEY) {
  proxyManager.addPremiumProxyProvider(process.env.BRIGHTDATA_API_KEY, 'brightdata');
}

if (process.env.SMARTPROXY_API_KEY) {
  proxyManager.addPremiumProxyProvider(process.env.SMARTPROXY_API_KEY, 'smartproxy');
}