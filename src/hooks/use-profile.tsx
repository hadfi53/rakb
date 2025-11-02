import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { UserProfile, UserDocument, DocumentType } from '@/types/user';

export interface UseProfileReturn {
  getProfile: () => Promise<UserProfile | null>;
  checkDocuments: () => Promise<void>;
  documents: UserDocument[];
  loading: boolean;
  uploading: boolean;
  setUploading: React.Dispatch<React.SetStateAction<boolean>>;
  handleDocumentUpload: (type: DocumentType, file: File) => Promise<void>;
}

export const useProfile = (): UseProfileReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const getProfile = async () => {
    try {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*, addresses(*)')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        return {
          ...data,
          email: user.email,
          address: data.addresses?.[0],
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger votre profil",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const checkDocuments = useCallback(async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .rpc('get_user_documents', { p_user_id: user.id });

      if (error) throw error;

      if (data) {
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger vos documents",
      });
    }
  }, [user, toast]);

  const handleDocumentUpload = useCallback(async (type: DocumentType, file: File) => {
    try {
      console.log('Starting document upload:', { type, fileName: file.name });
      setUploading(true);
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Non autorisé",
          description: "Vous devez être connecté pour téléverser des documents"
        });
        return;
      }

      // Vérifier la taille du fichier (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Fichier trop volumineux",
          description: "La taille maximale autorisée est de 5MB"
        });
        return;
      }

      // Vérifier le type de fichier
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Type de fichier non supporté",
          description: "Formats acceptés : JPG, PNG, PDF"
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const filePath = `${user.id}/${type}_${timestamp}.${fileExt}`;

      // Upload du fichier
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        if (uploadError.message.includes('bucket not found')) {
          toast({
            variant: "destructive",
            title: "Erreur de configuration",
            description: "Le système de stockage n'est pas correctement configuré. Veuillez contacter le support."
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erreur de téléversement",
            description: "Impossible de téléverser le fichier. Veuillez réessayer."
          });
        }
        return;
      }

      // Récupérer l'URL du fichier
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Insérer l'entrée dans la base de données
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          document_type: type,
          file_path: filePath,
          file_url: publicUrl,
          status: 'pending',
          submitted_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
        toast({
          variant: "destructive",
          title: "Erreur d'enregistrement",
          description: "Le fichier a été téléversé mais n'a pas pu être enregistré. Veuillez contacter le support."
        });
        return;
      }

      toast({
        title: "Document téléversé",
        description: "Votre document a été envoyé pour vérification"
      });

      // Rafraîchir la liste des documents
      await checkDocuments();
      
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        variant: "destructive",
        title: "Erreur inattendue",
        description: "Une erreur est survenue lors du téléversement. Veuillez réessayer."
      });
    } finally {
      setUploading(false);
    }
  }, [user, toast, checkDocuments]);

  return {
    getProfile,
    checkDocuments,
    documents,
    loading,
    uploading,
    setUploading,
    handleDocumentUpload
  };
};
