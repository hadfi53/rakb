
import { Car } from "lucide-react";
import { Input } from "@/components/ui/input";

type VehicleBasicInfoProps = {
  brand: string;
  model: string;
  onBrandChange: (value: string) => void;
  onModelChange: (value: string) => void;
};

const VehicleBasicInfo = ({ brand, model, onBrandChange, onModelChange }: VehicleBasicInfoProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Marque</label>
        <div className="relative">
          <Car className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <Input
            placeholder="ex: Toyota"
            className="pl-10"
            value={brand}
            onChange={(e) => onBrandChange(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Modèle</label>
        <div className="relative">
          <Car className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <Input
            placeholder="ex: Corolla"
            className="pl-10"
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            required
          />
        </div>
      </div>
    </div>
  );
};

export default VehicleBasicInfo;
