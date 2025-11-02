import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Book, 
  Car, 
  Shield, 
  DollarSign,
  FileText,
  CheckCircle,
  ArrowRight,
  Users,
  Settings
} from "lucide-react";

const Guide = () => {
  const [activeTab, setActiveTab] = useState("renter");

  const renterGuides = [
    {
      icon: Car,
      title: "Votre première réservation",
      steps: [
        "Créez votre compte et vérifiez votre identité",
        "Recherchez un véhicule selon vos critères",
        "Consultez les détails et les avis",
        "Effectuez votre réservation et le paiement",
        "Récupérez le véhicule à l'agence"
      ]
    },
    {
      icon: Shield,
      title: "Assurance et protection",
      steps: [
        "Comprenez la couverture incluse",
        "Vérifiez les conditions et exclusions",
        "En cas d'accident, contactez immédiatement",
        "Remplissez le constat amiable",
        "Contactez notre assistance 24/7"
      ]
    },
    {
      icon: DollarSign,
      title: "Tarifs et paiements",
      steps: [
        "Consultez le prix total avant réservation",
        "Vérifiez les frais additionnels possibles",
        "Le paiement est sécurisé en ligne",
        "Une caution peut être prélevée",
        "Récupération après vérification du véhicule"
      ]
    }
  ];

  const ownerGuides = [
    {
      icon: Users,
      title: "Démarrage en tant qu'agence",
      steps: [
        "Inscrivez-vous et créez votre profil agence",
        "Téléchargez les documents requis",
        "Validez votre compte après vérification",
        "Ajoutez vos premiers véhicules",
        "Configurez vos disponibilités et tarifs"
      ]
    },
    {
      icon: Settings,
      title: "Optimiser vos réservations",
      steps: [
        "Mettez à jour vos disponibilités régulièrement",
        "Répondez rapidement aux demandes",
        "Utilisez des photos de qualité",
        "Configurez des prix compétitifs",
        "Mettez à jour les statuts des véhicules"
      ]
    },
    {
      icon: DollarSign,
      title: "Gérer vos revenus",
      steps: [
        "Consultez vos statistiques régulièrement",
        "Suivez vos paiements en attente",
        "Configurez vos informations bancaires",
        "Consultez les rapports détaillés",
        "Optimisez selon les données analytics"
      ]
    }
  ];

  const tips = {
    renter: [
      "Réservez à l'avance pour avoir plus de choix",
      "Lisez attentivement les avis des autres locataires",
      "Vérifiez le véhicule avant de partir",
      "Prenez des photos si vous remarquez des défauts",
      "Respectez les dates et heures convenues"
    ],
    owner: [
      "Répondez rapidement aux messages des clients",
      "Maintenez vos véhicules en excellent état",
      "Soyez transparent sur les conditions",
      "Communiquez clairement les points de rendez-vous",
      "Collectez des avis pour améliorer votre profil"
    ]
  };

  return (
    <div className="min-h-screen bg-white pt-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Book className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Guide complet RAKB
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Tout ce dont vous avez besoin pour tirer le meilleur parti de la plateforme
            </p>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-12">
                <TabsTrigger value="renter" className="text-lg">
                  Guide Locataire
                </TabsTrigger>
                <TabsTrigger value="owner" className="text-lg">
                  Guide Agence
                </TabsTrigger>
              </TabsList>

              <TabsContent value="renter">
                <div className="space-y-12">
                  {renterGuides.map((guide, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <guide.icon className="w-6 h-6 text-primary" />
                          </div>
                          <CardTitle className="text-2xl">{guide.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ol className="space-y-3">
                          {guide.steps.map((step, stepIndex) => (
                            <li key={stepIndex} className="flex items-start gap-3">
                              <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                {stepIndex + 1}
                              </span>
                              <span className="text-gray-700 pt-0.5">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </CardContent>
                    </Card>
                  ))}

                  <Card className="bg-primary/5">
                    <CardHeader>
                      <CardTitle>Conseils pour les locataires</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {tips.renter.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="owner">
                <div className="space-y-12">
                  {ownerGuides.map((guide, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <guide.icon className="w-6 h-6 text-primary" />
                          </div>
                          <CardTitle className="text-2xl">{guide.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ol className="space-y-3">
                          {guide.steps.map((step, stepIndex) => (
                            <li key={stepIndex} className="flex items-start gap-3">
                              <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                {stepIndex + 1}
                              </span>
                              <span className="text-gray-700 pt-0.5">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </CardContent>
                    </Card>
                  ))}

                  <Card className="bg-primary/5">
                    <CardHeader>
                      <CardTitle>Conseils pour les agences</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {tips.owner.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Ressources supplémentaires</h2>
              <p className="text-gray-600">
                Documents et liens utiles pour approfondir vos connaissances
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Conditions d'utilisation</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Lisez nos conditions générales
                  </p>
                  <Button variant="outline" asChild size="sm">
                    <Link to="/legal">Lire</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Assurance</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Détails sur la couverture
                  </p>
                  <Button variant="outline" asChild size="sm">
                    <Link to="/legal/insurance">En savoir plus</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Book className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">FAQ</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Questions fréquentes
                  </p>
                  <Button variant="outline" asChild size="sm">
                    <Link to="/faq">Consulter</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary/10 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Besoin d'aide supplémentaire ?
            </h2>
            <p className="text-gray-600 mb-8">
              Notre équipe est disponible pour répondre à toutes vos questions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="outline">
                <Link to="/help">
                  <Book className="mr-2" />
                  Centre d'aide
                </Link>
              </Button>
              <Button asChild size="lg">
                <Link to="/contact">
                  Nous contacter
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

export default Guide;

