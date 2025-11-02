import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ShieldCheck, ArrowRight } from "lucide-react";

interface VerificationBannerProps {
  type: 'tenant' | 'host';
  blocking?: boolean;
  className?: string;
}

export const VerificationBanner = ({ type, blocking = true, className = "" }: VerificationBannerProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const isTenant = type === 'tenant';
  const verificationPath = isTenant ? '/verify/tenant' : '/verify/host';
  const title = isTenant 
    ? 'Vérification locataire requise' 
    : 'Vérification agence requise';
  const description = isTenant
    ? 'Vous devez être vérifié en tant que locataire pour réserver un véhicule. Soumettez vos documents (ID/passport, permis de conduire, justificatif de domicile) pour continuer.'
    : 'Vous devez être vérifié en tant qu\'agence pour ajouter et gérer des véhicules. Soumettez vos documents (ID/passport, carte grise, assurance, contrôle technique) pour continuer.';

  return (
    <Alert 
      variant={blocking ? "destructive" : "default"} 
      className={`${className} ${blocking ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'}`}
    >
      <AlertCircle className={`h-4 w-4 ${blocking ? 'text-red-600' : 'text-yellow-600'}`} />
      <AlertTitle className={`${blocking ? 'text-red-800' : 'text-yellow-800'}`}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          {title}
        </div>
      </AlertTitle>
      <AlertDescription className={`${blocking ? 'text-red-700' : 'text-yellow-700'} mt-2`}>
        <p className="mb-3">{description}</p>
        <Button
          onClick={() => navigate(verificationPath)}
          variant={blocking ? "default" : "outline"}
          size="sm"
          className={`${blocking ? 'bg-red-600 hover:bg-red-700' : ''}`}
        >
          {isTenant ? 'Vérifier mon compte locataire' : 'Vérifier mon compte agence'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
};

