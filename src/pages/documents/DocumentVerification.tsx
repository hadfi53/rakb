import { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/use-profile';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Upload, CheckCircle, AlertCircle, ArrowLeft, Send, Shield } from 'lucide-react';
import { UserDocument } from '@/types/user';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const DocumentVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { documents, uploadDocument, loading, checkDocuments } = useProfile();
  const { getUserRole, user, isLoading: authLoading, isVerifiedTenant, isVerifiedHost } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userRole, setUserRole] = useState<'owner' | 'renter' | 'admin' | null>(null);
  const [isDetectingRole, setIsDetectingRole] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  // Détecter le rôle de l'utilisateur connecté et le statut de vérification
  useEffect(() => {
    const detectRoleAndVerification = async () => {
      if (!user) {
        setIsDetectingRole(false);
        return;
      }
      
      try {
        const role = await getUserRole();
        setUserRole(role);
        
        // Vérifier le statut de vérification
        if (role === 'owner' || role === 'admin') {
          const verified = await isVerifiedHost();
          setIsVerified(verified);
        } else if (role === 'renter') {
          const verified = await isVerifiedTenant();
          setIsVerified(verified);
        }
      } catch (error) {
        console.error('Error detecting user role:', error);
        // Fallback sur l'URL ou state si getUserRole échoue
        const pathname = location.pathname;
        const isHostPath = pathname === '/verify/host' || pathname.includes('/verify/host');
        const stateRole = (location.state as any)?.role;
        if (isHostPath || stateRole === 'owner') {
          setUserRole('owner');
        } else if (stateRole === 'renter') {
          setUserRole('renter');
        }
      } finally {
        setIsDetectingRole(false);
      }
    };
    
    detectRoleAndVerification();
  }, [user, getUserRole, location, isVerifiedTenant, isVerifiedHost]);

  // Charger les documents au montage et quand le mode change
  useEffect(() => {
    if (user && mode && checkDocuments) {
      checkDocuments(mode);
    }
  }, [user, mode, checkDocuments]);
  
  // Déterminer le mode : host pour owner/admin, tenant pour renter
  // Fallback sur URL/state si le rôle n'est pas encore détecté
  const pathname = location.pathname;
  const isHostPath = pathname === '/verify/host' || pathname.includes('/verify/host');
  const stateRole = (location.state as any)?.role;
  
  const mode: 'tenant' | 'host' = useMemo(() => {
    // Priorité au rôle détecté
    if (userRole === 'owner' || userRole === 'admin') {
      return 'host';
    }
    if (userRole === 'renter') {
      return 'tenant';
    }
    // Fallback sur URL/state si rôle pas encore détecté
    if (isHostPath || stateRole === 'owner') {
      return 'host';
    }
    // Par défaut tenant si pas d'indication
    return 'tenant';
  }, [userRole, isHostPath, stateRole]);
  
  const [selectedType, setSelectedType] = useState<string>('identity');

  const tenantDocTypes = [
    { type: 'identity', label: "Pièce d'identité", description: "Carte nationale d'identité ou passeport" },
    { type: 'driver_license', label: 'Permis de conduire', description: 'Permis de conduire en cours de validité' }
  ] as const;

  const hostDocTypes = [
    { type: 'identity', label: "Pièce d'identité", description: "Carte nationale d'identité ou passeport" },
    { type: 'vehicle_registration', label: 'Carte grise', description: "Immatriculation du véhicule" },
    { type: 'insurance', label: 'Assurance', description: 'Attestation en cours de validité' },
    { type: 'technical_inspection', label: 'Visite technique', description: 'Contrôle technique à jour' },
    { type: 'trade_register', label: 'Registre de commerce', description: 'Copie originale conforme du registre de commerce' },
    { type: 'business_premises_photo', label: 'Photo du local', description: 'Photo de votre local commercial/agence' }
  ] as const;

  const documentTypes = useMemo(() => (mode === 'host' ? hostDocTypes : tenantDocTypes), [mode]);

  // Vérifier si tous les documents requis sont soumis
  const allDocumentsSubmitted = useMemo(() => {
    const requiredTypes = documentTypes.map(doc => doc.type);
    // Filtrer les documents par verification_type correspondant au mode
    const filteredDocs = documents.filter((d: any) => {
      const docVerificationType = d.verification_type || d.verificationType;
      return docVerificationType === mode;
    });
    
    return requiredTypes.every(type => {
      const doc = filteredDocs.find((d: any) => 
        (d.type === type || d.document_type === type)
      );
      return doc !== undefined;
    });
  }, [documents, documentTypes, mode]);

  // Vérifier si tous les documents sont vérifiés
  const allDocumentsVerified = useMemo(() => {
    const requiredTypes = documentTypes.map(doc => doc.type);
    // Filtrer les documents par verification_type correspondant au mode
    const filteredDocs = documents.filter((d: any) => {
      const docVerificationType = d.verification_type || d.verificationType;
      return docVerificationType === mode;
    });
    
    return requiredTypes.every(type => {
      const doc = filteredDocs.find((d: any) => 
        (d.type === type || d.document_type === type)
      );
      return doc && (doc.verified || doc.status === 'verified' || doc.verification_status === 'approved');
    });
  }, [documents, documentTypes, mode]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setSelectedType(docType);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    
    // Passer le verification_type basé sur le mode
    const verificationType = mode === 'host' ? 'host' : 'tenant';
    await uploadDocument(selectedType, selectedFile, verificationType);
    setSelectedFile(null);
    // Recharger les documents après l'upload
    await checkDocuments();
  };

  const handleSubmitForVerification = async () => {
    if (!user || !userRole) {
      toast.error('Utilisateur non connecté');
      return;
    }

    if (!allDocumentsSubmitted) {
      toast.error('Veuillez soumettre tous les documents requis avant de demander la vérification');
      return;
    }

    setIsSubmitting(true);
    try {
      const verificationType = mode === 'host' ? 'host' : 'tenant';
      const requiredDocTypes = documentTypes.map(doc => doc.type);
      
      // Vérifier d'abord si une demande existe déjà
      const { data: existingRequests, error: checkError } = await supabase
        .from('verification_requests')
        .select('id, status, is_complete')
        .eq('user_id', user.id)
        .eq('verification_type', verificationType)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (checkError) {
        console.error('Error checking existing request:', checkError);
        throw checkError;
      }
      
      if (existingRequests && existingRequests.length > 0 && existingRequests[0].is_complete) {
        toast.info('Votre demande de vérification a déjà été soumise et est en cours de traitement.');
        setIsSubmitting(false);
        return;
      }
      
      // Créer ou mettre à jour la demande de vérification
      if (existingRequests && existingRequests.length > 0) {
        // Mettre à jour la demande existante
        const { error: updateError } = await supabase
          .from('verification_requests')
          .update({
            is_complete: true,
            completed_documents: requiredDocTypes,
            status: 'under_review',
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRequests[0].id);
        
        if (updateError) {
          console.error('Error updating verification request:', updateError);
          throw updateError;
        }
      } else {
        // Créer une nouvelle demande
        const { error: insertError } = await supabase
          .from('verification_requests')
          .insert({
            user_id: user.id,
            verification_type: verificationType,
            required_documents: requiredDocTypes,
            completed_documents: requiredDocTypes,
            is_complete: true,
            status: 'under_review',
            submitted_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('Error creating verification request:', insertError);
          throw insertError;
        }
      }
      
      toast.success('Votre demande de vérification a été soumise avec succès. Un administrateur va examiner vos documents.');
      
      // Re-vérifier le statut de vérification après un court délai
      setTimeout(async () => {
        if (userRole === 'owner' || userRole === 'admin') {
          const verified = await isVerifiedHost();
          setIsVerified(verified);
        } else if (userRole === 'renter') {
          const verified = await isVerifiedTenant();
          setIsVerified(verified);
        }
      }, 1000);
      
    } catch (error: any) {
      console.error('Error submitting verification request:', error);
      // Afficher un message d'erreur plus descriptif
      const errorMessage = error?.message || error?.error_description || 'Erreur lors de la soumission de la demande de vérification';
      
      // Messages d'erreur spécifiques selon le type d'erreur
      if (error?.code === 'PGRST116' || errorMessage.includes('permission denied') || errorMessage.includes('row-level security')) {
        toast.error('Erreur de permissions. Veuillez contacter le support si le problème persiste.');
      } else if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
        toast.error('Erreur de configuration de la base de données. Veuillez contacter le support.');
      } else {
        toast.error(`Impossible de soumettre les documents: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Afficher un loader pendant la détection du rôle ou l'authentification
  if (authLoading || isDetectingRole) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Vérification des documents</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Merci de fournir les documents requis pour continuer.
          </p>
        </div>
      </div>

      {/* Status Card - Compte vérifié */}
      {isVerified && (
        <Card className="mb-8 border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                  Compte vérifié
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {mode === 'host' 
                    ? 'Votre compte agence a été vérifié. Vous pouvez maintenant utiliser toutes les fonctionnalités.'
                    : 'Votre compte locataire a été vérifié. Vous pouvez maintenant réserver des véhicules.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requirements by mode */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          {mode === 'tenant' ? (
            <div>
              <h3 className="font-semibold mb-2">Documents requis (Locataire)</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Carte nationale d'identité ou passeport</li>
                <li>Permis de conduire</li>
              </ul>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold mb-2">Documents requis (Agence de location)</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Carte nationale d'identité ou passeport</li>
                <li>Carte grise du véhicule</li>
                <li>Assurance en cours de validité</li>
                <li>Visite technique à jour</li>
                <li className="font-medium">Registre de commerce (copie originale conforme)</li>
                <li className="font-medium">Photo du local commercial/agence</li>
                <li className="italic">Optionnels: RIB/justificatif bancaire, photos du véhicule</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Upload Section */}
      <div className="grid gap-6">
        {documentTypes.map(({ type, label, description }) => {
          // Trouver le document correspondant au type et au verification_type
          const doc = documents.find((d: any) => {
            const matchesType = (d.type === type || d.document_type === type);
            const docVerificationType = d.verification_type || d.verificationType;
            return matchesType && docVerificationType === mode;
          });
          
          return (
            <Card key={type} className="relative overflow-hidden">
              {doc?.verified && (
                <div className="absolute top-0 right-0 m-4">
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Vérifié</span>
                  </div>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {label}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                {doc ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {doc.verified ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-orange-500" />
                        )}
                        <span className="text-sm">
                          {doc.verified
                            ? 'Document vérifié'
                            : 'En attente de vérification'}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => window.open(doc.file_url, '_blank')}
                      >
                        Voir le document
                      </Button>
                    </div>
                    
                    {!doc.verified && (
                      <div className="text-sm text-gray-500">
                        La vérification peut prendre jusqu'à 24 heures ouvrées
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        id={`file-${type}`}
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, type)}
                        disabled={loading}
                      />
                      <label
                        htmlFor={`file-${type}`}
                        className="flex-1"
                      >
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                          <Upload className="mx-auto h-8 w-8 text-gray-400" />
                          <p className="mt-2 text-sm font-medium">
                            Cliquez pour sélectionner un fichier
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            PNG, JPG ou PDF jusqu'à 10MB
                          </p>
                        </div>
                      </label>
                    </div>
                    
                    {selectedFile && selectedType === type && (
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <span className="text-sm font-medium truncate">
                            {selectedFile.name}
                          </span>
                        </div>
                        <Button
                          onClick={handleUpload}
                          disabled={loading}
                        >
                          {loading ? 'Envoi...' : 'Envoyer'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submit Button - Afficher seulement si tous les documents sont soumis et compte pas encore vérifié */}
      {!isVerified && allDocumentsSubmitted && (
        <Card className="mt-8 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Tous les documents ont été soumis</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {allDocumentsVerified 
                    ? 'Tous vos documents ont été vérifiés. Votre compte sera validé sous peu.'
                    : 'Vos documents sont en attente de vérification par notre équipe. Cela peut prendre jusqu\'à 24 heures ouvrées.'}
                </p>
              </div>
              {!allDocumentsVerified && (
                <Button
                  onClick={handleSubmitForVerification}
                  disabled={isSubmitting || !allDocumentsSubmitted}
                  className="whitespace-nowrap"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Soumettre à la vérification
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Section */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Informations importantes</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>Tous les documents doivent être clairs et lisibles</li>
              <li>Les documents doivent être en cours de validité</li>
              <li>Les photos doivent être nettes et montrer clairement les détails</li>
              {mode === 'host' && (
                <li>Le registre de commerce doit être une copie originale conforme</li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentVerification;
