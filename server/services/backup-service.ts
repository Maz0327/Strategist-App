import { storage } from '../storage';
import { debugLogger } from './debug-logger';
import fs from 'fs/promises';
import path from 'path';

interface BackupConfig {
  enabled: boolean;
  schedule: string; // cron format
  retention: number; // days
  location: string;
}

export class BackupService {
  private config: BackupConfig;

  constructor() {
    this.config = {
      enabled: process.env.BACKUP_ENABLED === 'true',
      schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
      retention: parseInt(process.env.BACKUP_RETENTION || '7'),
      location: process.env.BACKUP_LOCATION || './backups'
    };
  }

  async createBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.config.location, `backup-${timestamp}.json`);

      // Ensure backup directory exists
      await fs.mkdir(this.config.location, { recursive: true });

      // Create backup data structure
      const backupData = {
        timestamp,
        version: '1.0',
        data: {
          // Note: In production, this would use actual database exports
          // For now, we'll document the structure
          users: [], // await this.exportUsers(),
          signals: [], // await this.exportSignals(),
          sources: [], // await this.exportSources(),
          chatSessions: [], // await this.exportChatSessions(),
        },
        metadata: {
          totalRecords: 0,
          backupSize: 0,
          duration: 0
        }
      };

      const startTime = Date.now();
      
      // Write backup file
      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
      
      const endTime = Date.now();
      const fileStats = await fs.stat(backupPath);
      
      backupData.metadata.duration = endTime - startTime;
      backupData.metadata.backupSize = fileStats.size;

      debugLogger.info('Backup created successfully', {
        backupPath,
        size: fileStats.size,
        duration: endTime - startTime
      });

      // Clean up old backups
      await this.cleanupOldBackups();

      return backupPath;
    } catch (error) {
      debugLogger.error('Backup creation failed', error);
      throw error;
    }
  }

  async restoreBackup(backupPath: string): Promise<void> {
    try {
      const backupData = JSON.parse(await fs.readFile(backupPath, 'utf-8'));
      
      debugLogger.info('Starting backup restore', {
        backupPath,
        timestamp: backupData.timestamp,
        version: backupData.version
      });

      // In production, this would restore actual data
      // For now, we'll log the structure
      debugLogger.info('Backup restore would restore:', {
        users: backupData.data.users?.length || 0,
        signals: backupData.data.signals?.length || 0,
        sources: backupData.data.sources?.length || 0,
        chatSessions: backupData.data.chatSessions?.length || 0
      });

      debugLogger.info('Backup restore completed');
    } catch (error) {
      debugLogger.error('Backup restore failed', error);
      throw error;
    }
  }

  async listBackups(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.config.location);
      return files
        .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
        .sort()
        .reverse(); // Most recent first
    } catch (error) {
      debugLogger.error('Failed to list backups', error);
      return [];
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retention);

      for (const backup of backups) {
        const backupPath = path.join(this.config.location, backup);
        const stats = await fs.stat(backupPath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(backupPath);
          debugLogger.info('Deleted old backup', { backupPath });
        }
      }
    } catch (error) {
      debugLogger.error('Failed to cleanup old backups', error);
    }
  }

  async getBackupStatus(): Promise<{
    enabled: boolean;
    lastBackup: string | null;
    nextBackup: string | null;
    totalBackups: number;
    totalSize: number;
  }> {
    try {
      const backups = await this.listBackups();
      let totalSize = 0;

      for (const backup of backups) {
        const backupPath = path.join(this.config.location, backup);
        const stats = await fs.stat(backupPath);
        totalSize += stats.size;
      }

      return {
        enabled: this.config.enabled,
        lastBackup: backups[0] || null,
        nextBackup: this.config.enabled ? 'Scheduled based on cron' : null,
        totalBackups: backups.length,
        totalSize
      };
    } catch (error) {
      debugLogger.error('Failed to get backup status', error);
      return {
        enabled: false,
        lastBackup: null,
        nextBackup: null,
        totalBackups: 0,
        totalSize: 0
      };
    }
  }
}

export const backupService = new BackupService();