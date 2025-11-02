
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/use-profile';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { DocumentType } from '@/types/user';

interface Document {
  type: DocumentType;
  label: string;
  description: string;
  required: boolean;
}

const RENTER_DOCUMENTS: Document[] = [
  {
    type: 'driver_license',
    label: 'Permis de conduire',
    description: 'Permis de conduire en cours de validité (recto-verso)',
    required: true,
  },
  {
    type: 'identity_card',
    label: 'Pièce d\'identité',
    description: 'Carte d\'identité ou passeport en cours de validité',
    required: true,
  },
  {
    type: 'proof_of_address',
    label: 'Justificatif de domicile',
    description: 'De moins de 3 mois (facture électricité, gaz, internet...)',
    required: true,
  },
];

const OWNER_DOCUMENTS: Document[] = [
  {
    type: 'identity',
    label: 'Pièce d\'identité',
    description: 'Carte d\'identité ou passeport en cours de validité',
    required: true,
  },
  {
    type: 'proof_of_address',
    label: 'Justificatif de domicile',
    description: 'De moins de 3 mois (facture électricité, gaz, internet...)',
    required: true,
  },
  {
    type: 'vehicle_registration',
    label: 'Carte grise',
    description: 'Carte grise des véhicules à mettre en location',
    required: true,
  },
  {
    type: 'insurance',
    label: 'Assurance',
    description: 'Attestation d\'assurance en cours de validité',
    required: true,
  },
  {
    type: 'technical_inspection',
    label: 'Visite technique',
    description: 'Contrôle technique à jour',
    required: true,
  },
  {
    type: 'business_premises_photo',
    label: 'Photo du local',
    description: 'Photo de votre local commercial/agence',
    required: true,
  },
  {
    type: 'trade_register',
    label: 'Registre de commerce',
    description: 'Copie originale conforme du registre de commerce',
    required: true,
  },
];

const DocumentUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { handleDocumentUpload } = useProfile();
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [documentStatus, setDocumentStatus] = useState<Record<string, 'pending' | 'approved' | 'rejected'>>({});
  const [userRole, setUserRole] = useState<'renter' | 'owner'>('renter');

  const documents = userRole === 'renter' ? RENTER_DOCUMENTS : OWNER_DOCUMENTS;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      setUploading({ ...uploading, [documentType]: true });
      const file = event.target.files[0];
      const ok = await handleDocumentUpload(documentType as DocumentType, file);
      if (!ok) throw new Error('Upload failed');

      setDocumentStatus(prev => ({ ...prev, [documentType]: 'pending' }));
      
      toast({
        title: "Document téléchargé",
        description: "Votre document a été envoyé pour vérification",
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de télécharger le document",
      });
    } finally {
      setUploading({ ...uploading, [documentType]: false });
    }
  };

  const getStatusIcon = (status?: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Upload className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Vérification des documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documents.map((doc) => (
              <div
                key={doc.type}
                className="p-4 border rounded-lg bg-white/50 backdrop-blur-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{doc.label}</h3>
                    <p className="text-sm text-gray-500">{doc.description}</p>
                  </div>
                  {getStatusIcon(documentStatus[doc.type])}
                </div>
                
                <div className="mt-4">
                  <input
                    type="file"
                    id={`upload-${doc.type}`}
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e, doc.type)}
                    disabled={uploading[doc.type]}
                  />
                  <label
                    htmlFor={`upload-${doc.type}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading[doc.type] ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Envoi en cours...
                      </div>
                    ) : documentStatus[doc.type] ? (
                      'Modifier le document'
                    ) : (
                      'Télécharger le document'
                    )}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentUpload;
