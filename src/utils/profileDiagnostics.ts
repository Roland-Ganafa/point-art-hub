// Utility functions for diagnosing and fixing user profile issues
import { supabase } from "@/integrations/supabase/client";

// Check if a user profile exists
export const checkUserProfileExists = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking user profile:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in checkUserProfileExists:', error);
    return false;
  }
};

// Create a minimal profile for a user if one doesn't exist
export const createMinimalProfile = async (userId: string, fullName: string = 'Unknown User'): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          user_id: userId,
          full_name: fullName,
          role: 'user',
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating minimal profile:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in createMinimalProfile:', error);
    return false;
  }
};

// Get all users without profiles
export const getUsersWithoutProfiles = async (): Promise<any[]> => {
  try {
    // This would require admin privileges and access to auth.users table
    // For now, we'll just return an empty array
    return [];
  } catch (error) {
    console.error('Error in getUsersWithoutProfiles:', error);
    return [];
  }
};

// Fix invalid updated_by references in inventory tables
export const fixInvalidUpdatedByReferences = async (): Promise<void> => {
  try {
    // Note: These operations would typically be done server-side
    // This is just for reference on what needs to be done
    console.log('Fixing invalid updated_by references...');
  } catch (error) {
    console.error('Error in fixInvalidUpdatedByReferences:', error);
  }
};