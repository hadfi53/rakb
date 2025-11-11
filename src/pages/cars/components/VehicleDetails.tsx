
import { DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";

type VehicleDetailsProps = {
  year: string;
  price: string;
  onYearChange: (value: string) => void;
  onPriceChange: (value: string) => void;
};

const VehicleDetails = ({ year, price, onYearChange, onPriceChange }: VehicleDetailsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Année</label>
        <Input
          type="number"
          placeholder="ex: 2020"
          value={year}
          onChange={(e) => {
            if (import.meta.env.DEV) {
              console.log('🔍 [VehicleDetails] Year onChange called with:', e.target.value);
            }
            onYearChange(e.target.value);
          }}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Prix par jour (Dh)</label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <Input
            type="number"
            placeholder="ex: 250"
            className="pl-10"
            value={price}
            onChange={(e) => {
              if (import.meta.env.DEV) {
                console.log('🔍 [VehicleDetails] Price onChange called with:', e.target.value);
              }
              onPriceChange(e.target.value);
            }}
            required
          />
        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;
