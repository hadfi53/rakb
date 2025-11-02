
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type VehicleSpecsProps = {
  transmission: string;
  fuel: string;
  onTransmissionChange: (value: string) => void;
  onFuelChange: (value: string) => void;
};

const VehicleSpecs = ({ transmission, fuel, onTransmissionChange, onFuelChange }: VehicleSpecsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Transmission</label>
        <Select value={transmission} onValueChange={onTransmissionChange}>
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="Sélectionnez" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="manual">Manuelle</SelectItem>
            <SelectItem value="automatic">Automatique</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Carburant</label>
        <Select value={fuel} onValueChange={onFuelChange}>
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="Sélectionnez" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="diesel">Diesel</SelectItem>
            <SelectItem value="essence">Essence</SelectItem>
            <SelectItem value="hybrid">Hybride</SelectItem>
            <SelectItem value="electric">Électrique</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default VehicleSpecs;
