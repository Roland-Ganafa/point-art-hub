import { supabase } from '@/integrations/supabase/client';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  description: string;
  recommendation?: string;
}

export interface QueryPerformanceResult {
  query: string;
  table: string;
  executionTime: number;
  recordCount: number;
  status: 'fast' | 'slow' | 'critical';
  optimization?: string;
}

// Thresholds for performance evaluation
const PERFORMANCE_THRESHOLDS = {
  QUERY_TIME_WARNING: 1000, // 1 second
  QUERY_TIME_CRITICAL: 3000, // 3 seconds
  LARGE_DATASET_SIZE: 1000,
  MEMORY_USAGE_WARNING: 50, // MB
  MEMORY_USAGE_CRITICAL: 100, // MB
  LOCAL_STORAGE_WARNING: 5, // MB
  LOCAL_STORAGE_CRITICAL: 10, // MB
};

/**
 * Measure query execution time
 */
export const measureQueryTime = async <T>(
  queryFn: () => Promise<{ data: T; error: any }>,
  queryName: string
): Promise<{ result: { data: T; error: any }; executionTime: number }> => {
  const startTime = performance.now();
  const result = await queryFn();
  const endTime = performance.now();
  const executionTime = endTime - startTime;
  
  console.log(`Query "${queryName}" took ${executionTime.toFixed(2)}ms`);
  
  return { result, executionTime };
};

/**
 * Optimize database query by adding proper filters and limits
 */
export const optimizeQuery = (
  baseQuery: any,
  options: {
    limit?: number;
    orderBy?: string;
    dateRange?: { start: string; end: string };
    filters?: Record<string, any>;
  } = {}
) => {
  let query = baseQuery;
  
  // Add filters
  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(key, value);
      }
    });
  }
  
  // Add date range filter
  if (options.dateRange) {
    query = query
      .gte('created_at', options.dateRange.start)
      .lte('created_at', options.dateRange.end);
  }
  
  // Add ordering
  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: false });
  }
  
  // Add limit to prevent large dataset downloads
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  return query;
};

/**
 * Analyze database performance for critical tables
 */
export const analyzeDatabasePerformance = async (): Promise<QueryPerformanceResult[]> => {
  const results: QueryPerformanceResult[] = [];
  
  const criticalTables = [
    'stationery',
    'gift_store',
    'stationery_sales',
    'profiles',
    'machines',
    'art_services'
  ];
  
  for (const table of criticalTables) {
    try {
      // Test basic select query
      const { executionTime: selectTime, result: selectResult } = await measureQueryTime(
        () => supabase.from(table as any).select('*').limit(100),
        `${table} select`
      );
      
      const recordCount = selectResult.data?.length || 0;
      
      results.push({
        query: `SELECT * FROM ${table} LIMIT 100`,
        table,
        executionTime: selectTime,
        recordCount,
        status: selectTime < PERFORMANCE_THRESHOLDS.QUERY_TIME_WARNING ? 'fast' :
                selectTime < PERFORMANCE_THRESHOLDS.QUERY_TIME_CRITICAL ? 'slow' : 'critical',
        optimization: selectTime > PERFORMANCE_THRESHOLDS.QUERY_TIME_WARNING ? 
          'Consider adding database indexes or reducing query complexity' : undefined
      });
      
      // Test count query
      const { executionTime: countTime } = await measureQueryTime(
        () => supabase.from(table as any).select('*', { count: 'exact', head: true }),
        `${table} count`
      );
      
      results.push({
        query: `SELECT COUNT(*) FROM ${table}`,
        table,
        executionTime: countTime,
        recordCount: 1,
        status: countTime < PERFORMANCE_THRESHOLDS.QUERY_TIME_WARNING ? 'fast' :
                countTime < PERFORMANCE_THRESHOLDS.QUERY_TIME_CRITICAL ? 'slow' : 'critical',
        optimization: countTime > PERFORMANCE_THRESHOLDS.QUERY_TIME_WARNING ? 
          'Count queries can be expensive. Consider caching counts or using approximations' : undefined
      });
      
    } catch (error) {
      console.warn(`Performance test failed for table ${table}:`, error);
      results.push({
        query: `Performance test for ${table}`,
        table,
        executionTime: 0,
        recordCount: 0,
        status: 'critical',
        optimization: `Table ${table} might not exist or access is denied`
      });
    }
  }
  
  return results;
};

/**
 * Analyze localStorage usage and performance
 */
export const analyzeLocalStoragePerformance = (): PerformanceMetric[] => {
  const metrics: PerformanceMetric[] = [];
  
  try {
    // Calculate total localStorage usage
    let totalSize = 0;
    const itemSizes: { key: string; size: number }[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        const size = new Blob([value]).size;
        totalSize += size;
        itemSizes.push({ key, size });
      }
    }
    
    const totalSizeMB = totalSize / (1024 * 1024);
    
    metrics.push({
      name: 'Local Storage Usage',
      value: totalSizeMB,
      unit: 'MB',
      status: totalSizeMB < PERFORMANCE_THRESHOLDS.LOCAL_STORAGE_WARNING ? 'good' :
              totalSizeMB < PERFORMANCE_THRESHOLDS.LOCAL_STORAGE_CRITICAL ? 'warning' : 'critical',
      description: 'Total size of data stored in localStorage',
      recommendation: totalSizeMB > PERFORMANCE_THRESHOLDS.LOCAL_STORAGE_WARNING ? 
        'Consider implementing data cleanup routines or moving large data to IndexedDB' : undefined
    });
    
    // Find largest localStorage items
    const largestItems = itemSizes
      .sort((a, b) => b.size - a.size)
      .slice(0, 5);
    
    largestItems.forEach((item, index) => {
      const sizeMB = item.size / (1024 * 1024);
      if (sizeMB > 0.1) { // Only report items larger than 100KB
        metrics.push({
          name: `Large Storage Item: ${item.key}`,
          value: sizeMB,
          unit: 'MB',
          status: sizeMB < 1 ? 'good' : sizeMB < 2 ? 'warning' : 'critical',
          description: `Size of localStorage item "${item.key}"`,
          recommendation: sizeMB > 1 ? 
            'Consider compressing this data or moving to IndexedDB for better performance' : undefined
        });
      }
    });
    
  } catch (error) {
    metrics.push({
      name: 'Local Storage Analysis',
      value: 0,
      unit: 'error',
      status: 'critical',
      description: 'Failed to analyze localStorage',
      recommendation: 'Check browser compatibility and localStorage access'
    });
  }
  
  return metrics;
};

/**
 * Analyze memory usage performance
 */
export const analyzeMemoryPerformance = (): PerformanceMetric[] => {
  const metrics: PerformanceMetric[] = [];
  
  // Check if performance memory API is available
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    
    const usedJSHeapSizeMB = memory.usedJSHeapSize / (1024 * 1024);
    const totalJSHeapSizeMB = memory.totalJSHeapSize / (1024 * 1024);
    const usedPercentage = (usedJSHeapSizeMB / totalJSHeapSizeMB) * 100;
    
    metrics.push({
      name: 'Memory Usage',
      value: usedJSHeapSizeMB,
      unit: 'MB',
      status: usedJSHeapSizeMB < PERFORMANCE_THRESHOLDS.MEMORY_USAGE_WARNING ? 'good' :
              usedJSHeapSizeMB < PERFORMANCE_THRESHOLDS.MEMORY_USAGE_CRITICAL ? 'warning' : 'critical',
      description: 'Current JavaScript heap memory usage',
      recommendation: usedJSHeapSizeMB > PERFORMANCE_THRESHOLDS.MEMORY_USAGE_WARNING ? 
        'Monitor for memory leaks and optimize data structures' : undefined
    });
    
    metrics.push({
      name: 'Memory Usage Percentage',
      value: usedPercentage,
      unit: '%',
      status: usedPercentage < 70 ? 'good' : usedPercentage < 85 ? 'warning' : 'critical',
      description: 'Percentage of allocated heap memory being used',
      recommendation: usedPercentage > 70 ? 
        'High memory usage detected. Consider implementing garbage collection optimizations' : undefined
    });
  } else {
    metrics.push({
      name: 'Memory Analysis',
      value: 0,
      unit: 'unavailable',
      status: 'warning',
      description: 'Memory performance API not available in this browser',
      recommendation: 'Use Chrome DevTools for detailed memory analysis'
    });
  }
  
  return metrics;
};

/**
 * Analyze notification system performance
 */
export const analyzeNotificationPerformance = (): PerformanceMetric[] => {
  const metrics: PerformanceMetric[] = [];
  
  try {
    // Check notification storage
    const notifications = localStorage.getItem('notifications');
    const notificationCount = notifications ? JSON.parse(notifications).length : 0;
    
    metrics.push({
      name: 'Stored Notifications',
      value: notificationCount,
      unit: 'items',
      status: notificationCount < 50 ? 'good' : notificationCount < 100 ? 'warning' : 'critical',
      description: 'Number of notifications stored in localStorage',
      recommendation: notificationCount > 50 ? 
        'Consider implementing automatic cleanup of old notifications' : undefined
    });
    
    // Check notification settings
    const settings = localStorage.getItem('notification_settings');
    const settingsSize = settings ? new Blob([settings]).size : 0;
    
    metrics.push({
      name: 'Notification Settings Size',
      value: settingsSize,
      unit: 'bytes',
      status: settingsSize < 1024 ? 'good' : 'warning',
      description: 'Size of notification settings data',
      recommendation: settingsSize > 1024 ? 
        'Notification settings are larger than expected. Check for data corruption' : undefined
    });
    
  } catch (error) {
    metrics.push({
      name: 'Notification System Analysis',
      value: 0,
      unit: 'error',
      status: 'critical',
      description: 'Failed to analyze notification system',
      recommendation: 'Check notification system implementation and data integrity'
    });
  }
  
  return metrics;
};

/**
 * Analyze backup system performance
 */
export const analyzeBackupPerformance = (): PerformanceMetric[] => {
  const metrics: PerformanceMetric[] = [];
  
  try {
    // Check backup history
    const backupHistory = localStorage.getItem('backup_history');
    const backupCount = backupHistory ? JSON.parse(backupHistory).length : 0;
    
    metrics.push({
      name: 'Backup History Count',
      value: backupCount,
      unit: 'backups',
      status: backupCount < 20 ? 'good' : backupCount < 50 ? 'warning' : 'critical',
      description: 'Number of backup records stored in history',
      recommendation: backupCount > 20 ? 
        'Consider cleaning up old backup records to save storage space' : undefined
    });
    
    // Check backup settings
    const backupSettings = localStorage.getItem('backup_settings');
    const settingsValid = backupSettings ? true : false;
    
    metrics.push({
      name: 'Backup Configuration',
      value: settingsValid ? 1 : 0,
      unit: 'status',
      status: settingsValid ? 'good' : 'warning',
      description: 'Backup system configuration status',
      recommendation: !settingsValid ? 
        'Backup settings not found. System may use default configuration' : undefined
    });
    
  } catch (error) {
    metrics.push({
      name: 'Backup System Analysis',
      value: 0,
      unit: 'error',
      status: 'critical',
      description: 'Failed to analyze backup system',
      recommendation: 'Check backup system implementation and data integrity'
    });
  }
  
  return metrics;
};

/**
 * Run comprehensive performance analysis
 */
export const runPerformanceAnalysis = async (): Promise<{
  databaseMetrics: QueryPerformanceResult[];
  storageMetrics: PerformanceMetric[];
  memoryMetrics: PerformanceMetric[];
  notificationMetrics: PerformanceMetric[];
  backupMetrics: PerformanceMetric[];
  overallScore: number;
  recommendations: string[];
}> => {
  console.log('🔍 Starting comprehensive performance analysis...');
  
  const databaseMetrics = await analyzeDatabasePerformance();
  const storageMetrics = analyzeLocalStoragePerformance();
  const memoryMetrics = analyzeMemoryPerformance();
  const notificationMetrics = analyzeNotificationPerformance();
  const backupMetrics = analyzeBackupPerformance();
  
  // Calculate overall performance score (0-100)
  const allMetrics = [...storageMetrics, ...memoryMetrics, ...notificationMetrics, ...backupMetrics];
  const goodMetrics = allMetrics.filter(m => m.status === 'good').length;
  const totalMetrics = allMetrics.length;
  const overallScore = totalMetrics > 0 ? Math.round((goodMetrics / totalMetrics) * 100) : 0;
  
  // Compile recommendations
  const recommendations: string[] = [];
  
  // Database recommendations
  const slowQueries = databaseMetrics.filter(m => m.status !== 'fast');
  if (slowQueries.length > 0) {
    recommendations.push(`Optimize ${slowQueries.length} database queries that are performing slowly`);
  }
  
  // Other recommendations
  allMetrics.forEach(metric => {
    if (metric.recommendation) {
      recommendations.push(metric.recommendation);
    }
  });
  
  // Remove duplicates
  const uniqueRecommendations = [...new Set(recommendations)];
  
  console.log(`✅ Performance analysis complete. Overall score: ${overallScore}/100`);
  
  return {
    databaseMetrics,
    storageMetrics,
    memoryMetrics,
    notificationMetrics,
    backupMetrics,
    overallScore,
    recommendations: uniqueRecommendations
  };
};

/**
 * Optimize application performance based on analysis
 */
export const optimizePerformance = async (): Promise<{
  optimizationsApplied: string[];
  errors: string[];
}> => {
  const optimizationsApplied: string[] = [];
  const errors: string[] = [];
  
  try {
    // Clean up old notifications (keep only last 50)
    const notifications = localStorage.getItem('notifications');
    if (notifications) {
      const notificationArray = JSON.parse(notifications);
      if (notificationArray.length > 50) {
        const trimmedNotifications = notificationArray.slice(0, 50);
        localStorage.setItem('notifications', JSON.stringify(trimmedNotifications));
        optimizationsApplied.push(`Cleaned up ${notificationArray.length - 50} old notifications`);
      }
    }
    
    // Clean up old backup history (keep only last 15)
    const backupHistory = localStorage.getItem('backup_history');
    if (backupHistory) {
      const historyArray = JSON.parse(backupHistory);
      if (historyArray.length > 15) {
        const trimmedHistory = historyArray.slice(0, 15);
        localStorage.setItem('backup_history', JSON.stringify(trimmedHistory));
        optimizationsApplied.push(`Cleaned up ${historyArray.length - 15} old backup records`);
      }
    }
    
    // Clear any temporary cache data
    const keysToCheck = Object.keys(localStorage);
    const tempKeys = keysToCheck.filter(key => 
      key.startsWith('temp_') || 
      key.startsWith('cache_') || 
      key.includes('_temp_')
    );
    
    tempKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    if (tempKeys.length > 0) {
      optimizationsApplied.push(`Removed ${tempKeys.length} temporary cache entries`);
    }
    
    // Trigger garbage collection if available
    if (window.gc) {
      window.gc();
      optimizationsApplied.push('Triggered garbage collection');
    }
    
  } catch (error) {
    errors.push(`Optimization error: ${error}`);
  }
  
  return { optimizationsApplied, errors };
};

/**
 * Get performance optimization recommendations
 */
export const getOptimizationRecommendations = (): string[] => {
  return [
    'Implement database query caching for frequently accessed data',
    'Add database indexes for commonly filtered columns',
    'Use pagination for large data sets instead of loading all records',
    'Implement virtual scrolling for large lists',
    'Optimize image sizes and use appropriate formats',
    'Implement service worker for caching static assets',
    'Use React.memo() for components that render frequently',
    'Implement lazy loading for non-critical components',
    'Optimize bundle size by removing unused dependencies',
    'Use debouncing for search and filter inputs',
    'Implement data compression for localStorage items',
    'Use IndexedDB for large datasets instead of localStorage',
    'Implement progressive loading for dashboard data',
    'Cache API responses with appropriate TTL',
    'Optimize CSS by removing unused styles',
    'Use CSS-in-JS for dynamic styling to reduce bundle size'
  ];
};