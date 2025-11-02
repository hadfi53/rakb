
import { Card, CardContent } from "@/components/ui/card";
import { Info, Key, Shield } from "lucide-react";

const RentalConditions = () => {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <h3 className="font-semibold text-lg">Conditions de location</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start">
            <Info className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
            <p>Âge minimum : 21 ans</p>
          </div>
          <div className="flex items-start">
            <Key className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
            <p>2 ans de permis minimum</p>
          </div>
          <div className="flex items-start">
            <Shield className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
            <p>Caution : 5000 Dh</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RentalConditions;
