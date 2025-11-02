
import { Info, Key, Shield, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const RentalPolicy = () => {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Politique d'annulation</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
            <Shield className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-800">Annulation flexible</h3>
              <p className="text-sm text-green-700">
                Annulation gratuite jusqu'à 24h avant le début de la location.
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium">Conditions de remboursement :</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <Check className="w-4 h-4 mr-2 mt-0.5 text-primary" />
                <span>Annulation plus de 24h avant : remboursement à 100%</span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 mr-2 mt-0.5 text-primary" />
                <span>Annulation entre 12h et 24h avant : remboursement à 50%</span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 mr-2 mt-0.5 text-primary" />
                <span>Annulation moins de 12h avant : aucun remboursement</span>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RentalPolicy;
