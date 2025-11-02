import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { vehiclesApi } from "@/lib/api";
import { toast } from "sonner";
import { Vehicle } from "@/lib/types";
import VehicleGallery from "@/components/cars/VehicleGallery";
import ReservationDialog from "@/components/cars/ReservationDialog";
import VehicleHeader from "@/components/cars/details/VehicleHeader";
import VehicleFeatures from "@/components/cars/details/VehicleFeatures";
import ReservationCard from "@/components/cars/details/ReservationCard";
import CustomerReviews from "@/components/cars/details/CustomerReviews";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFavorites } from "@/hooks/use-favorites";
import { useAuth } from "@/contexts/AuthContext";
import { VerificationBanner } from "@/components/VerificationBanner";
import { MapPin, Navigation, Fuel, Users, Briefcase as BriefcaseIcon, Gauge as GaugeIcon, Paintbrush as PaletteIcon, Settings as SettingsIcon } from "lucide-react";
import { getVehicleImagesUrls } from "@/lib/utils";

import QuickStats from "@/components/cars/details/QuickStats";
import MobileOwnerCard from "@/components/cars/details/MobileOwnerCard";
import MobileReviews from "@/components/cars/details/MobileReviews";
import MobileBottomBar from "@/components/cars/details/MobileBottomBar";
import OwnerInfo from "@/components/cars/details/OwnerInfo";
import RentalConditions from "@/components/cars/details/RentalConditions";
import VehicleAvailabilityCalendar from "@/components/cars/VehicleAvailabilityCalendar";

const CarDetail = () => {
  const { id } = useParams();
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isVerifiedTenant, setIsVerifiedTenant] = useState<boolean | null>(null);
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, isVerifiedTenant: checkVerifiedTenant, getUserRole } = useAuth();
  const { 
    isFavorite: isFavoriteInDb,
    toggleFavorite,
    getFavorites
  } = useFavorites();

  // Check verification status
  useEffect(() => {
    const checkVerification = async () => {
      if (user) {
        setIsCheckingVerification(true);
        const verified = await checkVerifiedTenant();
        setIsVerifiedTenant(verified);
        setIsCheckingVerification(false);
      } else {
        setIsVerifiedTenant(null);
        setIsCheckingVerification(false);
      }
    };
    checkVerification();
  }, [user, checkVerifiedTenant]);

  const { data: vehicle, isLoading, error } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehiclesApi.getVehicle(id || ''),
    enabled: !!id,
  });

  // Vérifier si le véhicule est dans les favoris au chargement
  useEffect(() => {
    if (id && user) {
      const checkFavoriteStatus = async () => {
        const isInFavorites = isFavoriteInDb(id);
        setIsFavorite(isInFavorites);
      };
      
      checkFavoriteStatus();
    }
  }, [id, user, isFavoriteInDb]);

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour ajouter des favoris");
      navigate('/auth/login');
      return;
    }

    if (!id) return;

    try {
      const success = await toggleFavorite(id);
      if (success) {
        setIsFavorite(!isFavorite);
        // Rafraîchir la liste des favoris pour mettre à jour le tableau de bord
        await getFavorites();
      }
    } catch (error) {
      console.error("Erreur lors de la modification des favoris:", error);
      toast.error("Une erreur est survenue lors de la modification des favoris");
    }
  };

  // Fonction pour gérer la réservation avec vérification du rôle
  const handleReserve = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour réserver un véhicule");
      navigate('/auth/login');
      return;
    }

    // Vérifier si l'utilisateur est une agence
    try {
      const userRole = await getUserRole();
      if (userRole === 'owner') {
        toast.error(
          "Les agences de location ne peuvent pas réserver de véhicules. Vous devez utiliser un compte personnel (locataire) pour effectuer une réservation.",
          { duration: 5000 }
        );
        return;
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du rôle:', error);
    }

    if (user && isVerifiedTenant === false) {
      toast.error("Vérification requise pour réserver un véhicule");
      navigate("/verify/tenant");
      return;
    }

    setIsReservationOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-[40vh] md:h-[60vh] bg-gray-200 rounded-lg mb-8" />
            <div className="h-8 bg-gray-200 w-1/3 rounded mb-4" />
            <div className="h-4 bg-gray-200 w-1/4 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("Error fetching vehicle:", error);
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Erreur lors du chargement
          </h1>
          <p className="text-gray-600 mb-4">
            Une erreur s'est produite lors du chargement des détails du véhicule.
          </p>
          <Button onClick={() => navigate(-1)}>
            Retourner à la recherche
          </Button>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return <div>Loading...</div>;
  }

  // Formater les URLs des images depuis Supabase Storage
  const vehicleImages = getVehicleImagesUrls(vehicle.images);

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 pb-24">
        <VehicleGallery images={vehicleImages} />
        
        <div className="px-4 py-6">
          <VehicleHeader 
            vehicle={vehicle}
            isFavorite={isFavorite}
            onToggleFavorite={handleToggleFavorite}
          />
          
          <div className="space-y-6 mt-6">
            <QuickStats vehicle={vehicle} />
            
            <Card>
              <CardContent className="p-4">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Le véhicule</h2>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">Marque</span>
                          <span className="font-medium">{vehicle.make || "Non spécifié"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">Modèle</span>
                          <span className="font-medium">{vehicle.model || "Non spécifié"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">Année</span>
                          <span className="font-medium">{vehicle.year || "Non spécifié"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold mb-2">Description</h2>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-600 whitespace-pre-line">
                        {vehicle.description || "Aucune description disponible pour ce véhicule."}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold mb-2">Caractéristiques</h2>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <SettingsIcon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500">Transmission</span>
                            <span className="font-medium">{vehicle.transmission || "Non spécifié"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Fuel className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500">Carburant</span>
                            <span className="font-medium">{vehicle.fuel_type || "Non spécifié"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500">Places</span>
                            <span className="font-medium">{vehicle.seats || "Non spécifié"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <BriefcaseIcon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500">Bagages</span>
                            <span className="font-medium">{vehicle.luggage || "Non spécifié"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <GaugeIcon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500">Kilométrage</span>
                            <span className="font-medium">{vehicle.mileage ? `${vehicle.mileage} km` : "Non spécifié"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <PaletteIcon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500">Couleur</span>
                            <span className="font-medium">{vehicle.color || "Non spécifié"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-4">Équipements</h2>
                <VehicleFeatures features={vehicle.features} />
              </CardContent>
            </Card>
            
            <MobileOwnerCard owner={vehicle.owner} />
            
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-4">Localisation</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>{vehicle.location || "Emplacement non spécifié"}</span>
                  </div>
                  <div className="h-[250px] rounded-lg overflow-hidden bg-gray-100 relative">
                    <div className="absolute inset-0 bg-[url('/map-placeholder.jpg')] bg-cover bg-center" />
                    <div className="absolute top-2 right-2">
                      <Button variant="secondary" size="sm" className="shadow-lg">
                        <MapPin className="w-4 h-4 mr-2" />
                        Voir sur la carte
                      </Button>
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <Button variant="secondary" size="sm" className="shadow-lg">
                        <Navigation className="w-4 h-4 mr-2" />
                        Itinéraire
                      </Button>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-4">Conditions de location</h2>
                <RentalConditions />
              </CardContent>
            </Card>
            
            <MobileReviews rating={vehicle.rating} reviewsCount={vehicle.reviews_count} vehicleId={vehicle.id} />
          </div>
        </div>
        
        {user && isVerifiedTenant === false && !isCheckingVerification && (
          <div className="px-4 pb-4">
            <VerificationBanner type="tenant" blocking={true} />
          </div>
        )}
        <MobileBottomBar 
          vehicle={vehicle}
          onReserve={handleReserve}
        />
        
        <ReservationDialog
          vehicle={vehicle}
          open={isReservationOpen}
          onOpenChange={setIsReservationOpen}
        />
      </div>
    );
  }

  // Version desktop
  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <VehicleGallery images={vehicleImages} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-8">
            <VehicleHeader 
              vehicle={vehicle}
              isFavorite={isFavorite}
              onToggleFavorite={handleToggleFavorite}
            />
            
            <QuickStats vehicle={vehicle} />
            
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <p className="text-gray-600 whitespace-pre-line">
                  {vehicle.description || "Aucune description disponible pour ce véhicule."}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Caractéristiques</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <SettingsIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Transmission</p>
                      <p className="font-medium">{vehicle.transmission || "Non spécifié"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Fuel className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Carburant</p>
                      <p className="font-medium">{vehicle.fuel_type || "Non spécifié"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Places</p>
                      <p className="font-medium">{vehicle.seats || "Non spécifié"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <BriefcaseIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Bagages</p>
                      <p className="font-medium">{vehicle.luggage || "Non spécifié"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <GaugeIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Kilométrage</p>
                      <p className="font-medium">{vehicle.mileage ? `${vehicle.mileage} km` : "Non spécifié"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <PaletteIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Couleur</p>
                      <p className="font-medium">{vehicle.color || "Non spécifié"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Équipements</h2>
                <VehicleFeatures features={vehicle.features} />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Localisation</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>{vehicle.location || "Emplacement non spécifié"}</span>
                  </div>
                  <div className="h-[400px] rounded-lg overflow-hidden bg-gray-100 relative">
                    <div className="absolute inset-0 bg-[url('/map-placeholder.jpg')] bg-cover bg-center" />
                    <div className="absolute top-4 right-4">
                      <Button variant="secondary" size="sm" className="shadow-lg">
                        <MapPin className="w-4 h-4 mr-2" />
                        Voir sur la carte
                      </Button>
                    </div>
                    <div className="absolute bottom-4 right-4">
                      <Button variant="secondary" size="sm" className="shadow-lg">
                        <Navigation className="w-4 h-4 mr-2" />
                        Itinéraire
                      </Button>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Conditions de location</h2>
                <RentalConditions />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <VehicleAvailabilityCalendar vehicle={vehicle} />
              </CardContent>
            </Card>
            
            <CustomerReviews rating={vehicle.rating} reviewsCount={vehicle.reviews_count} vehicleId={vehicle.id} />
          </div>
          
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {user && isVerifiedTenant === false && !isCheckingVerification && (
                <VerificationBanner type="tenant" blocking={true} />
              )}
              <ReservationCard 
                vehicle={vehicle}
                onReserve={handleReserve}
              />
              {vehicle.owner && (
                <OwnerInfo owner={vehicle.owner} className="mt-6" />
              )}
            </div>
          </div>
        </div>
      </div>
      
      <ReservationDialog
        vehicle={vehicle}
        open={isReservationOpen}
        onOpenChange={setIsReservationOpen}
      />
    </div>
  );
};

export default CarDetail;
