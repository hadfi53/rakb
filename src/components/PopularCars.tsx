import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CarCard from "./cars/CarCard";
import ReservationDialog from "./cars/ReservationDialog";
import { vehiclesApi } from "@/lib/api";
import { getVehicleImageUrl } from "@/lib/utils";
import { Vehicle } from "@/types/vehicle";

const PopularCars = () => {
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Récupérer les véhicules disponibles depuis Supabase
  const { data: vehicles, isLoading, error } = useQuery({
    queryKey: ['popular-vehicles'],
    queryFn: () => vehiclesApi.getVehicles(),
  });

  const handleReservation = (car: any) => {
    setSelectedCar(car);
    setIsDialogOpen(true);
  };

  // Transformer les véhicules en format CarCard et les trier par popularité
  const popularCars = vehicles
    ? vehicles
        // Filtrer seulement les véhicules disponibles et avec un statut actif
        .filter((vehicle: Vehicle) => {
          return (
            vehicle.status === 'available' &&
            (vehicle.publication_status === 'active' || vehicle.publication_status === 'published' || !vehicle.publication_status)
          );
        })
        // Trier par popularité (rating + nombre de reviews)
        .sort((a: Vehicle, b: Vehicle) => {
          const scoreA = (a.rating || 0) * 10 + (a.reviews_count || 0);
          const scoreB = (b.rating || 0) * 10 + (b.reviews_count || 0);
          return scoreB - scoreA;
        })
        // Prendre les 3 premiers
        .slice(0, 3)
        // Transformer en format CarCard
        .map((vehicle: Vehicle) => ({
          id: vehicle.id,
          name: vehicle.name || `${vehicle.brand || vehicle.make} ${vehicle.model} ${vehicle.year}`,
          image: getVehicleImageUrl(vehicle.image_url || (vehicle.images && vehicle.images.length > 0 ? vehicle.images[0] : undefined)),
          price: vehicle.price_per_day?.toString() || vehicle.price?.toString() || "0",
          location: vehicle.location || "Non spécifié",
          rating: vehicle.rating || 0,
          reviews: vehicle.reviews_count || 0,
          insurance: "Tous risques incluse",
          minDuration: "3 jours",
        }))
    : [];

  return (
    <section id="popular" className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
            Véhicules populaires
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Découvrez les véhicules les plus appréciés par notre communauté
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Erreur lors du chargement des véhicules populaires</p>
          </div>
        ) : popularCars.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Aucun véhicule populaire disponible pour le moment</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {popularCars.map((car, index) => (
              <div
                key={car.id}
                className="animate-fadeIn h-full"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <CarCard car={car} onReserve={handleReservation} />
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCar && (
        <ReservationDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          car={selectedCar}
        />
      )}
    </section>
  );
};

export default PopularCars;
