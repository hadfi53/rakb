import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, Clock, AlertCircle, CheckCircle, Fuel } from "lucide-react";

interface PoliciesProps {
  cancellationPolicy?: 'flexible' | 'moderate' | 'strict';
  fuelPolicy?: string;
  mileagePolicy?: string;
  className?: string;
}

export const Policies = ({
  cancellationPolicy = 'moderate',
  fuelPolicy = 'Retourner avec le même niveau de carburant',
  mileagePolicy = 'Kilométrage illimité inclus',
  className = ""
}: PoliciesProps) => {
  const getCancellationText = () => {
    switch (cancellationPolicy) {
      case 'flexible':
        return {
          title: 'Annulation flexible',
          description: 'Annulation gratuite jusqu\'à 48h avant le début de la location. Après ce délai, 50% du montant est remboursé.'
        };
      case 'moderate':
        return {
          title: 'Annulation modérée',
          description: 'Annulation gratuite jusqu\'à 7 jours avant le début de la location. Entre 7 jours et 48h, 50% remboursé. Moins de 48h, pas de remboursement.'
        };
      case 'strict':
        return {
          title: 'Annulation stricte',
          description: 'Annulation gratuite jusqu\'à 30 jours avant. Entre 30 jours et 7 jours, 50% remboursé. Moins de 7 jours, pas de remboursement.'
        };
      default:
        return {
          title: 'Annulation modérée',
          description: 'Annulation gratuite jusqu\'à 48h avant le début de la location.'
        };
    }
  };

  const cancellation = getCancellationText();

  return (
    <div className={`space-y-4 ${className}`}>
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">{cancellation.title}</AlertTitle>
        <AlertDescription className="text-yellow-700 mt-1">
          {cancellation.description}
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Fuel className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-sm">Politique de carburant</p>
            <p className="text-sm text-gray-600">{fuelPolicy}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-sm">Kilométrage</p>
            <p className="text-sm text-gray-600">{mileagePolicy}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-sm">Assurance incluse</p>
            <p className="text-sm text-gray-600">Couverture de base incluse. Options supplémentaires disponibles.</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <p className="text-sm font-medium">Important</p>
        <ul className="text-sm text-gray-600 space-y-1">
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Le véhicule doit être retourné dans le même état qu'au départ</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Photo de l'état des lieux obligatoire au check-in et check-out</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Assistance 24/7 disponible pendant toute la durée de la location</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

