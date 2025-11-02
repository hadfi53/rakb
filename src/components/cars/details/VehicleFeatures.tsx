
import { Check } from "lucide-react";

const features = ["GPS", "Bluetooth", "Climatisation", "USB", "ABS", "Airbags"];

const VehicleFeatures = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Équipements</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {features.map((feature) => (
          <div key={feature} className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary/5 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-primary" />
            </div>
            <span className="text-gray-600">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VehicleFeatures;
