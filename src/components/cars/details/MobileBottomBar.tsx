import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, Shield } from "lucide-react";
import { Vehicle } from "@/lib/types";

interface MobileBottomBarProps {
  vehicle?: Vehicle;
  onReserve: () => void;
}

const MobileBottomBar = ({ vehicle, onReserve }: MobileBottomBarProps) => {
  if (!vehicle) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 z-10 shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold text-primary">
              {vehicle.price_per_day ?? vehicle.price ?? 0} Dh
            </span>
            <span className="text-sm text-gray-500">/jour</span>
          </div>
          <div className="flex items-center mt-1">
            <Shield className="w-4 h-4 text-primary mr-1" />
            <span className="text-xs text-gray-600">Assurance incluse</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm ml-1 font-medium">{vehicle.rating || "4.9"}</span>
          </div>
          <span className="text-xs text-gray-500">({vehicle.reviews_count || 0} avis)</span>
        </div>
      </div>
      <Button 
        className="w-full bg-primary hover:bg-primary/90 text-white font-medium h-12 text-lg"
        onClick={onReserve}
      >
        Réserver maintenant
      </Button>
    </div>
  );
};

export default MobileBottomBar;
