
import { CheckCircle } from "lucide-react";

interface AdditionalOptionProps {
  option: {
    id: string;
    name: string;
    price: number;
    description: string;
  };
  selected: boolean;
  onToggle: (optionId: string) => void;
}

export const AdditionalOption = ({ option, selected, onToggle }: AdditionalOptionProps) => {
  return (
    <div 
      key={option.id}
      className={`p-3 border rounded-lg cursor-pointer transition-all ${
        selected 
          ? 'border-primary bg-primary/5' 
          : 'hover:border-primary/50'
      }`}
      onClick={() => onToggle(option.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-5 h-5 rounded border flex items-center justify-center ${
            selected ? 'bg-primary border-primary' : 'border-gray-300'
          }`}>
            {selected && <CheckCircle className="w-4 h-4 text-white" />}
          </div>
          <div>
            <p className="font-medium text-sm">{option.name}</p>
            <p className="text-xs text-gray-500">{option.description}</p>
          </div>
        </div>
        <span className="text-sm font-medium">{option.price} Dh</span>
      </div>
    </div>
  );
};
