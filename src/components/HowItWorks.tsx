
import { Car, CheckSquare, User } from "lucide-react";

const steps = [
  {
    icon: Car,
    title: "Choisissez votre véhicule",
    description: "Parcourez notre large sélection de véhicules et trouvez celui qui vous convient.",
  },
  {
    icon: CheckSquare,
    title: "Réservez en quelques clics",
    description: "Effectuez votre réservation rapidement et en toute sécurité.",
  },
  {
    icon: User,
    title: "Récupérez votre véhicule",
    description: "Récupérez votre véhicule à l'agence ou en livraison et profitez de votre location.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Comment ça marche ?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Location de voiture simple, sécurisée et économique avec des agences professionnelles
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow animate-fadeIn"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <step.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
