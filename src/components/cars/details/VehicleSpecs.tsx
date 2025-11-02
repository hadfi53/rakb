
import { Settings, Fuel, Users, Gauge } from "lucide-react";
import { Vehicle } from "@/lib/types";

interface VehicleSpecsProps {
  vehicle: Vehicle;
}

const VehicleSpecs = ({ vehicle }: VehicleSpecsProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-gray-500">Transmission</p>
          <p className="font-medium">{vehicle.transmission}</p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center">
          <Fuel className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-gray-500">Carburant</p>
          <p className="font-medium">{vehicle.fuel}</p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-gray-500">Places</p>
          <p className="font-medium">5</p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center">
          <Gauge className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-gray-500">Kilométrage</p>
          <p className="font-medium">Illimité</p>
        </div>
      </div>
    </div>
  );
};

export default VehicleSpecs;
