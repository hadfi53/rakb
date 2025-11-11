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
    // Filter out undefined values to avoid updating fields to null
    const cleanUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    
    Object.keys(updates).forEach(key => {
      const value = (updates as any)[key];
      if (value !== undefined && value !== null) {
        cleanUpdates[key] = value;
      }
    });

    const { data, error } = await supabase
      .from('profiles')
      .update(cleanUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return { profile: null, error };
    }

    if (!data) {
      return { profile: null, error: { message: 'No data returned from update' } };
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
 * Now uses identity_documents table with verification_type
 */
export const uploadDocument = async (
  userId: string,
  type: string,
  file: File,
  verificationType?: 'tenant' | 'host' // Nouveau paramètre pour déterminer le type de vérification
): Promise<{ document: any | null; error: any }> => {
  try {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const timestamp = Date.now();
    const fileName = `${userId}/${type}/${timestamp}_${file.name}`;
    // Path should be just the fileName since bucket is already 'user_documents'
    const filePath = fileName;

    // Determine MIME type from file extension (priority over file.type which can be unreliable)
    const mimeTypeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'pdf': 'application/pdf',
    };
    
    // Always prefer extension-based MIME type if available, otherwise use file.type
    let contentType: string;
    if (fileExt && mimeTypeMap[fileExt]) {
      contentType = mimeTypeMap[fileExt];
      console.log('✅ Using extension-based MIME type:', contentType, 'for extension:', fileExt, '(original file.type was:', file.type, ')');
    } else if (file.type && file.type !== 'application/json' && file.type !== 'application/octet-stream') {
      contentType = file.type;
      console.log('✅ Using original file.type:', contentType);
    } else {
      contentType = 'application/octet-stream';
      console.warn('⚠️ Could not determine MIME type, using application/octet-stream. Extension:', fileExt, 'file.type:', file.type);
    }

    // Create a new File object with the correct MIME type
    // This ensures Supabase receives the file with the correct type
    const fileToUpload = new File([file], file.name, { 
      type: contentType,
      lastModified: file.lastModified || Date.now()
    });

    console.log('📤 Uploading file with:', {
      fileName: file.name,
      originalFileType: file.type,
      correctedContentType: contentType,
      fileExt: fileExt,
      fileSize: file.size,
      path: filePath,
      fileToUploadType: fileToUpload.type
    });

    // Upload file to Supabase Storage (use user_documents bucket)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user_documents')
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentType, // Force the correct content type
      });

    if (uploadError) {
      return { document: null, error: uploadError };
    }

    // Since user_documents bucket is private, we need signed URLs for access
    // Store the path in the database, and generate signed URLs when needed
    // For now, create a signed URL that's valid for 1 year (31536000 seconds)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('user_documents')
      .createSignedUrl(filePath, 31536000); // 1 year validity

    let documentUrl: string;
    if (signedUrlError || !signedUrlData?.signedUrl) {
      // Fallback: try public URL (in case bucket becomes public later)
      const { data: { publicUrl } } = supabase.storage
        .from('user_documents')
        .getPublicUrl(filePath);
      documentUrl = publicUrl || filePath; // Store path as fallback
      console.warn('Could not create signed URL, using public URL or path:', documentUrl);
    } else {
      documentUrl = signedUrlData.signedUrl;
    }

    // Déterminer le verification_type si non fourni
    // Essayer de le détecter depuis le profil utilisateur
    let finalVerificationType = verificationType;
    if (!finalVerificationType) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, user_role')
        .eq('id', userId)
        .single();
      
      if (profile?.role === 'owner' || profile?.role === 'admin' || profile?.user_role === 'owner' || profile?.user_role === 'admin') {
        finalVerificationType = 'host';
      } else {
        finalVerificationType = 'tenant';
      }
    }

    // Vérifier si un document de ce type existe déjà pour cet utilisateur
    const { data: existingDoc } = await supabase
      .from('identity_documents')
      .select('id')
      .eq('user_id', userId)
      .eq('document_type', type)
      .eq('verification_type', finalVerificationType)
      .single();

    let docData;
    if (existingDoc) {
      // Mettre à jour le document existant
      const { data: updatedDoc, error: updateError } = await supabase
        .from('identity_documents')
        .update({
          document_url: documentUrl,
          original_filename: file.name,
          file_size: file.size,
          mime_type: file.type,
          verification_status: 'pending',
          uploaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingDoc.id)
        .select()
        .single();

      if (updateError) {
        return { document: null, error: updateError };
      }
      docData = updatedDoc;
    } else {
      // Insérer un nouveau document dans identity_documents
      const { data: newDoc, error: insertError } = await supabase
        .from('identity_documents')
        .insert({
          user_id: userId,
          document_type: type,
          document_url: documentUrl,
          original_filename: file.name,
          file_size: file.size,
          mime_type: file.type,
          verification_status: 'pending',
          verification_type: finalVerificationType,
          uploaded_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        return { document: null, error: insertError };
      }
      docData = newDoc;
    }

    return { document: docData, error: null };
  } catch (error) {
    console.error('Upload document error:', error);
    return { document: null, error };
  }
};

/**
 * Get user documents
 * Now retrieves from identity_documents table
 */
export const getDocuments = async (userId: string, verificationType?: 'tenant' | 'host'): Promise<{ documents: any[]; error: any }> => {
  try {
    let query = supabase
      .from('identity_documents')
      .select('*')
      .eq('user_id', userId);
    
    // Filtrer par verification_type si fourni
    if (verificationType) {
      query = query.eq('verification_type', verificationType);
    }
    
    const { data, error } = await query
      .order('uploaded_at', { ascending: false });

    if (error) {
      return { documents: [], error };
    }

    // Mapper les données pour compatibilité avec le code existant
    const mappedDocuments = (data || []).map(doc => ({
      id: doc.id,
      user_id: doc.user_id,
      type: doc.document_type,
      document_type: doc.document_type,
      file_url: doc.document_url,
      document_url: doc.document_url,
      file_name: doc.original_filename || doc.document_url.split('/').pop() || 'document',
      status: doc.verification_status === 'approved' ? 'verified' : 
              doc.verification_status === 'rejected' ? 'rejected' : 'pending',
      verified: doc.verification_status === 'approved',
      verification_status: doc.verification_status,
      verification_type: doc.verification_type,
      rejection_reason: doc.rejection_reason,
      submitted_at: doc.uploaded_at,
      created_at: doc.uploaded_at,
      updated_at: doc.updated_at
    }));

    return { documents: mappedDocuments, error: null };
  } catch (error) {
    console.error('Get documents error:', error);
    return { documents: [], error };
  }
};

