/**
 * Offline Storage Utility
 * Provides functions for storing and retrieving data when offline
 */

// Store data in localStorage with timestamp
export const storeOfflineData = (key: string, data: any): void => {
  try {
    const payload = {
      data,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (error) {
    console.error('Error storing offline data:', error);
  }
};

// Retrieve data from localStorage
export const getOfflineData = (key: string): any => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const payload = JSON.parse(item);
    return payload.data;
  } catch (error) {
    console.error('Error retrieving offline data:', error);
    return null;
  }
};

// Remove data from localStorage
export const removeOfflineData = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing offline data:', error);
  }
};

// Get all offline data keys
export const getAllOfflineKeys = (): string[] => {
  try {
    return Object.keys(localStorage).filter(key => 
      key.startsWith('offline_') || key.startsWith('pending_')
    );
  } catch (error) {
    console.error('Error getting offline keys:', error);
    return [];
  }
};

// Clear all offline data
export const clearAllOfflineData = (): void => {
  try {
    const keys = getAllOfflineKeys();
    keys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing offline data:', error);
  }
};

// Queue data for sync when online
export const queueForSync = (data: any, endpoint: string): void => {
  try {
    const queueKey = 'offline_pending_sync_queue_storage_key';
    const existingQueue = getOfflineData(queueKey) || [];
    const newItem = {
      id: Date.now(),
      endpoint,
      data,
      timestamp: new Date().toISOString()
    };
    
    existingQueue.push(newItem);
    storeOfflineData(queueKey, existingQueue);
  } catch (error) {
    console.error('Error queuing data for sync:', error);
  }
};

// Get pending sync items
export const getPendingSyncItems = (): any[] => {
  try {
    const queueKey = 'offline_pending_sync_queue_storage_key';
    return getOfflineData(queueKey) || [];
  } catch (error) {
    console.error('Error getting pending sync items:', error);
    return [];
  }
};

// Remove synced item from queue
export const removeFromSyncQueue = (id: number): void => {
  try {
    const queueKey = 'offline_pending_sync_queue_storage_key';
    const queue = getOfflineData(queueKey) || [];
    const updatedQueue = queue.filter((item: any) => item.id !== id);
    storeOfflineData(queueKey, updatedQueue);
  } catch (error) {
    console.error('Error removing item from sync queue:', error);
  }
};
