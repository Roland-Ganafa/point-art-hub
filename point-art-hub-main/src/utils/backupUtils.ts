import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface BackupSettings {
  autoBackupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  maxBackups: number;
  backupTime: string; // HH:mm format
  includeUserData: boolean;
  compressionEnabled: boolean;
}

export interface BackupMetadata {
  id: string;
  name: string;
  created_at: string;
  size: string;
  tables: string[];
  version: string;
  description?: string;
  type: 'manual' | 'automatic';
  checksum?: string;
}

export interface SystemBackupData {
  metadata: {
    created_at: string;
    version: string;
    description: string;
    tables: string[];
    total_records: number;
    backup_type: 'full' | 'incremental';
    previous_backup_id?: string;
  };
  data: Record<string, any[]>;
  schema?: Record<string, any>; // Table schemas for validation
}

// Default backup settings
const DEFAULT_BACKUP_SETTINGS: BackupSettings = {
  autoBackupEnabled: false,
  backupFrequency: 'weekly',
  maxBackups: 10,
  backupTime: '02:00',
  includeUserData: true,
  compressionEnabled: true
};

// Tables that should be included in backups
export const BACKUP_TABLES = [
  'stationery',
  'gift_store', 
  'embroidery',
  'machines',
  'art_services',
  'stationery_sales',
  'gift_daily_sales',
  'profiles'
] as const;

// Define the table name type
type BackupTableName = typeof BACKUP_TABLES[number];

// Critical tables that must be backed up
export const CRITICAL_TABLES: BackupTableName[] = [
  'stationery',
  'gift_store',
  'stationery_sales'
];

/**
 * Get backup settings from localStorage
 */
export const getBackupSettings = (): BackupSettings => {
  try {
    const settings = localStorage.getItem('backup_settings');
    return settings ? { ...DEFAULT_BACKUP_SETTINGS, ...JSON.parse(settings) } : DEFAULT_BACKUP_SETTINGS;
  } catch {
    return DEFAULT_BACKUP_SETTINGS;
  }
};

/**
 * Save backup settings to localStorage
 */
export const saveBackupSettings = (settings: BackupSettings): void => {
  localStorage.setItem('backup_settings', JSON.stringify(settings));
};

/**
 * Get backup history from localStorage
 */
export const getBackupHistory = (): BackupMetadata[] => {
  try {
    const history = localStorage.getItem('backup_history');
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
};

/**
 * Save backup metadata to history
 */
export const saveBackupToHistory = (backup: BackupMetadata): void => {
  const history = getBackupHistory();
  const settings = getBackupSettings();
  
  const updatedHistory = [backup, ...history].slice(0, settings.maxBackups);
  localStorage.setItem('backup_history', JSON.stringify(updatedHistory));
};

/**
 * Remove backup from history
 */
export const removeBackupFromHistory = (backupId: string): void => {
  const history = getBackupHistory().filter(backup => backup.id !== backupId);
  localStorage.setItem('backup_history', JSON.stringify(history));
};

/**
 * Generate backup file name
 */
export const generateBackupFileName = (type: 'manual' | 'automatic' = 'manual'): string => {
  const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
  return `point-art-hub-${type}-backup-${timestamp}.json`;
};

/**
 * Calculate backup file size
 */
export const calculateBackupSize = (data: SystemBackupData): string => {
  const jsonString = JSON.stringify(data);
  const sizeInBytes = new Blob([jsonString]).size;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  if (sizeInMB < 1) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }
  return `${sizeInMB.toFixed(2)} MB`;
};

/**
 * Generate simple checksum for backup validation
 */
export const generateChecksum = (data: string): string => {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
};

/**
 * Validate backup file structure
 */
export const validateBackupFile = (backupData: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!backupData) {
    errors.push('Backup file is empty or corrupted');
    return { isValid: false, errors };
  }

  if (!backupData.metadata) {
    errors.push('Missing backup metadata');
  } else {
    if (!backupData.metadata.created_at) errors.push('Missing creation date');
    if (!backupData.metadata.version) errors.push('Missing version information');
    if (!Array.isArray(backupData.metadata.tables)) errors.push('Invalid tables list');
  }

  if (!backupData.data || typeof backupData.data !== 'object') {
    errors.push('Missing or invalid backup data');
  } else {
    // Check if critical tables are present
    const missingCriticalTables = CRITICAL_TABLES.filter(
      table => !backupData.data[table]
    );
    if (missingCriticalTables.length > 0) {
      errors.push(`Missing critical tables: ${missingCriticalTables.join(', ')}`);
    }

    // Validate data structure
    for (const [tableName, tableData] of Object.entries(backupData.data)) {
      if (!Array.isArray(tableData)) {
        errors.push(`Invalid data format for table: ${tableName}`);
      }
    }
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Create a full system backup
 */
export const createSystemBackup = async (
  description?: string,
  type: 'manual' | 'automatic' = 'manual'
): Promise<{ success: boolean; backup?: SystemBackupData; error?: string }> => {
  try {
    const backupData: SystemBackupData = {
      metadata: {
        created_at: new Date().toISOString(),
        version: '1.0.0',
        description: description || `${type} backup created on ${format(new Date(), 'PPpp')}`,
        tables: BACKUP_TABLES,
        total_records: 0,
        backup_type: 'full'
      },
      data: {}
    };

    let totalRecords = 0;

    // Backup each table
    for (const table of BACKUP_TABLES) {
      try {
        const { data, error } = await supabase
          .from(table as any) // Type assertion to handle dynamic table names
          .select('*');

        if (error) {
          console.warn(`Warning: Could not backup table ${table}:`, error);
          backupData.data[table] = [];
        } else {
          backupData.data[table] = data || [];
          totalRecords += (data || []).length;
        }
      } catch (tableError) {
        console.warn(`Warning: Table ${table} might not exist, skipping...`);
        backupData.data[table] = [];
      }
    }

    backupData.metadata.total_records = totalRecords;

    return { success: true, backup: backupData };
  } catch (error) {
    console.error('Backup creation error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Restore system from backup
 */
export const restoreSystemFromBackup = async (
  backupData: SystemBackupData,
  options: { clearExisting: boolean } = { clearExisting: true }
): Promise<{ success: boolean; restoredRecords: number; error?: string }> => {
  try {
    let totalRecordsRestored = 0;

    // Restore each table
    for (const [tableName, tableData] of Object.entries(backupData.data)) {
      try {
        if (Array.isArray(tableData) && tableData.length > 0) {
          // Clear existing data if requested
          if (options.clearExisting) {
            await supabase
              .from(tableName as any) // Type assertion for dynamic table names
              .delete()
              .neq('id', '00000000-0000-0000-0000-000000000000');
          }

          // Insert backup data in batches
          const batchSize = 100;
          for (let i = 0; i < tableData.length; i += batchSize) {
            const batch = tableData.slice(i, i + batchSize);
            const { error } = await supabase
              .from(tableName as any) // Type assertion for dynamic table names
              .insert(batch);

            if (error) {
              console.error(`Error restoring ${tableName} batch:`, error);
            } else {
              totalRecordsRestored += batch.length;
            }
          }
        }
      } catch (tableError) {
        console.warn(`Warning: Could not restore table ${tableName}:`, tableError);
      }
    }

    // Clear cached data
    localStorage.removeItem('stationery_items');
    localStorage.removeItem('gift_store_items');

    return { success: true, restoredRecords: totalRecordsRestored };
  } catch (error) {
    console.error('Restore error:', error);
    return { 
      success: false, 
      restoredRecords: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Check if automatic backup is due
 */
export const isBackupDue = (): boolean => {
  const settings = getBackupSettings();
  
  if (!settings.autoBackupEnabled) {
    return false;
  }

  const lastBackupDate = localStorage.getItem('last_auto_backup_date');
  if (!lastBackupDate) {
    return true;
  }

  const lastBackup = new Date(lastBackupDate);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24));

  switch (settings.backupFrequency) {
    case 'daily':
      return diffInDays >= 1;
    case 'weekly':
      return diffInDays >= 7;
    case 'monthly':
      return diffInDays >= 30;
    default:
      return false;
  }
};

/**
 * Mark automatic backup as completed
 */
export const markAutoBackupCompleted = (): void => {
  localStorage.setItem('last_auto_backup_date', new Date().toISOString());
};

/**
 * Clean up old backups based on settings
 */
export const cleanupOldBackups = (): void => {
  const settings = getBackupSettings();
  const history = getBackupHistory();

  if (history.length > settings.maxBackups) {
    const backupsToKeep = history.slice(0, settings.maxBackups);
    localStorage.setItem('backup_history', JSON.stringify(backupsToKeep));
  }
};

/**
 * Export backup to file
 */
export const exportBackupToFile = (backupData: SystemBackupData, fileName?: string): void => {
  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || generateBackupFileName();
  a.click();
  
  URL.revokeObjectURL(url);
};

/**
 * Import backup from file
 */
export const importBackupFromFile = (file: File): Promise<SystemBackupData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const backupData = JSON.parse(content);
        
        const validation = validateBackupFile(backupData);
        if (!validation.isValid) {
          reject(new Error(`Invalid backup file: ${validation.errors.join(', ')}`));
          return;
        }
        
        resolve(backupData);
      } catch (error) {
        reject(new Error('Failed to parse backup file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read backup file'));
    };
    
    reader.readAsText(file);
  });
};