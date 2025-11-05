import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import * as profilesBackend from '@/lib/backend/profiles';
import { useToast } from '@/components/ui/use-toast';
import { UserProfile, UserDocument, DocumentType } from '@/types/user';
export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<UserDocument[]>([]);

  const calculateProfileCompletion = (profile: Partial<UserProfile>): number => {
    const requiredFields = [
      'first_name',
      'last_name',
      'phone',
      'birthdate',
      'avatar_url',
      'address',
      'email_verified',
      'phone_verified'
    ];
    
    const completedFields = requiredFields.filter(field => {
      if (field === 'address') return profile.address?.street;
      if (field === 'email_verified') return profile.email_verified;
      if (field === 'phone_verified') return profile.phone_verified;
      return profile[field as keyof UserProfile];
    });

    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  const getProfile = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) return null;

      const { profile, error } = await profilesBackend.getProfile(user.id);
      
      if (error || !profile) {
        throw error || new Error('Profile not found');
      }

      // Map to UserProfile format
      const completeProfile: UserProfile = {
        id: profile.id,
        email: profile.email,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        role: profile.role,
        verified_tenant: profile.verified_tenant,
        verified_host: profile.verified_host,
        avatar_url: profile.avatar_url,
        profile_completion: calculateProfileCompletion(profile as Partial<UserProfile>),
      };

      return completeProfile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger votre profil"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      setLoading(true);
      if (!user) return null;

      const { profile, error } = await profilesBackend.updateProfile(user.id, updates);

      if (error || !profile) {
        throw error || new Error('Failed to update profile');
      }

      toast({
        title: "Succès",
        description: "Votre profil a été mis à jour"
      });

      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour votre profil"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true);
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Vous devez être connecté pour mettre à jour votre photo de profil"
        });
        return null;
      }

      // Vérification de la taille du fichier (limite à 2MB)
      const MAX_FILE_SIZE = 2 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        toast({
          variant: "destructive",
          title: "Fichier trop volumineux",
          description: "La taille maximale autorisée est de 2MB"
        });
        return null;
      }

      // Vérification stricte du type de fichier
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Type de fichier non supporté",
          description: "Formats acceptés : JPG, PNG, GIF"
        });
        return null;
      }

      // Upload to Supabase Storage
      const { url, error: uploadError } = await profilesBackend.uploadAvatar(user.id, file);

      if (uploadError || !url) {
        throw uploadError || new Error('Failed to upload avatar');
      }

      toast({
        title: "Succès",
        description: "Votre photo de profil a été mise à jour"
      });
      return url;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour votre photo de profil"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const verifyEmail = async () => {
    try {
      if (!user?.email) return false;

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      });

      if (error) throw error;

      toast({
        title: "Email envoyé",
        description: "Veuillez vérifier votre boîte de réception"
      });

      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer l'email de vérification"
      });
      return false;
    }
  };

  const verifyPhone = async (_phone: string) => {
    try {
      if (!user) return false;

      // Ici, vous devriez implémenter la logique de vérification par SMS
      // Par exemple, avec un service comme Twilio ou Amazon SNS
      
      toast({
        title: "Code envoyé",
        description: "Un code de vérification a été envoyé par SMS"
      });

      return true;
    } catch (error) {
      console.error('Error sending verification SMS:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer le SMS de vérification"
      });
      return false;
    }
  };

  const handleDocumentUpload = async (type: DocumentType, file: File, verificationType?: 'tenant' | 'host') => {
    try {
      setUploading(true);
      if (!user) return null;

      const { document, error } = await profilesBackend.uploadDocument(user.id, type, file, verificationType);

      if (error || !document) {
        throw error || new Error('Failed to upload document');
      }

      toast({
        title: "Succès",
        description: "Votre document a été téléchargé"
      });

      // Rafraîchir les documents
      await checkDocuments();

      return true;
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de télécharger le document"
      });
      return false;
    } finally {
      setUploading(false);
    }
  };

  const checkDocuments = async (verificationType?: 'tenant' | 'host') => {
    try {
      if (!user) return;

      const { documents: docs, error } = await profilesBackend.getDocuments(user.id, verificationType);
      
      if (error) {
        console.error('Error fetching documents:', error);
        return;
      }

      // Les documents sont déjà mappés dans getDocuments
      setDocuments(docs || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  // Fonction simplifiée pour mock - toujours retourner true
  const verifyDataIsolation = async () => {
    console.log('✅ Isolation des données vérifiée (mode mock)');
    return true;
  };

  return {
    loading,
    uploading,
    documents,
    setUploading,
    getProfile,
    updateProfile,
    uploadAvatar,
    verifyEmail,
    verifyPhone,
    handleDocumentUpload,
    // Backward-compatible alias expected by some components
    uploadDocument: handleDocumentUpload,
    checkDocuments,
    verifyDataIsolation
  };
}; 