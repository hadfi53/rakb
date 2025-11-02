
import { Car, MapPin, Star, Users, Clock } from "lucide-react";

interface VehicleInfoCardProps {
  car: any;
}

export const VehicleInfoCard = ({ car }: VehicleInfoCardProps) => {
  return (
    <div className="p-4 border rounded-lg bg-primary/5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <Car className="w-4 h-4 text-primary" />
          Détails du véhicule
        </h3>
        {car?.rating && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="font-medium">{car.rating}</span>
          </div>
        )}
      </div>
      
      <div className="flex flex-col space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center text-gray-700">
            <Car className="w-4 h-4 mr-2 text-gray-500" />
            <span>{car?.name}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <MapPin className="w-4 h-4 mr-2 text-gray-500" />
            <span>{car?.location}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center text-gray-700">
            <Users className="w-4 h-4 mr-2 text-gray-500" />
            <span>{car?.seats || "5"} places</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Clock className="w-4 h-4 mr-2 text-gray-500" />
            <span>Confirmation instantanée</span>
          </div>
        </div>
      </div>
    </div>
  );
};
