import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { Vehicle } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Car, 
  Edit, 
  Navigation,
  ExternalLink,
  Image as ImageIcon
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn, getVehicleImageUrl, getVehicleImagesUrls } from "@/lib/utils";

interface BookingSummaryProps {
  vehicle: Vehicle;
  dateRange?: DateRange;
  pickupLocation: string;
  returnLocation: string;
  basePrice: number;
  serviceFee: number;
  totalPrice: number;
  durationDays: number;
  onEdit?: () => void;
  editable?: boolean;
}

const BookingSummary = ({
  vehicle,
  dateRange,
  pickupLocation,
  returnLocation,
  basePrice,
  serviceFee,
  totalPrice,
  durationDays,
  onEdit,
  editable = false
}: BookingSummaryProps) => {
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [showVehicleDetails, setShowVehicleDetails] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const handleLocationClick = (location: string) => {
    setSelectedLocation(location);
    setShowMapDialog(true);
  };

  const getMapUrl = (location: string) => {
    // Générer une URL Google Maps pour la localisation
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  };

  return (
    <div className="space-y-4">
      {/* Vehicle Details Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Détails du véhicule
            </CardTitle>
            {editable && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8"
              >
                <Edit className="h-4 w-4 mr-1" />
                Modifier
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="flex gap-4 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
            onClick={() => setShowVehicleDetails(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setShowVehicleDetails(true);
              }
            }}
            aria-label="Voir les détails du véhicule"
          >
            {vehicle.images && vehicle.images.length > 0 ? (
              <img
                src={getVehicleImageUrl(vehicle.images[0])}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-24 h-24 object-cover rounded-lg"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">
                {vehicle.make} {vehicle.model} {vehicle.year}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {vehicle.location}
              </p>
              {vehicle.rating && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-sm font-medium">{vehicle.rating}</span>
                  <span className="text-sm text-gray-500">
                    ({vehicle.reviews_count || 0} avis)
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dates Card */}
      {dateRange?.from && dateRange?.to && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Période de location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Du</span>
                <span className="font-medium">
                  {format(dateRange.from, "EEEE d MMMM yyyy", { locale: fr })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Au</span>
                <span className="font-medium">
                  {format(dateRange.to, "EEEE d MMMM yyyy", { locale: fr })}
                </span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Durée</span>
                  <Badge variant="secondary">
                    {durationDays} {durationDays > 1 ? "jours" : "jour"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locations Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Lieux de prise en charge et retour
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pickup Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Lieu de prise en charge
            </label>
            <div
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
              onClick={() => handleLocationClick(pickupLocation)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleLocationClick(pickupLocation);
                }
              }}
              aria-label={`Voir ${pickupLocation} sur la carte`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium truncate">{pickupLocation}</span>
              </div>
              <Navigation className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" />
            </div>
          </div>

          {/* Return Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Lieu de retour
            </label>
            <div
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
              onClick={() => handleLocationClick(returnLocation)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleLocationClick(returnLocation);
                }
              }}
              aria-label={`Voir ${returnLocation} sur la carte`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium truncate">{returnLocation}</span>
              </div>
              <Navigation className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Récapitulatif du prix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {vehicle.price_per_day} MAD × {durationDays} {durationDays > 1 ? "jours" : "jour"}
              </span>
              <span className="font-medium">{basePrice.toLocaleString()} MAD</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Frais de service</span>
              <span className="font-medium">{serviceFee.toLocaleString()} MAD</span>
            </div>
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-base">Total</span>
                <span className="text-xl font-bold text-primary">
                  {totalPrice.toLocaleString()} MAD
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Dialog */}
      <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Localisation sur la carte</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {selectedLocation}
            </p>
            <div className="h-[400px] rounded-lg overflow-hidden bg-gray-100 relative">
              {/* Placeholder pour la carte - à remplacer par une vraie intégration de carte */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-primary mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">{selectedLocation}</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (selectedLocation) {
                        window.open(getMapUrl(selectedLocation), '_blank');
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ouvrir dans Google Maps
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vehicle Details Dialog */}
      <Dialog open={showVehicleDetails} onOpenChange={setShowVehicleDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {vehicle.make} {vehicle.model} {vehicle.year}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {vehicle.images && vehicle.images.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {vehicle.images.slice(0, 4).map((image, index) => (
                  <img
                    key={index}
                    src={getVehicleImageUrl(image)}
                    alt={`${vehicle.make} ${vehicle.model} - Photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
            {vehicle.description && (
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {vehicle.description}
                </p>
              </div>
            )}
            {vehicle.features && vehicle.features.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Équipements</h4>
                <div className="flex flex-wrap gap-2">
                  {vehicle.features.map((feature, index) => (
                    <Badge key={index} variant="secondary">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingSummary;
