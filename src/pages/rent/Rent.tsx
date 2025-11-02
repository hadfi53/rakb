import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SearchBar from "@/components/SearchBar";
import { 
  Car, 
  Shield, 
  Clock, 
  MapPin,
  CheckCircle,
  Star,
  ArrowRight
} from "lucide-react";

const Rent = () => {
  const features = [
    {
      icon: Car,
      title: "Grand choix de véhicules",
      description: "Des berlines économiques aux SUV spacieux, trouvez le véhicule parfait pour votre voyage."
    },
    {
      icon: Shield,
      title: "Assurance incluse",
      description: "Toutes nos locations incluent une assurance tous risques pour votre tranquillité d'esprit."
    },
    {
      icon: Clock,
      title: "Réservation rapide",
      description: "Réservez en quelques minutes et recevez une confirmation instantanée."
    },
    {
      icon: MapPin,
      title: "Livraison flexible",
      description: "Récupérez votre véhicule à l'agence, à l'aéroport ou demandez une livraison."
    }
  ];

  const benefits = [
    "Vérification d'identité simplifiée",
    "Paiement sécurisé en ligne",
    "Annulation flexible selon les conditions",
    "Support client disponible 24/7",
    "Assistance routière incluse",
    "Véhicules vérifiés et entretenus"
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-white pt-32 pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Louer une voiture n'a jamais été aussi simple
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Trouvez et réservez le véhicule idéal en quelques clics. 
              Des agences professionnelles, des véhicules vérifiés, une location en toute sécurité.
            </p>
            <div className="max-w-2xl mx-auto mb-12">
              <SearchBar />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Pourquoi louer avec RAKB ?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Une expérience de location moderne, sécurisée et adaptée à vos besoins
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Tous les avantages inclus</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>

            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-8 text-center">
                <Star className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4">
                  Des milliers de véhicules vérifiés
                </h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Tous nos véhicules proviennent d'agences de location professionnelles certifiées. 
                  Chaque véhicule est inspecté et entretenu régulièrement pour garantir votre sécurité.
                </p>
                <Button asChild size="lg">
                  <Link to="/search">
                    Voir les véhicules disponibles
                    <ArrowRight className="ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Comment ça fonctionne ?</h2>
            </div>

            <div className="space-y-8">
              {[
                {
                  step: "1",
                  title: "Recherchez votre véhicule",
                  description: "Utilisez notre moteur de recherche avec filtres avancés pour trouver le véhicule qui correspond à vos critères : dates, localisation, type, prix."
                },
                {
                  step: "2",
                  title: "Consultez les détails",
                  description: "Vérifiez les photos, les équipements, les avis et les conditions de location du véhicule sélectionné."
                },
                {
                  step: "3",
                  title: "Réservez en ligne",
                  description: "Remplissez le formulaire de réservation, effectuez le paiement sécurisé et recevez votre confirmation instantanément."
                },
                {
                  step: "4",
                  title: "Récupérez votre véhicule",
                  description: "Rencontrez l'agence au point de rendez-vous convenu, vérifiez le véhicule et partez en toute sécurité."
                }
              ].map((item, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                      {item.step}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary/10 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Prêt à réserver votre véhicule ?
            </h2>
            <p className="text-gray-600 mb-8">
              Commencez votre recherche dès maintenant et trouvez le véhicule parfait pour votre prochain voyage.
            </p>
            <Button asChild size="lg">
              <Link to="/search">
                Rechercher un véhicule
                <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Rent;

