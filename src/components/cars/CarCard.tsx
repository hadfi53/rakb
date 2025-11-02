import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Star, User, Calendar, Shield } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import SocialShare from "./SocialShare";
import { getVehicleImageUrl } from "@/lib/utils";

interface CarCardProps {
  car: {
    id: string;
    name: string;
    image: string;
    price: string;
    location: string;
    rating: number;
    reviews: number; // Keep for backward compatibility
    reviews_count?: number; // Preferred property name
    bookings_count?: number; // Number of trips
    insurance?: string;
  };
  onReserve?: (car: any) => void;
}

const CarCard = ({ car }: CarCardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [imageError, setImageError] = useState(false);

  const handleReservation = (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêche le clic de buller jusqu'à la carte
    window.scrollTo(0, 0);
    navigate({ pathname: `/cars/${car.id}`, search: location.search });
  };

  const handleCardClick = () => {
    // Navigate to the car detail page and scroll to top
    if (import.meta.env.DEV) {
    console.log("Navigating to car detail page for ID:", car.id);
    }
    window.scrollTo(0, 0);
    navigate({ pathname: `/cars/${car.id}`, search: location.search });
  };

  const getImageSrc = () => {
    if (imageError) {
      return '/placeholder.svg';
    }
    // Utiliser getVehicleImageUrl pour générer l'URL correcte depuis Supabase
    return getVehicleImageUrl(car.image);
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-medium transition-all duration-300 cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader className="p-0">
        <div className="relative">
          <img
            src={getImageSrc()}
            alt={car.name}
            className="w-full h-48 object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== '/placeholder.svg' && !imageError) {
                setImageError(true);
                target.src = '/placeholder.svg';
              }
            }}
          />
          <div className="absolute top-4 right-4" onClick={(e) => e.stopPropagation()}>
            <SocialShare car={car} className="bg-white/90 backdrop-blur-sm hover:bg-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{car.name}</h3>
          <div className="flex items-center bg-primary/5 px-2 py-1 rounded-full">
            <Star className="w-4 h-4 text-primary fill-current" />
            <span className="ml-1 text-sm font-medium text-primary">{car.rating}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-primary/70" />
            <span className="text-sm">{car.location}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <User className="w-4 h-4 mr-2 text-primary/70" />
            <span className="text-sm">{car.reviews_count ?? car.reviews ?? 0} avis</span>
          </div>
          {car.bookings_count !== undefined && car.bookings_count > 0 && (
            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 mr-2 text-primary/70" />
              <span className="text-sm">{car.bookings_count} voyage{car.bookings_count > 1 ? 's' : ''}</span>
            </div>
          )}
          {car.insurance && (
            <div className="flex items-center text-gray-600">
              <Shield className="w-4 h-4 mr-2 text-primary/70" />
              <span className="text-sm">{car.insurance}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-6 bg-gray-50 border-t border-gray-100">
        <div className="flex justify-between items-center w-full">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-primary">{car.price} Dh</span>
            <span className="text-sm text-gray-600">/jour</span>
          </div>
          <Button 
            className="bg-primary hover:bg-primary-dark transition-colors"
            onClick={handleReservation}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Réserver
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CarCard;
