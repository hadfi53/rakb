
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const FloatingCTA = () => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        asChild
        className="bg-primary hover:bg-primary-dark shadow-medium transition-all duration-300 hover:scale-105"
        size="lg"
      >
        <Link to="/help" aria-label="Centre d'aide" tabIndex={0}>
          <Phone className="w-4 h-4 mr-2" />
          Besoin d'aide ?
        </Link>
      </Button>
    </div>
  );
};

export default FloatingCTA;
