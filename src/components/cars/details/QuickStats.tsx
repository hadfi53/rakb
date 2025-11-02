
import { Settings, Fuel, Calendar, Users, Star, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Vehicle } from "@/lib/types";

interface QuickStatsProps {
  vehicle?: Vehicle;
}

const QuickStats = ({ vehicle }: QuickStatsProps) => {
  if (!vehicle) return null;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card className="bg-primary/5">
        <CardContent className="p-3 flex items-center space-x-2">
          <Settings className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-gray-500">Transmission</p>
            <p className="font-medium text-sm">{vehicle.transmission}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-primary/5">
        <CardContent className="p-3 flex items-center space-x-2">
          <Fuel className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-gray-500">Carburant</p>
            <p className="font-medium text-sm">{vehicle.fuel}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-primary/5">
        <CardContent className="p-3 flex items-center space-x-2">
          <Star className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-gray-500">Note</p>
            <p className="font-medium text-sm">
              {vehicle.rating ? vehicle.rating.toFixed(1) : '0.0'} 
              {vehicle.reviews_count ? ` (${vehicle.reviews_count})` : ''}
            </p>
          </div>
        </CardContent>
      </Card>
      {(vehicle as any).bookings_count !== undefined && (
        <Card className="bg-primary/5">
          <CardContent className="p-3 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-gray-500">Voyages</p>
              <p className="font-medium text-sm">{(vehicle as any).bookings_count}</p>
            </div>
          </CardContent>
        </Card>
      )}
      {!(vehicle as any).bookings_count && (
        <Card className="bg-primary/5">
          <CardContent className="p-3 flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-gray-500">Places</p>
              <p className="font-medium text-sm">{vehicle.seats || 5}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuickStats;
