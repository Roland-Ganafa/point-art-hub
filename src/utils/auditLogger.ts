import { supabase } from '@/integrations/supabase/client';

interface AuditLogEntry {
  user_id?: string;
  user_name?: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Log an audit event to the database
 * @param logEntry - The audit log entry to record
 */
export const logAuditEvent = async (logEntry: AuditLogEntry): Promise<void> => {
  try {
    const { error } = await supabase
      .from('audit_log')
      .insert([{
        ...logEntry,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
};

/**
 * Log a user action with context
 * @param user - The user performing the action
 * @param action - The action being performed
 * @param details - Additional details about the action
 */
export const logUserAction = async (
  user: { id: string; full_name: string } | null,
  action: string,
  details?: Record<string, any>
): Promise<void> => {
  if (!user) return;

  await logAuditEvent({
    user_id: user.id,
    user_name: user.full_name,
    action,
    ...details
  });
};

/**
 * Log a profile change
 * @param user - The user performing the action
 * @param targetUserId - The ID of the user being modified
 * @param oldValues - The old values before the change
 * @param newValues - The new values after the change
 */
export const logProfileChange = async (
  user: { id: string; full_name: string } | null,
  targetUserId: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>
): Promise<void> => {
  if (!user) return;

  await logAuditEvent({
    user_id: user.id,
    user_name: user.full_name,
    action: 'PROFILE_UPDATE',
    table_name: 'profiles',
    record_id: targetUserId,
    old_values: oldValues,
    new_values: newValues
  });
};

/**
 * Log a user creation
 * @param user - The admin user performing the action
 * @param newUserId - The ID of the newly created user
 * @param userData - The data of the new user
 */
export const logUserCreation = async (
  user: { id: string; full_name: string } | null,
  newUserId: string,
  userData: Record<string, any>
): Promise<void> => {
  if (!user) return;

  await logAuditEvent({
    user_id: user.id,
    user_name: user.full_name,
    action: 'USER_CREATE',
    table_name: 'profiles',
    record_id: newUserId,
    new_values: userData
  });
};

/**
 * Log a user deletion
 * @param user - The admin user performing the action
 * @param deletedUserId - The ID of the deleted user
 * @param deletedUserData - The data of the deleted user
 */
export const logUserDeletion = async (
  user: { id: string; full_name: string } | null,
  deletedUserId: string,
  deletedUserData: Record<string, any>
): Promise<void> => {
  if (!user) return;

  await logAuditEvent({
    user_id: user.id,
    user_name: user.full_name,
    action: 'USER_DELETE',
    table_name: 'profiles',
    record_id: deletedUserId,
    old_values: deletedUserData
  });
};

/**
 * Log a role change
 * @param user - The admin user performing the action
 * @param targetUserId - The ID of the user whose role is being changed
 * @param oldRole - The old role
 * @param newRole - The new role
 */
export const logRoleChange = async (
  user: { id: string; full_name: string } | null,
  targetUserId: string,
  oldRole: string | null,
  newRole: string | null
): Promise<void> => {
  if (!user) return;

  await logAuditEvent({
    user_id: user.id,
    user_name: user.full_name,
    action: 'ROLE_CHANGE',
    table_name: 'profiles',
    record_id: targetUserId,
    old_values: { role: oldRole },
    new_values: { role: newRole }
  });
};