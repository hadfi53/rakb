
import { Button } from "@/components/ui/button";
import { Car, Truck, Zap, Crown, Users, CircleDot } from "lucide-react";

interface CategoryButtonProps {
  category: string;
  isSelected: boolean;
  onClick: () => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "SUV":
      return Truck;
    case "Berline":
      return Car;
    case "Électrique":
      return Zap;
    case "Luxe":
      return Crown;
    case "Familiale":
      return Users;
    default:
      return CircleDot;
  }
};

const CategoryButton = ({ category, isSelected, onClick }: CategoryButtonProps) => {
  const Icon = getCategoryIcon(category);

  return (
    <Button
      variant={isSelected ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className="w-full flex items-center justify-start gap-2 py-4 transition-all duration-300 hover:scale-[1.02]"
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{category}</span>
    </Button>
  );
};

export default CategoryButton;
