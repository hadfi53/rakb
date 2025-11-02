
import { File, Upload, CheckCircle, XCircle, AlertCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserDocument, DocumentType } from '@/types/user';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';

interface DocumentsSectionProps {
  documents: UserDocument[];
  role: 'owner' | 'renter';
  onUpload: (type: DocumentType, file: File) => Promise<void>;
}

export const DocumentsSection = ({ documents, role, onUpload }: DocumentsSectionProps) => {
  const isMobile = useIsMobile();
  
  const requiredDocuments: { type: DocumentType; label: string; description: string }[] = role === 'renter' 
    ? [
        { type: 'driver_license' as DocumentType, label: 'Permis de conduire', description: 'Recto-verso, en cours de validité' },
        { type: 'identity_card' as DocumentType, label: "Carte d'identité", description: 'Ou passeport en cours de validité' },
        { type: 'selfie_with_id' as DocumentType, label: "Selfie avec pièce d'identité", description: 'Pour éviter les fraudes' },
      ]
    : [
        { type: 'identity_card' as DocumentType, label: "Carte d'identité", description: 'Ou passeport en cours de validité' },
        { type: 'bank_details' as DocumentType, label: 'RIB / IBAN', description: 'Pour recevoir vos paiements' },
        { type: 'vehicle_registration' as DocumentType, label: 'Carte grise', description: 'De votre véhicule à mettre en location' },
        { type: 'insurance' as DocumentType, label: 'Assurance', description: 'Attestation en cours de validité' },
      ];

  const getDocumentStatus = (type: DocumentType) => {
    const doc = documents.find(d => d.document_type === type);
    return doc?.status || 'pending';
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, type: DocumentType) => {
    const file = event.target.files?.[0];
    if (file) {
      await onUpload(type, file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Documents obligatoires</h3>
        <Badge variant="outline" className="flex items-center gap-1 px-2">
          <Shield className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs">Sécurisé</span>
        </Badge>
      </div>
      
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
        {requiredDocuments.map(({ type, label, description }) => {
          const status = getDocumentStatus(type);
          
          return (
            <div key={type} className="p-4 border rounded-lg space-y-2 transition-all duration-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <File className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{label}</span>
                </div>
                {status === 'verified' && <CheckCircle className="h-5 w-5 text-green-500" />}
                {status === 'pending' && <AlertCircle className="h-5 w-5 text-yellow-500" />}
                {status === 'rejected' && <XCircle className="h-5 w-5 text-red-500" />}
              </div>
              
              <p className="text-sm text-muted-foreground">{description}</p>
              
              <div>
                <input
                  type="file"
                  id={`upload-${type}`}
                  className="hidden"
                  onChange={(e) => handleFileChange(e, type)}
                  accept="image/*,.pdf"
                />
                <label htmlFor={`upload-${type}`}>
                  <Button variant={status === 'verified' ? "outline" : "default"} className="w-full" asChild size={isMobile ? "sm" : "default"}>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {status === 'verified' ? 'Remplacer' : 'Téléverser'}
                    </span>
                  </Button>
                </label>
              </div>
              
              {status === 'rejected' && (
                <p className="text-xs text-red-500 mt-2">
                  Document refusé. Veuillez télécharger un nouveau document.
                </p>
              )}
              
              {status === 'pending' && (
                <p className="text-xs text-yellow-500 mt-2">
                  Document en cours de vérification.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
