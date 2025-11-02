import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Search, MapPin, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";
import { useAuth } from "@/contexts/AuthContext";

const Favorites = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites, loading, getFavorites, toggleFavorite } = useFavorites();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");

  useEffect(() => {
    if (!user) {
      navigate("/auth/login");
      return;
    }
    getFavorites();
  }, [user, navigate, getFavorites]);

  // Filtrer les favoris en fonction des critères
  const filteredFavorites = favorites.filter(favorite => {
    const matchesSearch = favorite.car.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !locationFilter || locationFilter === "all" || favorite.location === locationFilter;
    const matchesPrice = !priceFilter || priceFilter === "all" || (
      priceFilter === "low" ? favorite.price <= 800 :
      priceFilter === "medium" ? favorite.price > 800 && favorite.price <= 1200 :
      favorite.price > 1200
    );
    return matchesSearch && matchesLocation && matchesPrice;
  });

  // Obtenir la liste unique des villes pour le filtre
  const locations = Array.from(new Set(favorites.map(f => f.location))).filter(Boolean);

  const handleRemoveFavorite = async (vehicleId: string) => {
    await toggleFavorite(vehicleId);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Mes véhicules favoris</h1>

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-lg">
                {filteredFavorites.length} véhicule{filteredFavorites.length !== 1 ? 's' : ''} favori{filteredFavorites.length !== 1 ? 's' : ''}
              </CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Ville" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Prix" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="low">≤ 800 Dh</SelectItem>
                    <SelectItem value="medium">801-1200 Dh</SelectItem>
                    <SelectItem value="high">{"> "}1200 Dh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Rechercher un véhicule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                <p className="mt-2 text-sm text-gray-500">Chargement de vos favoris...</p>
              </div>
            ) : filteredFavorites.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Heart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Vous n'avez pas encore de véhicules favoris</p>
                <p className="text-sm mt-2">Explorez notre catalogue et ajoutez des véhicules à vos favoris</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate('/cars')}
                >
                  Explorer les véhicules
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFavorites.map((favorite) => (
                  <div key={favorite.id} className="flex flex-col p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium">{favorite.car}</p>
                          <div className="flex items-center text-sm text-gray-500 space-x-2">
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {favorite.location}
                            </span>
                            <span className="flex items-center">
                              <Star className="h-4 w-4 mr-1 text-yellow-400 fill-yellow-400" />
                              {favorite.rating}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="text-right mr-4">
                          <p className="font-bold text-primary">{favorite.price} Dh/jour</p>
                          <span className={`text-xs ${favorite.disponible ? 'text-green-600' : 'text-red-600'}`}>
                            {favorite.disponible ? 'Disponible' : 'Indisponible'}
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => favorite.vehicleId && handleRemoveFavorite(favorite.vehicleId)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <Heart className="h-4 w-4 fill-current" />
                        </Button>
                      </div>
                    </div>
                    
                    {favorite.vehicleId && favorite.disponible && (
                      <div className="mt-3 flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/cars/${favorite.vehicleId}`)}
                        >
                          Voir détails
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => navigate(`/cars/${favorite.vehicleId}/reserve`)}
                        >
                          Réserver
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Favorites; 