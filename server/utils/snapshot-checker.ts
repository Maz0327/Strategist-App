// Bright Data snapshot status checker integrated into the platform
import axios from 'axios';
import { debugLogger } from '../services/debug-logger';

interface SnapshotStatus {
  status: 'running' | 'success' | 'failed' | 'pending';
  start_time?: string;
  end_time?: string;
  progress?: number;
  results?: any[];
  error?: string;
  snapshot_id: string;
}

export class SnapshotChecker {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.BRIGHT_DATA_API_KEY || '';
  }

  async checkSnapshot(snapshotId: string): Promise<SnapshotStatus> {
    if (!this.apiKey) {
      throw new Error('BRIGHT_DATA_API_KEY not configured');
    }

    try {
      debugLogger.info(`🔍 Checking Bright Data snapshot: ${snapshotId}`);
      
      const response = await axios.get(`https://api.brightdata.com/dca/snapshot/${snapshotId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const data = response.data;
      
      debugLogger.info(`📊 Snapshot ${snapshotId} status: ${data.status}`);
      
      if (data.status === 'success') {
        debugLogger.info(`✅ Data collection completed for ${snapshotId}`);
        debugLogger.info(`📄 Results count: ${data.results?.length || 0}`);
      } else if (data.status === 'running') {
        debugLogger.info(`⏳ Snapshot ${snapshotId} still processing...`);
      } else if (data.status === 'failed') {
        debugLogger.error(`❌ Snapshot ${snapshotId} failed: ${data.error}`);
      }

      return {
        status: data.status,
        start_time: data.start_time,
        end_time: data.end_time,
        progress: data.progress,
        results: data.results,
        error: data.error,
        snapshot_id: snapshotId
      };
    } catch (error) {
      debugLogger.error(`🚨 Error checking snapshot ${snapshotId}:`, error.message);
      throw new Error(`Failed to check snapshot: ${error.message}`);
    }
  }

  async waitForCompletion(snapshotId: string, maxWaitMinutes: number = 10): Promise<SnapshotStatus> {
    const maxAttempts = maxWaitMinutes * 2; // Check every 30 seconds
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const status = await this.checkSnapshot(snapshotId);
      
      if (status.status === 'success' || status.status === 'failed') {
        return status;
      }
      
      if (attempt < maxAttempts) {
        debugLogger.info(`⏳ Waiting 30 seconds before next check (${attempt}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
    
    throw new Error(`Snapshot ${snapshotId} did not complete within ${maxWaitMinutes} minutes`);
  }
}

// Test the specific snapshot ID mentioned
export async function testSnapshotId() {
  const checker = new SnapshotChecker();
  
  try {
    const result = await checker.checkSnapshot('s_mddfeskv2jmswrl1wy');
    console.log('Snapshot Status:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}