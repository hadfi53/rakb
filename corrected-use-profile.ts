import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { UserProfile } from '@/types/user';

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      setLoading(true);
      if (!user) return null;

      const timestamp = new Date().toISOString();

      const updatePayload = {
        id: user.id,
        ...updates,
        updated_at: timestamp
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(updatePayload);

      if (profileError) throw profileError;

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
    console.log("Début de l'upload de l'avatar", file);
    
    try {
      // Vérifier que l'utilisateur est connecté
      if (!user) {
        console.error("Aucun utilisateur connecté");
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Vous devez être connecté pour mettre à jour votre photo de profil"
        });
        return null;
      }
      
      // Vérification de la taille du fichier (limite à 2MB)
      const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
      if (file.size > MAX_FILE_SIZE) {
        console.error("Fichier trop volumineux:", file.size, "bytes");
        toast({
          variant: "destructive",
          title: "Fichier trop volumineux",
          description: "La taille maximale autorisée est de 2MB"
        });
        return null;
      }
      
      // Vérification du type de fichier
      if (!file.type.startsWith('image/')) {
        console.error("Type de fichier non supporté:", file.type);
        toast({
          variant: "destructive",
          title: "Type de fichier non supporté",
          description: "Veuillez choisir une image (JPG, PNG, etc.)"
        });
        return null;
      }
      
      setUploading(true);
      
      // Extension de fichier et nom de fichier unique
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();
      const filePath = `${user.id}/avatar-${timestamp}.${fileExt}`;
      
      console.log("Uploading to path:", filePath);
      
      // Upload du fichier avec retries
      const MAX_RETRIES = 3;
      let attempt = 0;
      let uploadError = null;
      let uploadData = null;
      
      while (attempt < MAX_RETRIES) {
        try {
          console.log(`Tentative d'upload ${attempt + 1}/${MAX_RETRIES}`);
          
          const uploadResult = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { 
              upsert: true,
              cacheControl: '3600',
              contentType: file.type
            });
          
          uploadData = uploadResult.data;
          uploadError = uploadResult.error;
          
          if (!uploadError) {
            break; // Sortir de la boucle si l'upload est réussi
          }
          
          console.warn(`Erreur à la tentative ${attempt + 1}:`, uploadError.message);
          attempt++;
          
          // Attendre avant la prochaine tentative
          if (attempt < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (e) {
          console.error("Exception lors de l'upload:", e);
          uploadError = e;
          attempt++;
          
          if (attempt < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      if (uploadError) {
        throw uploadError;
      }
      
      console.log("Upload réussi, récupération de l'URL publique");
      
      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      console.log("URL publique générée:", publicUrl);
      
      // Tester que l'URL est accessible
      try {
        const response = await fetch(publicUrl, { method: 'HEAD' });
        if (!response.ok) {
          console.warn("L'URL publique n'est pas immédiatement accessible:", response.status);
        } else {
          console.log("URL publique vérifiée et accessible");
        }
      } catch (fetchError) {
        console.warn("Impossible de vérifier l'accessibilité de l'URL:", fetchError);
        // On continue car ce n'est pas bloquant
      }
      
      // Mise à jour du profil avec la nouvelle URL
      console.log("Mise à jour du profil avec la nouvelle URL d'avatar");
      const profileUpdateResult = await updateProfile({ avatar_url: publicUrl });
      
      if (!profileUpdateResult) {
        console.error("Échec de la mise à jour du profil avec la nouvelle URL d'avatar");
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "L'image a été téléchargée mais le profil n'a pas pu être mis à jour"
        });
        return null;
      }
      
      console.log("Upload et mise à jour du profil terminés avec succès");
      toast({
        title: "Succès",
        description: "Votre photo de profil a été mise à jour"
      });
      
      return publicUrl;
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

  return {
    loading,
    uploading,
    setUploading,
    updateProfile,
    uploadAvatar
  };
}; 