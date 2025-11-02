import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Building2, 
  Target, 
  Users, 
  Shield, 
  TrendingUp, 
  Award,
  ArrowRight,
  CheckCircle,
  MapPin,
  Calendar
} from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Shield,
      title: "Sécurité",
      description: "La sécurité de nos utilisateurs est notre priorité absolue avec des vérifications complètes et une assurance tous risques."
    },
    {
      icon: Users,
      title: "Communauté",
      description: "Nous construisons une communauté de confiance entre locataires et agences de location professionnelles."
    },
    {
      icon: Target,
      title: "Innovation",
      description: "Nous utilisons la technologie pour simplifier et améliorer l'expérience de location de véhicules."
    },
    {
      icon: TrendingUp,
      title: "Excellence",
      description: "Nous visons l'excellence dans chaque aspect de notre service, de la réservation à la fin de la location."
    }
  ];

  const milestones = [
    { year: "2024", title: "Lancement de RAKB", description: "Début de notre aventure pour révolutionner la location de voitures au Maroc" },
    { year: "2024", title: "100+ véhicules", description: "Notre flotte s'étend avec des partenaires agences de confiance" },
    { year: "2024", title: "1000+ locations", description: "Mille locations réussies et clients satisfaits" },
    { year: "2024", title: "Expansion nationale", description: "Disponible dans toutes les grandes villes marocaines" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-white pt-32 pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              À propos de RAKB
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Votre plateforme de référence pour la location de véhicules au Maroc. 
              Nous connectons les locataires avec des agences de location professionnelles.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <Building2 className="w-16 h-16 text-primary mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">Notre mission</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                RAKB est née d'une vision simple : rendre la location de véhicules accessible, 
                sécurisée et simple pour tous les Marocains. Nous travaillons avec des agences 
                professionnelles certifiées pour vous offrir le meilleur service.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Notre vision</h3>
                  <p className="text-gray-600">
                    Devenir la plateforme de référence pour la location de véhicules au Maroc, 
                    en offrant une expérience exceptionnelle à chaque étape du processus de location.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Notre engagement</h3>
                  <p className="text-gray-600">
                    Nous nous engageons à offrir un service de qualité, avec des véhicules vérifiés, 
                    des agences certifiées et un support client disponible 24/7 pour votre tranquillité d'esprit.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Nos valeurs</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Les principes qui guident chaque décision et chaque interaction sur notre plateforme
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Notre parcours</h2>
            <p className="text-gray-600">Les étapes importantes de notre développement</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                      <Calendar className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-primary font-semibold">{milestone.year}</span>
                      <h3 className="text-xl font-semibold">{milestone.title}</h3>
                    </div>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Pourquoi choisir RAKB ?</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                "Agences de location professionnelles vérifiées",
                "Processus de réservation simple et rapide",
                "Assurance tous risques incluse",
                "Support client disponible 24/7",
                "Grand choix de véhicules disponibles",
                "Paiements sécurisés et garantis",
                "Assistance routière en cas de besoin",
                "Vérification d'identité pour plus de sécurité"
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{item}</span>
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
            <Award className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">
              Rejoignez l'aventure RAKB
            </h2>
            <p className="text-gray-600 mb-8">
              Que vous souhaitiez louer un véhicule ou que vous représentiez une agence de location, 
              RAKB vous offre la solution adaptée.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/search">
                  Rechercher un véhicule
                  <ArrowRight className="ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/become-owner">
                  Rejoindre en tant qu'agence
                  <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;

