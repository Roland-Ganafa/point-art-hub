import { useState, useEffect } from 'react';
import { 
  storeOfflineData, 
  getOfflineData, 
  removeOfflineData,
  queueForSync,
  getPendingSyncItems,
  removeFromSyncQueue
} from '@/utils/offlineStorage';
import { supabase } from '@/integrations/supabase/client';

interface OfflineStationerySale {
  id: string;
  date: string;
  category: string;
  item: string;
  description: string | null;
  quantity: number;
  rate: number;
  selling_price: number;
  sold_by: string | null;
}

interface PendingSyncItem {
  id: number;
  endpoint: string;
  data: any;
  timestamp: string;
}

/**
 * Custom hook for handling offline stationery sales data
 * Allows recording stationery sales when offline and syncing when online
 */
export const useOfflineStationerySales = () => {
  const [offlineStationerySales, setOfflineStationerySales] = useState<OfflineStationerySale[]>([]);
  const [pendingSyncItems, setPendingSyncItems] = useState<PendingSyncItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Load offline stationery sales from storage on mount
  useEffect(() => {
    loadOfflineStationerySales();
    loadPendingSyncItems();
  }, []);

  const loadOfflineStationerySales = () => {
    try {
      const sales = getOfflineData('offline_stationery_sales') || [];
      setOfflineStationerySales(sales);
    } catch (error) {
      console.error('Error loading offline stationery sales:', error);
    }
  };

  const loadPendingSyncItems = () => {
    try {
      const items = getPendingSyncItems();
      setPendingSyncItems(items);
    } catch (error) {
      console.error('Error loading pending sync items:', error);
    }
  };

  // Record a stationery sale while offline
  const recordOfflineStationerySale = (saleData: Omit<OfflineStationerySale, 'id' | 'date'>) => {
    try {
      const newSale: OfflineStationerySale = {
        ...saleData,
        id: `offline_${Date.now()}`,
        date: new Date().toISOString()
      };

      const updatedSales = [...offlineStationerySales, newSale];
      setOfflineStationerySales(updatedSales);
      storeOfflineData('offline_stationery_sales', updatedSales);

      // Queue for sync when online
      queueForSync(newSale, '/api/stationery-sales');
      
      return newSale;
    } catch (error) {
      console.error('Error recording offline stationery sale:', error);
      throw error;
    }
  };

  // Sync offline stationery sales when online
  const syncOfflineStationerySales = async () => {
    if (offlineStationerySales.length === 0) return;

    setIsSyncing(true);
    
    try {
      // Get pending sync items
      const pendingItems = getPendingSyncItems();
      
      // Process each pending item
      for (const item of pendingItems) {
        if (item.endpoint === '/api/stationery-sales') {
          // Insert sale into Supabase
          const { error } = await supabase
            .from('stationery_daily_sales')
            .insert([item.data]);

          if (!error) {
            // Remove from sync queue if successful
            removeFromSyncQueue(item.id);
          }
        }
      }

      // Clear offline stationery sales after successful sync
      removeOfflineData('offline_stationery_sales');
      setOfflineStationerySales([]);

      // Reload pending items
      loadPendingSyncItems();
      
      return true;
    } catch (error) {
      console.error('Error syncing offline stationery sales:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Clear all offline stationery sales
  const clearOfflineStationerySales = () => {
    try {
      removeOfflineData('offline_stationery_sales');
      setOfflineStationerySales([]);
    } catch (error) {
      console.error('Error clearing offline stationery sales:', error);
    }
  };

  return {
    offlineStationerySales,
    pendingSyncItems,
    isSyncing,
    recordOfflineStationerySale,
    syncOfflineStationerySales,
    clearOfflineStationerySales,
    loadOfflineStationerySales,
    loadPendingSyncItems
  };
};

export default useOfflineStationerySales;