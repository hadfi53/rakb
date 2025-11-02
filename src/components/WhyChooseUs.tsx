
import { Shield, Clock, PiggyBank, HeartHandshake } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Location sécurisée",
    description: "Vérification des profils et assurance complète incluse pour votre tranquillité."
  },
  {
    icon: Clock,
    title: "Réservation rapide",
    description: "Réservez votre véhicule en quelques minutes, 24h/24 et 7j/7."
  },
  {
    icon: PiggyBank,
    title: "Prix avantageux",
    description: "Économisez jusqu'à 40% par rapport aux agences traditionnelles."
  },
  {
    icon: HeartHandshake,
    title: "Support client dédié",
    description: "Notre équipe est disponible pour vous accompagner à chaque étape."
  }
];

const WhyChooseUs = () => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
            Pourquoi choisir RAKB ?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            La solution la plus simple et sécurisée pour la location de voitures au Maroc
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 bg-white rounded-lg border border-gray-100 hover:shadow-medium transition-all duration-300 animate-fadeIn"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
