/**
 * Supabase Wrapper Utility
 * Wraps Supabase operations with timeout handling and retry mechanisms
 */

import { supabase } from '../integrations/supabase/client';
import ConnectionMonitor from './connectionMonitor';

// Type definitions for Supabase operations
type SupabaseOperation<T> = () => Promise<T>;

/**
 * Executes a Supabase operation with timeout handling and retry mechanisms
 * @param operation The Supabase operation to execute
 * @param operationName Name of the operation for logging purposes
 * @returns Promise with the result of the operation
 */
export async function executeSupabaseOperation<T>(
  operation: SupabaseOperation<T>,
  operationName: string = 'Supabase operation'
): Promise<T> {
  try {
    return await ConnectionMonitor.supabaseOperationWithRetry(operation);
  } catch (error: any) {
    console.error(`Error in ${operationName}:`, error);
    throw error;
  }
}

/**
 * Wrapper for Supabase auth operations
 */
export const authWrapper = {
  /**
   * Refreshes the current session
   */
  async refreshSession() {
    return executeSupabaseOperation(
      () => supabase.auth.refreshSession(),
      'auth.refreshSession'
    );
  },

  /**
   * Gets the current session
   */
  async getSession() {
    return executeSupabaseOperation(
      () => supabase.auth.getSession(),
      'auth.getSession'
    );
  },

  /**
   * Signs in with email and password
   */
  async signInWithPassword(credentials: { email: string; password: string }) {
    return executeSupabaseOperation(
      () => supabase.auth.signInWithPassword(credentials),
      'auth.signInWithPassword'
    );
  },

  /**
   * Signs up with email and password
   */
  async signUp(credentials: { email: string; password: string; options?: { fullName?: string } }) {
    return executeSupabaseOperation(
      () => supabase.auth.signUp(credentials),
      'auth.signUp'
    );
  },

  /**
   * Signs out the current user
   */
  async signOut() {
    return executeSupabaseOperation(
      () => supabase.auth.signOut(),
      'auth.signOut'
    );
  }
};

/**
 * Wrapper for Supabase database operations
 */
export const dbWrapper = {
  /**
   * Select operation
   */
  async select(table: string, query?: string) {
    return executeSupabaseOperation(
      () => supabase.from(table).select(query),
      `db.select(${table})`
    );
  },

  /**
   * Insert operation
   */
  async insert(table: string, data: any) {
    return executeSupabaseOperation(
      () => supabase.from(table).insert(data),
      `db.insert(${table})`
    );
  },

  /**
   * Update operation
   */
  async update(table: string, data: any, match: any) {
    return executeSupabaseOperation(
      () => supabase.from(table).update(data).match(match),
      `db.update(${table})`
    );
  },

  /**
   * Delete operation
   */
  async delete(table: string, match: any) {
    return executeSupabaseOperation(
      () => supabase.from(table).delete().match(match),
      `db.delete(${table})`
    );
  }
};

export default {
  executeSupabaseOperation,
  auth: authWrapper,
  db: dbWrapper
};