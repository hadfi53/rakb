
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

type LocationInputProps = {
  location: string;
  onLocationChange: (value: string) => void;
};

const LocationInput = ({ location, onLocationChange }: LocationInputProps) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Localisation</label>
      <div className="relative">
        <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        <Input
          placeholder="ex: Casablanca"
          className="pl-10"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          required
        />
      </div>
    </div>
  );
};

export default LocationInput;
