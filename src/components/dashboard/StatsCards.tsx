
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Heart, History } from "lucide-react";

interface StatsCardsProps {
  activeReservations: number;
  favoritesCount: number;
  totalRentals: number;
}

export const StatsCards = ({ activeReservations, favoritesCount, totalRentals }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Réservations en cours</CardTitle>
          <Clock className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeReservations}</div>
          <p className="text-xs text-gray-500">Véhicules actuellement loués</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Favoris</CardTitle>
          <Heart className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{favoritesCount}</div>
          <p className="text-xs text-gray-500">Véhicules sauvegardés</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total des locations</CardTitle>
          <History className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRentals}</div>
          <p className="text-xs text-gray-500">Locations effectuées</p>
        </CardContent>
      </Card>
    </div>
  );
};
