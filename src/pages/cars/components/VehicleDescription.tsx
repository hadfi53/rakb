
import { Textarea } from "@/components/ui/textarea";

type VehicleDescriptionProps = {
  description: string;
  onDescriptionChange: (value: string) => void;
};

const VehicleDescription = ({ description, onDescriptionChange }: VehicleDescriptionProps) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Description</label>
      <Textarea
        placeholder="Décrivez votre véhicule (équipements, état, etc.)"
        className="h-32"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        required
      />
    </div>
  );
};

export default VehicleDescription;
