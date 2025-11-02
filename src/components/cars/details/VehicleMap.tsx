
import { useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Vehicle } from '@/lib/types';
import { MapPin } from "lucide-react";

interface VehicleMapProps {
  vehicle?: Vehicle;
}

const VehicleMap = ({ vehicle }: VehicleMapProps) => {
  // Instead of trying to use mapbox which requires environment variables,
  // let's display a simple placeholder map for now
  if (!vehicle) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Localisation</h2>
        <div className="relative w-full h-[300px] rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-medium">{vehicle.location}</p>
            <p className="text-sm text-gray-500 mt-1">
              Coordonnées: {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleMap;
