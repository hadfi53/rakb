
import { Button } from "@/components/ui/button";
import { Car, CalendarIcon, MapPin, CheckCircle } from "lucide-react";

interface ConfirmationCardProps {
  car: any;
  startDate?: Date;
  endDate?: Date;
  email: string;
  total: number;
}

export const ConfirmationCard = ({ car, startDate, endDate, email, total }: ConfirmationCardProps) => {
  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <Car className="w-4 h-4 text-primary" />
        Détails de la réservation
      </h4>
      
      <div className="space-y-3 text-sm">
        <div className="flex justify-between pb-2 border-b">
          <span className="text-gray-600">Numéro de réservation</span>
          <span className="font-medium">RAK-{Math.floor(Math.random() * 1000000)}</span>
        </div>
        
        <div className="grid gap-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Véhicule</span>
            <span className="font-medium">{car?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Dates</span>
            <span className="font-medium">
              {startDate?.toLocaleDateString()} - {endDate?.toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Lieu de prise en charge</span>
            <span className="font-medium">{car?.location}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Montant payé</span>
            <span className="font-medium text-primary">{total} Dh</span>
          </div>
        </div>
      </div>
      
      <div className="pt-2 space-y-2">
        <Button variant="outline" className="w-full gap-2">
          <CalendarIcon className="w-4 h-4" />
          Ajouter au calendrier
        </Button>
        <Button variant="outline" className="w-full gap-2">
          <MapPin className="w-4 h-4" />
          Voir l'itinéraire
        </Button>
      </div>
    </div>
  );
};

export const ConfirmationSummary = ({ email }: { email: string }) => {
  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Réservation confirmée !</h3>
      <p className="text-gray-600">
        Votre réservation a été confirmée. Un email de confirmation a été envoyé à {email}
      </p>
    </div>
  );
};
