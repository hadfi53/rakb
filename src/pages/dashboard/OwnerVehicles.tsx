import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Plus, Edit, Calendar, BarChart3, MoreVertical } from "lucide-react";
import { useVehicle } from "@/hooks/use-vehicle";
import { Vehicle } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VehicleStatusBadge } from "@/components/vehicle/VehicleStatusBadge";
import { VehiclePublicationStatus } from "@/types/vehicle";
import { getVehicleImageUrl } from "@/lib/utils";

const OwnerVehicles = () => {
  const { getOwnerVehicles, vehicles, loading } = useVehicle();

  useEffect(() => {
    getOwnerVehicles();
  }, [getOwnerVehicles]);

  // Refresh when component becomes visible (e.g., after navigation from edit)
  useEffect(() => {
    const handleFocus = () => {
      getOwnerVehicles();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [getOwnerVehicles]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de vos véhicules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Car className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Mes véhicules</h1>
          </div>
          <Link to="/cars/add">
            <Button variant="default" size="sm" className="flex items-center gap-2 font-medium">
              <Plus className="h-4 w-4" />
              Ajouter un véhicule
            </Button>
          </Link>
        </div>
      </div>

      {/* Contenu Principal */}
      <div className="container mx-auto px-4 py-8">
        {vehicles && vehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle: Vehicle) => (
              <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={getVehicleImageUrl(
                      vehicle.image_url || 
                      (vehicle.images && vehicle.images.length > 0 ? vehicle.images[0] : undefined)
                    )}
                    alt={`${vehicle.brand || vehicle.make} ${vehicle.model}`}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== '/placeholder.svg') {
                        console.warn('Image failed to load:', target.src);
                        target.src = '/placeholder.svg';
                      }
                    }}
                  />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">
                        {vehicle.brand} {vehicle.model} {vehicle.year}
                      </h3>
                      {vehicle.publication_status && (
                        <VehicleStatusBadge 
                          status={vehicle.publication_status as VehiclePublicationStatus} 
                          className="mt-1"
                        />
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/cars/${vehicle.id}`}>
                            Voir les détails
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/cars/${vehicle.id}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/cars/${vehicle.id}/availability`}>
                            <Calendar className="w-4 h-4 mr-2" />
                            Disponibilité
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/cars/${vehicle.id}/stats`}>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Statistiques
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Car className="w-4 h-4 mr-1" />
                    {vehicle.location}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">
                      {vehicle.price_per_day} DH/jour
                    </span>
                    <div className="flex gap-2">
                      <Link to={`/cars/${vehicle.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-3 h-3 mr-1" />
                          Modifier
                        </Button>
                      </Link>
                      <Link to={`/cars/${vehicle.id}/availability`}>
                        <Button variant="outline" size="sm">
                          <Calendar className="w-3 h-3" />
                        </Button>
                      </Link>
                      <Link to={`/cars/${vehicle.id}/stats`}>
                        <Button variant="outline" size="sm">
                          <BarChart3 className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Aucun véhicule</h2>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas encore ajouté de véhicule à votre flotte.
            </p>
            <Link to="/cars/add">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un véhicule
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerVehicles; 