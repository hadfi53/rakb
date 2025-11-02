
import { CheckCircle2 } from "lucide-react";

export const RegisterBenefits = () => {
  const benefits = [
    "Accédez à des milliers de véhicules dans tout le Maroc",
    "Réservez rapidement et en toute sécurité",
    "Gagnez de l'argent en partageant votre véhicule",
    "Support client disponible 24/7"
  ];

  return (
    <div className="space-y-3 md:space-y-4">
      {benefits.map((benefit, index) => (
        <div key={index} className="flex items-center space-x-3">
          <CheckCircle2 className="h-5 w-5 text-primary-light flex-shrink-0" />
          <span className="text-sm md:text-base text-white/90">{benefit}</span>
        </div>
      ))}
    </div>
  );
};
