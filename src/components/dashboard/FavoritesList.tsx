import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Car, MapPin, Star, Heart, Trash2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface Favorite {
  id: number;
  car: string;
  location: string;
  price: number;
  rating: number;
  disponible: boolean;
  vehicleId?: string;
}

interface FavoritesListProps {
  favorites: Favorite[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onLocationFilter: (value: string) => void;
  onPriceFilter: (value: string) => void;
  onRemoveFavorite?: (vehicleId: string) => void;
}

export const FavoritesList = ({
  favorites,
  searchTerm,
  onSearchChange,
  onLocationFilter,
  onPriceFilter,
  onRemoveFavorite,
}: FavoritesListProps) => {
  return (
    <Card className="col-span-1">
      <CardHeader className="space-y-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Véhicules favoris</CardTitle>
          <div className="flex gap-2">
            <Select onValueChange={onLocationFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Ville" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Casablanca">Casablanca</SelectItem>
                <SelectItem value="Rabat">Rabat</SelectItem>
                <SelectItem value="Marrakech">Marrakech</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={onPriceFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Prix" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">≤ 800 Dh</SelectItem>
                <SelectItem value="medium">801-1200 Dh</SelectItem>
                <SelectItem value="high">{">"} 1200 Dh</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Input
          placeholder="Rechercher un véhicule..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
      </CardHeader>
      <CardContent>
        {favorites.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Heart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Vous n'avez pas encore de véhicules favoris</p>
            <p className="text-sm mt-2">Explorez notre catalogue et ajoutez des véhicules à vos favoris</p>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((favorite) => (
              <div key={favorite.id} className="flex flex-col p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Car className="h-5 w-5 text-gray-500" />
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
                    <div className="text-right mr-3">
                      <p className="font-bold text-primary">{favorite.price} Dh/jour</p>
                      <span className={`text-xs ${favorite.disponible ? 'text-green-600' : 'text-red-600'}`}>
                        {favorite.disponible ? 'Disponible' : 'Indisponible'}
                      </span>
                    </div>
                    {onRemoveFavorite && favorite.vehicleId && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onRemoveFavorite(favorite.vehicleId!)}
                        className="text-gray-500 hover:text-red-500"
                        title="Retirer des favoris"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {favorite.vehicleId && favorite.disponible && (
                  <div className="mt-3 flex justify-end">
                    <Link to={`/cars/${favorite.vehicleId}`}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Voir détails
                      </Button>
                    </Link>
                    <Link to={`/cars/${favorite.vehicleId}/reserve`} className="ml-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="text-xs"
                      >
                        Réserver
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
