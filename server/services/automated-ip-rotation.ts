/**
 * Automated IP Rotation Service
 * Provides multiple methods to change IP for video transcription
 */

import { debugLogger } from './debug-logger';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface IPRotationMethod {
  name: string;
  execute(): Promise<{ success: boolean; newIP?: string; error?: string }>;
  isAvailable(): Promise<boolean>;
}

class AutomatedIPRotation {
  private methods: IPRotationMethod[] = [];
  private currentMethod: IPRotationMethod | null = null;

  constructor() {
    this.initializeMethods();
  }

  private initializeMethods() {
    // Method 1: VPN Service (if available)
    this.methods.push({
      name: 'vpn-rotation',
      async execute() {
        try {
          // Try common VPN CLI tools
          const vpnCommands = [
            'nordvpn connect',
            'expressvpn connect',
            'protonvpn connect',
            'mullvad connect'
          ];

          for (const command of vpnCommands) {
            try {
              const { stdout } = await execAsync(command);
              if (stdout.includes('Connected') || stdout.includes('connected')) {
                return { success: true, newIP: 'VPN rotated' };
              }
            } catch (e) {
              continue;
            }
          }
          return { success: false, error: 'No VPN clients available' };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
      async isAvailable() {
        try {
          await execAsync('which nordvpn || which expressvpn || which protonvpn || which mullvad');
          return true;
        } catch {
          return false;
        }
      }
    });

    // Method 2: Tor Network
    this.methods.push({
      name: 'tor-rotation',
      async execute() {
        try {
          // Restart Tor to get new IP
          await execAsync('sudo systemctl restart tor 2>/dev/null || service tor restart 2>/dev/null || brew services restart tor 2>/dev/null');
          // Wait for Tor to establish new circuit
          await new Promise(resolve => setTimeout(resolve, 10000));
          return { success: true, newIP: 'Tor circuit renewed' };
        } catch (error) {
          return { success: false, error: 'Tor not available' };
        }
      },
      async isAvailable() {
        try {
          await execAsync('which tor');
          return true;
        } catch {
          return false;
        }
      }
    });

    // Method 3: Network Interface Reset (Linux/Mac)
    this.methods.push({
      name: 'network-reset',
      async execute() {
        try {
          // Release and renew DHCP lease
          const commands = [
            // Linux
            'sudo dhclient -r && sudo dhclient',
            // macOS
            'sudo ipconfig set en0 DHCP',
            // Alternative Linux
            'sudo systemctl restart NetworkManager'
          ];

          for (const command of commands) {
            try {
              await execAsync(command);
              await new Promise(resolve => setTimeout(resolve, 5000));
              return { success: true, newIP: 'Network interface reset' };
            } catch (e) {
              continue;
            }
          }
          return { success: false, error: 'Network reset failed' };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
      async isAvailable() {
        try {
          await execAsync('which dhclient || which ipconfig');
          return true;
        } catch {
          return false;
        }
      }
    });

    // Method 4: Cloud Provider IP Reset (Replit specific)
    this.methods.push({
      name: 'replit-reset',
      async execute() {
        try {
          // For Replit, we can try to restart the process to potentially get new container
          process.env.IP_ROTATION_REQUESTED = 'true';
          return { success: true, newIP: 'Container restart requested' };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
      async isAvailable() {
        return process.env.REPLIT_DOMAIN !== undefined;
      }
    });
  }

  async rotateIP(): Promise<{ success: boolean; method?: string; newIP?: string; error?: string }> {
    debugLogger.info('Starting automated IP rotation');

    // Get current IP for comparison
    const currentIP = await this.getCurrentIP();
    debugLogger.info('Current IP detected', { currentIP });

    // Try available methods in order of effectiveness
    const availableMethods = [];
    for (const method of this.methods) {
      if (await method.isAvailable()) {
        availableMethods.push(method);
      }
    }

    if (availableMethods.length === 0) {
      return { 
        success: false, 
        error: 'No IP rotation methods available. Consider using external proxy services.' 
      };
    }

    for (const method of availableMethods) {
      debugLogger.info('Trying IP rotation method', { method: method.name });
      
      const result = await method.execute();
      
      if (result.success) {
        // Verify IP actually changed
        await new Promise(resolve => setTimeout(resolve, 3000));
        const newIP = await this.getCurrentIP();
        
        if (newIP && newIP !== currentIP) {
          debugLogger.info('IP rotation successful', { 
            method: method.name, 
            oldIP: currentIP, 
            newIP 
          });
          
          return {
            success: true,
            method: method.name,
            newIP
          };
        } else {
          debugLogger.warn('IP rotation method executed but IP unchanged', { 
            method: method.name 
          });
        }
      } else {
        debugLogger.warn('IP rotation method failed', { 
          method: method.name, 
          error: result.error 
        });
      }
    }

    return { 
      success: false, 
      error: 'All IP rotation methods failed. Using proxy services is recommended.' 
    };
  }

  private async getCurrentIP(): Promise<string | null> {
    try {
      const services = [
        'curl -s https://ipv4.icanhazip.com',
        'curl -s https://api.ipify.org',
        'curl -s https://checkip.amazonaws.com',
        'dig +short myip.opendns.com @resolver1.opendns.com'
      ];

      for (const service of services) {
        try {
          const { stdout } = await execAsync(service, { timeout: 5000 });
          const ip = stdout.trim();
          if (ip && /^(\d+\.){3}\d+$/.test(ip)) {
            return ip;
          }
        } catch (e) {
          continue;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  // Get available rotation methods
  async getAvailableMethods(): Promise<string[]> {
    const available = [];
    for (const method of this.methods) {
      if (await method.isAvailable()) {
        available.push(method.name);
      }
    }
    return available;
  }

  // Enhanced yt-dlp command with automatic IP rotation on failure
  async executeWithIPRotation(
    baseCommand: string, 
    maxRetries: number = 3
  ): Promise<{ success: boolean; output?: string; error?: string; retriesUsed: number }> {
    
    let retriesUsed = 0;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        debugLogger.info('Executing command', { attempt: attempt + 1, command: baseCommand });
        
        const { stdout, stderr } = await execAsync(baseCommand, { 
          timeout: 180000 // 3 minutes
        });
        
        // Check if command was successful
        if (!stderr.includes('ERROR') && !stderr.includes('blocked')) {
          return { 
            success: true, 
            output: stdout,
            retriesUsed
          };
        } else if (stderr.includes('blocked') || stderr.includes('bot')) {
          // IP is blocked, try to rotate
          debugLogger.info('Command blocked, attempting IP rotation', { attempt: attempt + 1 });
          
          const rotationResult = await this.rotateIP();
          retriesUsed++;
          
          if (rotationResult.success) {
            debugLogger.info('IP rotated successfully, retrying command', { 
              newIP: rotationResult.newIP,
              method: rotationResult.method
            });
            
            // Wait a bit before retry
            await new Promise(resolve => setTimeout(resolve, 5000));
            continue;
          } else {
            debugLogger.warn('IP rotation failed', { error: rotationResult.error });
          }
        }
        
        return {
          success: false,
          error: stderr || 'Command failed',
          retriesUsed
        };
        
      } catch (error) {
        debugLogger.warn('Command execution failed', { 
          attempt: attempt + 1, 
          error: error.message 
        });
        
        if (attempt < maxRetries - 1) {
          // Try rotating IP before next attempt
          await this.rotateIP();
          retriesUsed++;
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }
    
    return {
      success: false,
      error: `Command failed after ${maxRetries} attempts`,
      retriesUsed
    };
  }
}

export const automatedIPRotation = new AutomatedIPRotation();