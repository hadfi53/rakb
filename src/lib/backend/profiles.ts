import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types/user';

export interface ProfileData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: 'owner' | 'renter' | 'admin';
  avatar_url: string | null;
  verified_tenant: boolean;
  verified_host: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get user profile
 */
export const getProfile = async (userId: string): Promise<{ profile: ProfileData | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return { profile: null, error };
    }

    return { profile: data as ProfileData, error: null };
  } catch (error) {
    console.error('Get profile error:', error);
    return { profile: null, error };
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (
  userId: string,
  updates: Partial<ProfileData>
): Promise<{ profile: ProfileData | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { profile: null, error };
    }

    return { profile: data as ProfileData, error: null };
  } catch (error) {
    console.error('Update profile error:', error);
    return { profile: null, error };
  }
};

/**
 * Upload avatar to Supabase Storage
 */
export const uploadAvatar = async (
  userId: string,
  file: File
): Promise<{ url: string | null; error: any }> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar.${fileExt}`;
    // Path should be just the fileName since bucket is already 'avatars'
    const filePath = fileName;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      return { url: null, error: uploadError };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (updateError) {
      return { url: null, error: updateError };
    }

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Upload avatar error:', error);
    return { url: null, error };
  }
};

/**
 * Upload document to Supabase Storage
 */
export const uploadDocument = async (
  userId: string,
  type: string,
  file: File
): Promise<{ document: any | null; error: any }> => {
  try {
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${userId}/${type}/${timestamp}_${file.name}`;
    // Path should be just the fileName since bucket is already 'user_documents'
    const filePath = fileName;

    // Upload file to Supabase Storage (use user_documents bucket)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user_documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return { document: null, error: uploadError };
    }

    // Get public URL (or signed URL if bucket is private)
    const { data: { publicUrl } } = supabase.storage
      .from('user_documents')
      .getPublicUrl(filePath);

    // Insert document record
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        type,
        file_url: publicUrl,
        verified: false,
      })
      .select()
      .single();

    if (docError) {
      return { document: null, error: docError };
    }

    return { document: docData, error: null };
  } catch (error) {
    console.error('Upload document error:', error);
    return { document: null, error };
  }
};

/**
 * Get user documents
 */
export const getDocuments = async (userId: string): Promise<{ documents: any[]; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { documents: [], error };
    }

    return { documents: data || [], error: null };
  } catch (error) {
    console.error('Get documents error:', error);
    return { documents: [], error };
  }
};

