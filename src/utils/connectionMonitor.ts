/**
 * Connection Monitor Utility
 * Monitors and manages Supabase connection with timeout handling and fallback strategies
 */

class ConnectionMonitor {
  private static instance: ConnectionMonitor;
  private connectionTimeout: number = 5000; // 5 seconds default timeout
  private retryAttempts: number = 3;
  private retryDelay: number = 1000; // 1 second initial delay
  private isOnline: boolean = navigator.onLine;
  private connectionErrorCallback?: (error: Error) => void;
  private connectionRestoredCallback?: () => void;

  private constructor() {
    this.setupEventListeners();
  }

  static getInstance(): ConnectionMonitor {
    if (!ConnectionMonitor.instance) {
      ConnectionMonitor.instance = new ConnectionMonitor();
    }
    return ConnectionMonitor.instance;
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Connection restored');
      if (this.connectionRestoredCallback) {
        this.connectionRestoredCallback();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Connection lost');
      if (this.connectionErrorCallback) {
        this.connectionErrorCallback(new Error('Network connection lost'));
      }
    });
  }

  setConnectionTimeout(timeout: number): void {
    this.connectionTimeout = timeout;
  }

  setRetryConfig(attempts: number, delay: number): void {
    this.retryAttempts = attempts;
    this.retryDelay = delay;
  }

  onConnectionError(callback: (error: Error) => void): void {
    this.connectionErrorCallback = callback;
  }

  onConnectionRestored(callback: () => void): void {
    this.connectionRestoredCallback = callback;
  }

  async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.isOnline) {
      throw new Error('Network is offline');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.connectionTimeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.connectionTimeout}ms`);
      }
      
      throw error;
    }
  }

  async supabaseOperationWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        console.warn(`Supabase operation failed (attempt ${attempt}/${this.retryAttempts}):`, error.message);

        // Don't retry on certain errors
        if (error.status === 401 || error.status === 403) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < this.retryAttempts) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Operation failed after all retry attempts');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testSupabaseConnection(): Promise<boolean> {
    try {
      // Import Supabase client dynamically to avoid circular dependencies
      const { supabase } = await import('../integrations/supabase/client');
      
      // Test with a simple query with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.connectionTimeout);
      
      try {
        const { error } = await supabase.from('profiles').select('count').limit(1).maybeSingle();
        clearTimeout(timeoutId);
        
        if (error && error.message !== 'Relation not found') {
          throw error;
        }
        
        return true;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error(`Connection test timeout after ${this.connectionTimeout}ms`);
        }
        throw error;
      }
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
  }

  getConnectionStatus(): { isOnline: boolean; timeout: number; retryAttempts: number } {
    return {
      isOnline: this.isOnline,
      timeout: this.connectionTimeout,
      retryAttempts: this.retryAttempts
    };
  }
}

export default ConnectionMonitor.getInstance();