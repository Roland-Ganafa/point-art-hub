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

interface OfflineSale {
  id: string;
  item_id: string;
  quantity: number;
  selling_price: number;
  total_amount: number;
  profit: number;
  date: string;
  sold_by: string | null;
}

interface OfflineGiftSale {
  id: string;
  date: string;
  item: string;
  code: string | null;
  quantity: number;
  unit: string;
  bpx: number;
  spx: number;
}

type OfflineSaleType = OfflineSale | OfflineGiftSale;

interface PendingSyncItem {
  id: number;
  endpoint: string;
  data: any;
  timestamp: string;
}

/**
 * Custom hook for handling offline sales data
 * Allows recording sales when offline and syncing when online
 * Supports both stationery and gift sales
 */
export const useOfflineSales = () => {
  const [offlineSales, setOfflineSales] = useState<OfflineSale[]>([]);
  const [offlineGiftSales, setOfflineGiftSales] = useState<OfflineGiftSale[]>([]);
  const [pendingSyncItems, setPendingSyncItems] = useState<PendingSyncItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Load offline sales from storage on mount
  useEffect(() => {
    loadOfflineSales();
    loadOfflineGiftSales();
    loadPendingSyncItems();
  }, []);

  const loadOfflineSales = () => {
    try {
      const sales = getOfflineData('offline_sales') || [];
      setOfflineSales(sales);
    } catch (error) {
      console.error('Error loading offline sales:', error);
    }
  };

  const loadOfflineGiftSales = () => {
    try {
      const sales = getOfflineData('offline_gift_sales') || [];
      setOfflineGiftSales(sales);
    } catch (error) {
      console.error('Error loading offline gift sales:', error);
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

  // Record a sale while offline (stationery)
  const recordOfflineSale = (saleData: Omit<OfflineSale, 'id' | 'date'>) => {
    try {
      const newSale: OfflineSale = {
        ...saleData,
        id: `offline_${Date.now()}`,
        date: new Date().toISOString()
      };

      const updatedSales = [...offlineSales, newSale];
      setOfflineSales(updatedSales);
      storeOfflineData('offline_sales', updatedSales);

      // Queue for sync when online
      queueForSync(newSale, '/api/sales');
      
      return newSale;
    } catch (error) {
      console.error('Error recording offline sale:', error);
      throw error;
    }
  };

  // Record a gift sale while offline
  const recordOfflineGiftSale = (saleData: Omit<OfflineGiftSale, 'id' | 'date'>) => {
    try {
      const newSale: OfflineGiftSale = {
        ...saleData,
        id: `offline_${Date.now()}`,
        date: new Date().toISOString()
      };

      const updatedSales = [...offlineGiftSales, newSale];
      setOfflineGiftSales(updatedSales);
      storeOfflineData('offline_gift_sales', updatedSales);

      // Queue for sync when online
      queueForSync(newSale, '/api/gift-sales');
      
      return newSale;
    } catch (error) {
      console.error('Error recording offline gift sale:', error);
      throw error;
    }
  };

  // Sync offline sales when online
  const syncOfflineSales = async () => {
    if (offlineSales.length === 0 && offlineGiftSales.length === 0) return;

    setIsSyncing(true);
    
    try {
      // Get pending sync items
      const pendingItems = getPendingSyncItems();
      
      // Process each pending item
      for (const item of pendingItems) {
        if (item.endpoint === '/api/sales') {
          // Insert sale into Supabase (stationery)
          const { error } = await supabase
            .from('stationery_sales')
            .insert([item.data]);

          if (!error) {
            // Remove from sync queue if successful
            removeFromSyncQueue(item.id);
          }
        } else if (item.endpoint === '/api/gift-sales') {
          // Insert sale into Supabase (gifts)
          const { error } = await supabase
            .from('gift_daily_sales')
            .insert([item.data]);

          if (!error) {
            // Remove from sync queue if successful
            removeFromSyncQueue(item.id);
          }
        }
      }

      // Clear offline sales after successful sync
      if (offlineSales.length > 0) {
        removeOfflineData('offline_sales');
        setOfflineSales([]);
      }
      
      if (offlineGiftSales.length > 0) {
        removeOfflineData('offline_gift_sales');
        setOfflineGiftSales([]);
      }

      // Reload pending items
      loadPendingSyncItems();
    } catch (error) {
      console.error('Error syncing offline sales:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Clear all offline sales
  const clearOfflineSales = () => {
    try {
      removeOfflineData('offline_sales');
      setOfflineSales([]);
      removeOfflineData('offline_gift_sales');
      setOfflineGiftSales([]);
    } catch (error) {
      console.error('Error clearing offline sales:', error);
    }
  };

  return {
    offlineSales,
    offlineGiftSales,
    pendingSyncItems,
    isSyncing,
    recordOfflineSale,
    recordOfflineGiftSale,
    syncOfflineSales,
    clearOfflineSales,
    loadOfflineSales,
    loadOfflineGiftSales,
    loadPendingSyncItems
  };
};

export default useOfflineSales;