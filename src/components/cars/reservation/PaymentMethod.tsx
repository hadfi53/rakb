
import { Label } from "@/components/ui/label";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { LucideIcon } from "lucide-react";

interface PaymentMethodProps {
  method: {
    id: string;
    name: string;
    icon: LucideIcon;
  };
  selected: boolean;
}

export const PaymentMethod = ({ method, selected }: PaymentMethodProps) => {
  return (
    <div 
      className={`p-3 border rounded-lg transition-all cursor-pointer ${
        selected 
          ? 'border-primary bg-primary/5' 
          : 'hover:border-primary/50'
      }`}
    >
      <div className="flex items-center space-x-3">
        <RadioGroupItem value={method.id} id={method.id} />
        <div className="flex items-center gap-2">
          <method.icon className="w-5 h-5 text-gray-600" />
          <Label htmlFor={method.id} className="font-medium cursor-pointer">
            {method.name}
          </Label>
        </div>
      </div>
    </div>
  );
};
