import { Car, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface NoVehiclesFoundProps {
  location?: string;
  onReset?: () => void;
}

const NoVehiclesFound = ({ location, onReset }: NoVehiclesFoundProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Car className="w-8 h-8 text-gray-400" />
      </div>
      
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">
        Aucun véhicule trouvé
      </h2>
      
      <p className="text-gray-600 mb-8 max-w-md">
        {location 
          ? `Nous n'avons pas trouvé de véhicules disponibles à "${location}". Essayez de modifier vos critères de recherche.`
          : "Nous n'avons pas trouvé de véhicules correspondant à vos critères. Essayez d'élargir votre recherche."}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        {onReset && (
          <Button 
            variant="outline" 
            onClick={onReset}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Réinitialiser les filtres
          </Button>
        )}
        
        <Button 
          onClick={() => navigate("/")}
          className="flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          Nouvelle recherche
        </Button>
      </div>
    </div>
  );
};

export default NoVehiclesFound; 