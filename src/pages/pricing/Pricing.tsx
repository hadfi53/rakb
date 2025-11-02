import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, TrendingUp, Shield, HeadphonesIcon, BarChart } from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      price: "0%",
      description: "Parfait pour commencer",
      features: [
        "Commission sur chaque location",
        "Page de profil d'agence",
        "Gestion des réservations",
        "Support email",
        "Statistiques de base"
      ],
      highlighted: false
    },
    {
      name: "Pro",
      price: "12%",
      description: "Pour les agences en croissance",
      features: [
        "Commission réduite",
        "Mise en avant dans les résultats",
        "Gestion avancée des réservations",
        "Support prioritaire",
        "Statistiques détaillées",
        "Marketing personnalisé"
      ],
      highlighted: true
    },
    {
      name: "Premium",
      price: "15%",
      description: "Maximum de visibilité",
      features: [
        "Commission optimisée",
        "Placement premium garanti",
        "Gestion complète multi-véhicules",
        "Support dédié 24/7",
        "Statistiques avancées & analytics",
        "Campagnes marketing incluses",
        "Badge premium visible"
      ],
      highlighted: false
    }
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: "Augmentez vos revenus",
      description: "Accédez à des milliers de clients actifs qui recherchent des véhicules de location."
    },
    {
      icon: Shield,
      title: "Sécurité garantie",
      description: "Tous nos clients sont vérifiés et assurés. Paiements sécurisés et garantis."
    },
    {
      icon: HeadphonesIcon,
      title: "Support dédié",
      description: "Une équipe à votre service pour vous accompagner dans votre croissance."
    },
    {
      icon: BarChart,
      title: "Analytics complets",
      description: "Suivez vos performances avec des statistiques détaillées et des insights actionnables."
    }
  ];

  return (
    <div className="min-h-screen bg-white pt-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Tarifs pour les agences
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Des tarifs flexibles adaptés à la taille et aux besoins de votre agence
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={plan.highlighted ? "border-primary border-2 relative" : ""}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                      Populaire
                    </span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-600 ml-2">commission</span>
                  </div>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    asChild 
                    className="w-full" 
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    <Link to="/become-owner">
                      Choisir {plan.name}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Avantages de rejoindre RAKB</h2>
              <p className="text-gray-600">
                Pourquoi les agences choisissent notre plateforme
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <benefit.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                        <p className="text-gray-600">{benefit.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Comment ça fonctionne ?</h2>
            </div>

            <div className="space-y-8">
              {[
                {
                  step: "1",
                  title: "Créez votre compte agence",
                  description: "Inscrivez-vous et remplissez les informations de votre agence. Notre équipe vérifie votre dossier rapidement."
                },
                {
                  step: "2",
                  title: "Ajoutez vos véhicules",
                  description: "Listez vos véhicules avec photos, descriptions et tarifs. Configurez vos disponibilités et conditions."
                },
                {
                  step: "3",
                  title: "Recevez des réservations",
                  description: "Les clients découvrent vos véhicules et réservent directement. Vous recevez des notifications pour chaque demande."
                },
                {
                  step: "4",
                  title: "Gérez et développez",
                  description: "Suivez vos réservations, vos revenus et vos statistiques depuis votre tableau de bord personnalisé."
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

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Questions fréquentes</h2>
            </div>

            <div className="space-y-6">
              {[
                {
                  question: "Quels sont les frais d'inscription ?",
                  answer: "L'inscription est gratuite. Nous prélevons uniquement une commission sur les locations réalisées."
                },
                {
                  question: "Comment sont versés les paiements ?",
                  answer: "Les paiements sont sécurisés et versés directement sur votre compte selon le calendrier convenu, généralement sous 48h après la fin de la location."
                },
                {
                  question: "Puis-je changer de plan ?",
                  answer: "Oui, vous pouvez changer de plan à tout moment depuis votre tableau de bord. Les changements prennent effet immédiatement."
                },
                {
                  question: "Que se passe-t-il en cas d'annulation ?",
                  answer: "Les conditions d'annulation sont définies par votre agence. Nous vous aidons à gérer les annulations selon votre politique."
                }
              ].map((faq, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary/10 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Prêt à développer votre activité ?
            </h2>
            <p className="text-gray-600 mb-8">
              Rejoignez des centaines d'agences qui font confiance à RAKB pour développer leur activité.
            </p>
            <Button asChild size="lg">
              <Link to="/become-owner">
                Rejoindre en tant qu'agence
                <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;

