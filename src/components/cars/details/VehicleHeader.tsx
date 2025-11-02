import { Link } from "react-router-dom";
import { Heart, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Vehicle } from "@/lib/types";
import SocialShare from "@/components/cars/SocialShare";
import { toast } from "sonner";

interface VehicleHeaderProps {
  vehicle: Vehicle;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const VehicleHeader = ({ vehicle, isFavorite, onToggleFavorite }: VehicleHeaderProps) => {
  return (
    <>
      <div className="mb-8 flex justify-between items-center">
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-gray-600 hover:text-primary transition-colors"
        >
          ← Retour aux résultats
        </Link>
        <div className="flex gap-2">
          <SocialShare car={{
            name: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
            price: String(vehicle.price_per_day ?? vehicle.price ?? 0),
            location: vehicle.location,
          }} />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onToggleFavorite}
          >
            <Heart 
              className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-primary text-primary' : ''}`} 
            />
            {isFavorite ? 'Favori' : 'Ajouter aux favoris'}
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {vehicle.brand} {vehicle.model} {vehicle.year}
          </h1>
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{vehicle.location}</span>
          </div>
        </div>
        <div className="flex items-center bg-primary/5 px-3 py-1 rounded-full">
          <Star className="w-4 h-4 text-primary fill-current" />
          <span className="ml-1 font-medium text-primary">
            {vehicle.rating ? vehicle.rating.toFixed(1) : '0.0'}
          </span>
          {vehicle.reviews_count && vehicle.reviews_count > 0 && (
            <span className="ml-1 text-xs text-gray-600">({vehicle.reviews_count})</span>
          )}
        </div>
      </div>
    </>
  );
};

export default VehicleHeader;
