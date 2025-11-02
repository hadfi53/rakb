
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ShieldCheck } from "lucide-react";

interface AdvancedFiltersProps {
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  selectedTransmission: string;
  setSelectedTransmission: (transmission: string) => void;
  showPremiumOnly: boolean;
  setShowPremiumOnly: (value: boolean) => void;
  availableBrands: string[];
}

const AdvancedFilters = ({
  selectedBrand,
  setSelectedBrand,
  selectedTransmission,
  setSelectedTransmission,
  showPremiumOnly,
  setShowPremiumOnly,
  availableBrands,
}: AdvancedFiltersProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Transmission
        </label>
        <Select value={selectedTransmission} onValueChange={setSelectedTransmission}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Toutes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="manual">Manuelle</SelectItem>
            <SelectItem value="automatic">Automatique</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Marque
        </label>
        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Toutes les marques" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les marques</SelectItem>
            {availableBrands.map(brand => (
              <SelectItem key={brand} value={brand}>{brand}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Button
          variant={showPremiumOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowPremiumOnly(!showPremiumOnly)}
          className="w-full justify-start gap-2"
        >
          <ShieldCheck className="w-4 h-4" />
          Véhicules Premium uniquement
        </Button>
      </div>
    </div>
  );
};

export default AdvancedFilters;
