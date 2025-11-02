
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { RegisterBenefits } from "./RegisterBenefits";
import { useIsMobile } from "@/hooks/use-mobile";

export const RegisterSidebar = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`relative ${isMobile ? 'h-[35vh]' : 'w-1/2 min-h-screen'} bg-primary-dark`}>
      <img 
        src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80" 
        alt="Peer to peer car rental" 
        className="w-full h-full object-cover opacity-30 absolute inset-0"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/80 to-primary/70"></div>
      
      <div className="absolute top-0 left-0 p-4 md:p-6">
        <Link to="/" className="group inline-flex items-center text-white font-medium hover:text-white/90 transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1 transition-transform group-hover:-translate-x-1" />
          Retour
        </Link>
      </div>
      
      {/* Hide benefits on very small screens */}
      <div className={`relative z-10 flex flex-col h-full justify-center px-4 md:px-8 py-6 md:py-12 text-white ${isMobile ? 'hidden sm:flex' : ''}`}>
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 md:mb-6">Rejoignez la communauté RAKB</h2>
          <p className="text-base md:text-lg mb-6 md:mb-8 text-white/80">La plateforme de référence pour la location de voitures au Maroc</p>
          
          <RegisterBenefits />
        </div>
      </div>
    </div>
  );
};
