import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/use-profile';
import { FileText, Upload, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { UserDocument } from '@/types/user';

const DocumentVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { documents, uploadDocument, loading } = useProfile();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Déterminer le mode depuis l'URL ou state (automatique, sans possibilité de changement)
  const pathname = location.pathname;
  const isHostPath = pathname === '/verify/host' || pathname.includes('/verify/host');
  const isTenantPath = pathname === '/verify/tenant' || pathname.includes('/verify/tenant');
  const mode: 'tenant' | 'host' = isHostPath || (location.state as any)?.role === 'owner' ? 'host' : 'tenant';
  const [selectedType, setSelectedType] = useState<string>('identity');

  const tenantDocTypes = [
    { type: 'identity', label: "Pièce d'identité", description: "Carte d'identité ou passeport" },
    { type: 'driver_license', label: 'Permis de conduire', description: 'Permis de conduire en cours de validité' },
    { type: 'proof_of_address', label: 'Justificatif de domicile', description: 'Facture récente (≤ 3 mois)' }
  ] as const;

  const hostDocTypes = [
    { type: 'identity', label: "Pièce d'identité", description: "Carte d'identité ou passeport" },
    { type: 'vehicle_registration', label: 'Carte grise', description: "Immatriculation du véhicule" },
    { type: 'insurance', label: 'Assurance', description: 'Attestation en cours de validité' },
    { type: 'technical_inspection', label: 'Visite technique', description: 'Contrôle technique à jour' },
    { type: 'business_premises_photo', label: 'Photo du local', description: 'Photo de votre local commercial/agence' },
    { type: 'trade_register', label: 'Registre de commerce', description: 'Copie originale conforme du registre de commerce' }
  ] as const;

  const documentTypes = useMemo(() => (mode === 'host' ? hostDocTypes : tenantDocTypes), [mode]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    await uploadDocument(selectedType, selectedFile);
    setSelectedFile(null);
  };

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

      {/* Requirements by mode */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          {mode === 'tenant' ? (
            <div>
              <h3 className="font-semibold mb-2">Documents requis (Locataire)</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Pièce d’identité (CIN ou passeport)</li>
                <li>Permis de conduire</li>
                <li>Justificatif de domicile (≤ 3 mois)</li>
                <li className="italic">Optionnels: selfie avec ID, preuve carte bancaire</li>
              </ul>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold mb-2">Documents requis (Agence/Propriétaire)</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Pièce d'identité (CIN ou passeport)</li>
                <li>Carte grise du véhicule</li>
                <li>Assurance en cours de validité</li>
                <li>Visite technique à jour</li>
                <li className="font-medium">Photo du local commercial/agence</li>
                <li className="font-medium">Copie originale conforme du registre de commerce</li>
                <li className="italic">Optionnels: RIB/justificatif bancaire, photos du véhicule</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Upload Section */}
      <div className="grid gap-6">
        {documentTypes.map(({ type, label, description }) => {
          const doc = documents.find(d => (d as any).type === type);
          
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
                        onChange={handleFileChange}
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

      {/* Information Section */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Informations importantes</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>Tous les documents doivent être clairs et lisibles</li>
              <li>Les documents doivent être en cours de validité</li>
              <li>Les selfies doivent montrer clairement votre visage</li>
              <li>Les justificatifs de domicile doivent dater de moins de 3 mois</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentVerification;
