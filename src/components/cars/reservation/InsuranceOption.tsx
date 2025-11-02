
import { CheckCircle, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroupItem } from "@/components/ui/radio-group";

interface InsuranceOptionProps {
  option: {
    id: string;
    name: string;
    description: string;
    price: number;
    caution: number;
    features: string[];
  };
  selected: boolean;
}

export const InsuranceOption = ({ option, selected }: InsuranceOptionProps) => {
  return (
    <div 
      className={`p-4 border rounded-lg transition-all ${
        selected 
          ? 'border-primary bg-primary/5' 
          : 'hover:border-primary/50'
      }`}
    >
      <div className="flex items-start space-x-3">
        <RadioGroupItem value={option.id} id={option.id} />
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <Label htmlFor={option.id} className="font-medium">
              {option.name}
            </Label>
            <span className="text-sm font-medium text-primary">{option.price} Dh/jour</span>
          </div>
          <p className="text-sm text-gray-500 mt-1 mb-2">
            {option.description}
          </p>
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <AlertCircle className="w-4 h-4 mr-1 text-amber-500" />
            <span>Caution : {option.caution > 0 ? `${option.caution} Dh` : "Aucune caution"}</span>
          </div>
          <ul className="space-y-1">
            {option.features.map((feature, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-primary" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
